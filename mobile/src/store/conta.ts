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
import { useCharacters } from './useCharacters';
import { useDice } from './useDice';
import { useMaps } from './useMaps';
import { useCalendar } from './useCalendar';
import { useNotifications } from './useNotifications';
import { useTables } from './useTables';

export interface Conta {
  apelido: string;
  email: string;
  /** Foto do perfil: data URL (JPEG 256 px), igual ao web, ou endereço de imagem do servidor. */
  avatarUrl?: string;
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
  limparEstadoDaConta();
  contaAtiva = { apelido: resposta.username, email: resposta.email };
  persistProfile();
  emit();
  void carregarPerfil();
}

function limparEstadoDaConta() {
  useTables.getState().clear(); useCalendar.getState().clear(); useNotifications.getState().clear();
  useCharacters.getState().clear();
  useDice.getState().clear(); useMaps.getState().clear();
}

interface PerfilApi { userId: string; username: string; email: string; plan: string; avatarUrl?: string | null }

/** Traz nome, e-mail e foto da conta, para todos os aparelhos mostrarem o mesmo perfil. */
export async function carregarPerfil(): Promise<void> {
  if (!contaAtiva) return;
  try {
    const data = await request<PerfilApi>('/users/me');
    if (!contaAtiva) return;
    contaAtiva = { ...contaAtiva, apelido: data.username, email: data.email, avatarUrl: data.avatarUrl ?? undefined };
    persistProfile();
    emit();
  } catch {
    // sem rede: segue com o perfil guardado
  }
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

/** Signs in (or signs up) with a Google ID token. Throws ApiError (401 = token rejected). */
export async function autenticarComGoogle(idToken: string): Promise<void> {
  const resposta = await request<AuthResponse>('/auth/google', {
    method: 'POST',
    auth: false,
    body: { idToken },
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
    void carregarPerfil();
    return true;
  } catch {
    return false;
  }
}

export function obterContaAtiva(): Conta | null {
  return contaAtiva;
}

/** Salva nome de usuário e/ou foto (PUT /users/me). Lança ApiError (409 = nome já em uso). */
export async function salvarPerfil(mudancas: { apelido?: string; avatarUrl?: string | null }): Promise<void> {
  if (!contaAtiva) return;
  const body: { username?: string; avatarUrl?: string } = {};
  if (mudancas.apelido !== undefined && mudancas.apelido !== contaAtiva.apelido) body.username = mudancas.apelido;
  if (mudancas.avatarUrl !== undefined && (mudancas.avatarUrl ?? undefined) !== contaAtiva.avatarUrl) body.avatarUrl = mudancas.avatarUrl ?? '';
  if (!Object.keys(body).length) return;
  const data = await request<PerfilApi>('/users/me', { method: 'PUT', body });
  contaAtiva = { ...(contaAtiva as Conta), apelido: data.username, avatarUrl: data.avatarUrl ?? undefined };
  persistProfile();
  emit();
}

/** Troca o e-mail de login. Lança ApiError (403 = senha errada, 409 = e-mail em uso). */
export async function alterarEmail(novoEmail: string, senhaAtual: string): Promise<void> {
  const data = await request<PerfilApi>('/users/me/email', { method: 'PUT', body: { newEmail: novoEmail, currentPassword: senhaAtual } });
  if (!contaAtiva) return;
  contaAtiva = { ...contaAtiva, email: data.email };
  persistProfile();
  emit();
}

/** Troca a senha. Os outros aparelhos são desconectados; o servidor devolve tokens novos para este. */
export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  const tokens = await request<{ accessToken: string; refreshToken: string }>('/users/me/password', {
    method: 'PUT',
    body: { currentPassword: senhaAtual, newPassword: novaSenha },
  });
  await setSession(tokens);
}

/** Apaga a conta (fichas, mesas e imagens vão junto) e encerra a sessão neste aparelho. */
export async function excluirConta(): Promise<void> {
  await request<void>('/auth/me', { method: 'DELETE' });
  await clearSession();
  limparEstadoDaConta();
  contaAtiva = null;
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
  limparEstadoDaConta();
  contaAtiva = null;
  emit();
}

// When the refresh token is rejected the session is over: drop the local account.
onSessionExpired(() => {
  limparEstadoDaConta();
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
