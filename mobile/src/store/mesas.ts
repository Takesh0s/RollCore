import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { request } from '../services/api';

export interface Mesa {
  id: string;
  sistema: string;
  titulo: string;
  descricao?: string;
  papel: 'Mestre' | 'Jogador';
  proximaSessao: string;
  imagemUri?: string;
  // Filled from the API
  papelApi?: 'MASTER' | 'MODERATOR' | 'PLAYER';
  jogadores?: number;
  maxJogadores?: number;
  mestre?: string;
  capaUrl?: string;
  codigoConvite?: string; // only MASTER and MODERATOR receive it
}

interface TableSummary {
  id: string;
  name: string;
  gameSystem: string;
  description?: string | null;
  maxPlayers: number;
  playerCount: number;
  coverUrl?: string | null;
  myRole: 'MASTER' | 'MODERATOR' | 'PLAYER';
  ownerUsername: string;
}

interface TableDetail {
  table: TableSummary;
  inviteCode?: string | null;
}

const COVERS_KEY = '@rollcore/capas-v1';
const SESSAO_PADRAO = 'A definir'; // the calendar is not on the API yet

let mesas: Mesa[] = [];
let capasLocais: Record<string, string> = {};
let capasCarregadas = false;
let carregando = false;
let erro: string | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

async function carregarCapasLocais() {
  if (capasCarregadas) return;
  try {
    const raw = await AsyncStorage.getItem(COVERS_KEY);
    capasLocais = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    capasLocais = {};
  }
  capasCarregadas = true;
}

function salvarCapaLocal(id: string, uri?: string) {
  if (uri) capasLocais[id] = uri;
  else delete capasLocais[id];
  void AsyncStorage.setItem(COVERS_KEY, JSON.stringify(capasLocais)).catch(() => undefined);
}

function fromApi(table: TableSummary, codigoConvite?: string | null): Mesa {
  const capaUrl = table.coverUrl ?? undefined;
  return {
    id: table.id,
    titulo: table.name,
    sistema: table.gameSystem,
    descricao: table.description ?? undefined,
    papel: table.myRole === 'MASTER' ? 'Mestre' : 'Jogador',
    proximaSessao: SESSAO_PADRAO,
    imagemUri: capaUrl ?? capasLocais[table.id],
    papelApi: table.myRole,
    jogadores: table.playerCount,
    maxJogadores: table.maxPlayers,
    mestre: table.ownerUsername,
    capaUrl,
    codigoConvite: codigoConvite ?? undefined,
  };
}

function upsert(mesa: Mesa) {
  mesas = mesas.some((item) => item.id === mesa.id)
    ? mesas.map((item) => (item.id === mesa.id ? { ...item, ...mesa } : item))
    : [mesa, ...mesas];
  emit();
}

/** Clears the in-memory list (used on login/logout so accounts never mix). */
export function limparMesas(): void {
  mesas = [];
  erro = undefined;
  carregando = false;
  emit();
}

/** Reloads the signed-in user's tables from the API. */
export async function carregarMesas(): Promise<void> {
  carregando = true;
  erro = undefined;
  emit();
  try {
    await carregarCapasLocais();
    const lista = await request<TableSummary[]>('/tables');
    mesas = lista.map((table) => fromApi(table, mesas.find((m) => m.id === table.id)?.codigoConvite));
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Não foi possível carregar suas mesas.';
  } finally {
    carregando = false;
    emit();
  }
}

/** Loads one table including the invite code (MASTER/MODERATOR only). */
export async function carregarDetalhe(id: string): Promise<Mesa | undefined> {
  await carregarCapasLocais();
  const detalhe = await request<TableDetail>(`/tables/${id}`);
  const mesa = fromApi(detalhe.table, detalhe.inviteCode);
  upsert(mesa);
  return mesa;
}

export async function addMesa(input: { titulo: string; sistema?: string; descricao?: string; imagemUri?: string }): Promise<Mesa> {
  await carregarCapasLocais();
  const detalhe = await request<TableDetail>('/tables', {
    method: 'POST',
    body: {
      name: input.titulo.trim(),
      gameSystem: input.sistema?.trim() || undefined,
      description: input.descricao?.trim() || undefined,
    },
  });
  // The API only accepts a cover URL; a photo from the gallery stays on this device.
  if (input.imagemUri) salvarCapaLocal(detalhe.table.id, input.imagemUri);
  const mesa = fromApi(detalhe.table, detalhe.inviteCode);
  upsert(mesa);
  return mesa;
}

export async function updateMesa(id: string, patch: Partial<Omit<Mesa, 'id'>>): Promise<void> {
  const atual = mesas.find((mesa) => mesa.id === id);
  if (!atual) return;
  const atualizada = await request<TableSummary>(`/tables/${id}`, {
    method: 'PUT',
    body: {
      name: (patch.titulo ?? atual.titulo).trim(),
      gameSystem: (patch.sistema ?? atual.sistema).trim() || 'D&D 5e',
      description: (patch.descricao ?? atual.descricao) || undefined,
      maxPlayers: atual.maxJogadores ?? 5,
      coverUrl: atual.capaUrl,
    },
  });
  if ('imagemUri' in patch) salvarCapaLocal(id, patch.imagemUri);
  upsert({ ...fromApi(atualizada, atual.codigoConvite), imagemUri: patch.imagemUri ?? atual.imagemUri });
}

export async function entrarPorCodigo(codigo: string): Promise<Mesa> {
  await carregarCapasLocais();
  const detalhe = await request<TableDetail>('/tables/join', {
    method: 'POST',
    body: { inviteCode: codigo.trim().toUpperCase() },
  });
  const mesa = fromApi(detalhe.table, detalhe.inviteCode);
  upsert(mesa);
  return mesa;
}

export function getMesaById(id: string): Mesa | undefined {
  return mesas.find((mesa) => mesa.id === id);
}

/** MASTER deletes the table; any other member leaves it. */
export async function removeMesa(id: string): Promise<void> {
  const atual = mesas.find((mesa) => mesa.id === id);
  if (!atual) return;
  if (atual.papelApi === 'MASTER') await request<void>(`/tables/${id}`, { method: 'DELETE' });
  else await request<void>(`/tables/${id}/members/me`, { method: 'DELETE' });
  salvarCapaLocal(id, undefined);
  mesas = mesas.filter((mesa) => mesa.id !== id);
  emit();
}

function useStoreSubscription() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
}

export function useMesas(): Mesa[] {
  useStoreSubscription();
  return mesas;
}

export function useMesasStatus(): { carregando: boolean; erro?: string } {
  useStoreSubscription();
  return { carregando, erro };
}
