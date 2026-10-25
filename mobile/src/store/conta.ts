import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  AuthResponse,
  clearSession,
  currentRefreshToken,
  hasStoredSession,
  onSessionExpired,
  request,
  setSession,
} from '../services/api';
import { limparMesas } from './mesas';

export interface Conta {
  apelido: string;
  email: string;
  fotoUri?: string;
}

const PROFILE_KEY = '@rollcore/conta-v2';

let contaAtiva: Conta | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function persistProfile() {
  const write = contaAtiva
    ? AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(contaAtiva))
    : AsyncStorage.removeItem(PROFILE_KEY);
  void write.catch((error) => console.warn('Falha ao salvar o perfil localmente', error));
}

async function abrirSessao(resposta: AuthResponse): Promise<void> {
  await setSession(resposta);
  let fotoUri: string | undefined;
  try {
    // keep the locally chosen photo when the same account logs in again
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const previous = raw ? (JSON.parse(raw) as Conta) : null;
    if (previous && previous.email === resposta.email) fotoUri = previous.fotoUri;
  } catch {
    // ignore corrupt local profile
  }
  limparMesas();
  contaAtiva = { apelido: resposta.username, email: resposta.email, fotoUri };
  persistProfile();
  emit();
}

/** Creates the account on the API and signs in. Throws ApiError. */
export async function cadastrarConta(input: { apelido: string; email: string; senha: string }): Promise<void> {
  const resposta = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: { username: input.apelido.trim(), email: input.email.trim().toLocaleLowerCase('pt-BR'), password: input.senha },
  });
  await abrirSessao(resposta);
}

/** Signs in on the API. Throws ApiError (401 = wrong e-mail or password). */
export async function autenticarConta(email: string, senha: string): Promise<void> {
  const resposta = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email: email.trim().toLocaleLowerCase('pt-BR'), password: senha },
  });
  await abrirSessao(resposta);
}

/** Restores a previous session at app start. No network call is needed here: the
 *  first authenticated request refreshes the access token when it has expired. */
export async function restaurarSessao(): Promise<boolean> {
  if (contaAtiva) return true;
  if (!(await hasStoredSession())) return false;
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = raw ? (JSON.parse(raw) as Conta) : null;
    if (!profile) {
      await clearSession();
      return false;
    }
    contaAtiva = profile;
    emit();
    return true;
  } catch {
    return false;
  }
}

export function obterContaAtiva(): Conta | null {
  return contaAtiva;
}

// The API has no profile-editing endpoint yet, so nickname and photo changes are
// kept on this device only.
export function atualizarApelido(apelido: string): void {
  const novoApelido = apelido.trim();
  if (!novoApelido || !contaAtiva) return;
  contaAtiva = { ...contaAtiva, apelido: novoApelido };
  persistProfile();
  emit();
}

export function atualizarFotoPerfil(fotoUri?: string): void {
  if (!contaAtiva) return;
  contaAtiva = { ...contaAtiva, fotoUri };
  persistProfile();
  emit();
}

/** Revokes the refresh token on the server (best effort) and clears local state. */
export async function encerrarSessao(): Promise<void> {
  const refreshToken = await currentRefreshToken();
  if (refreshToken) {
    try {
      await request<void>('/auth/logout', { method: 'POST', auth: false, body: { refreshToken } });
    } catch {
      // offline or already revoked: still sign out locally
    }
  }
  await clearSession();
  limparMesas();
  contaAtiva = null;
  emit();
}

// When the refresh token is rejected the session is over: drop the local account.
onSessionExpired(() => {
  limparMesas();
  contaAtiva = null;
  emit();
});

export function useContaAtiva(): Conta | null {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return contaAtiva;
}
