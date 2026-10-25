import { API_URL, REQUEST_TIMEOUT_MS } from './config';
import { clearTokens, loadTokens, saveTokens, TokenPair } from './tokenStorage';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AuthResponse extends TokenPair {
  userId: string;
  email: string;
  username: string;
}

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
/** Called when the refresh token is rejected and the user must log in again. */
export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

let tokens: TokenPair | null = null;
let tokensLoaded = false;

async function currentTokens(): Promise<TokenPair | null> {
  if (!tokensLoaded) {
    tokens = await loadTokens();
    tokensLoaded = true;
  }
  return tokens;
}

export async function setSession(next: TokenPair): Promise<void> {
  tokens = { accessToken: next.accessToken, refreshToken: next.refreshToken };
  tokensLoaded = true;
  await saveTokens(tokens);
}

export async function clearSession(): Promise<void> {
  tokens = null;
  tokensLoaded = true;
  await clearTokens();
}

export async function hasStoredSession(): Promise<boolean> {
  return (await currentTokens()) !== null;
}

export async function currentRefreshToken(): Promise<string | null> {
  return (await currentTokens())?.refreshToken ?? null;
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw new ApiError(0, 'O servidor demorou demais para responder. Tente novamente em instantes.');
    }
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Confira sua conexão com a internet.');
  } finally {
    clearTimeout(timer);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined;
  let fields: Record<string, string> | undefined;
  try {
    const body = await response.json();
    detail = typeof body?.detail === 'string' ? body.detail : undefined;
    if (body?.fields && typeof body.fields === 'object') fields = body.fields as Record<string, string>;
  } catch {
    // empty or non-JSON body
  }
  const firstField = fields ? Object.values(fields)[0] : undefined;
  return new ApiError(response.status, firstField ?? friendlyMessage(response.status, detail), fields);
}

function friendlyMessage(status: number, detail?: string): string {
  switch (status) {
    case 400: return 'Dados inválidos. Confira os campos e tente novamente.';
    case 401: return 'Sessão inválida ou credenciais incorretas.';
    case 403: return 'Você não tem permissão para fazer isso.';
    case 404: return 'Não encontrado.';
    case 409: return detail ?? 'Conflito: a operação não pôde ser concluída.';
    case 429: return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
    default: return status >= 500 ? 'O servidor teve um problema. Tente novamente em instantes.' : (detail ?? 'Erro inesperado.');
  }
}

// Only one refresh may run at a time: the backend rotates refresh tokens and
// reuse of an old one revokes the whole session family.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const stored = await currentTokens();
      if (!stored) return false;
      try {
        const response = await rawFetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
        if (response.ok) {
          const data = (await response.json()) as AuthResponse;
          await setSession(data);
          return true;
        }
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          await clearSession();
          sessionExpiredListeners.forEach((listener) => listener());
        }
        return false;
      } catch {
        return false; // network trouble: keep the session, let the caller fail
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** false for login/register/refresh/logout, which carry no access token. */
  auth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const stored = await currentTokens();
      if (stored) headers.Authorization = `Bearer ${stored.accessToken}`;
    }
    return rawFetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  };

  let response = await send();
  // Expired access token. Older backends answered 403 with an empty body instead
  // of 401, so an empty 403 is treated the same way; a 403 carrying a JSON
  // problem (urn:rollcore:forbidden) is a real permission error and is not retried.
  const looksExpired = response.status === 401
    || (response.status === 403 && !(response.headers.get('content-type') ?? '').includes('json'));
  if (auth && looksExpired && (await refreshSession())) response = await send();

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Text safe to show to the user for any thrown value. */
export function mensagemDeErro(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.';
}
