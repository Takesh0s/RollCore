import { useEffect, useState } from 'react';

export type Resposta = 'confirmado' | 'recusado' | null;

export interface Evento {
  id: string;
  titulo: string;
  mesaId: string;
  descricao?: string;
  data: string; // AAAA-MM-DD
  cor: string;
  confirmados: number;
  total: number;
  resposta: Resposta; // resposta do usuário atual
}

export const CORES_EVENTO = ['#6fbf9b', '#1E1E1E', '#e57373', '#64b5f6', '#ba68c8', '#ff8a65'];

// ---------- helpers de data ----------
const pad = (n: number) => String(n).padStart(2, '0');

export function paraISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function doISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function formatarCurto(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function formatarBR(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

// "DD/MM/AAAA" -> "AAAA-MM-DD" (ou null se a data não existir)
export function parseBR(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return paraISO(d);
}

// ---------- store ----------
const hoje = new Date();

let eventos: Evento[] = [
  {
    id: 'seed-1',
    titulo: 'Possível data para mesa',
    mesaId: 'strahd',
    descricao: 'Vamos fechar a próxima sessão.',
    data: paraISO(new Date(hoje.getFullYear(), hoje.getMonth(), 24)),
    cor: CORES_EVENTO[0],
    confirmados: 3,
    total: 5,
    resposta: null,
  },
];

// TODO: vir do backend/conta. Por enquanto é um flag local (true = pode criar eventos).
let pagante = true;

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function useAssinatura() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

export function useEventos(): Evento[] {
  useAssinatura();
  return eventos;
}

export function usePagante(): boolean {
  useAssinatura();
  return pagante;
}

export function setPagante(valor: boolean) {
  pagante = valor;
  emit();
}

export function addEvento(input: {
  titulo: string;
  mesaId: string;
  descricao?: string;
  data: string;
  cor: string;
  total?: number;
}): Evento {
  const novo: Evento = {
    id: `evento-${Date.now()}`,
    titulo: input.titulo,
    mesaId: input.mesaId,
    descricao: input.descricao,
    data: input.data,
    cor: input.cor,
    confirmados: 1, // quem cria já confirma
    total: input.total ?? 5, // TODO: número real de participantes da mesa
    resposta: 'confirmado',
  };
  eventos = [...eventos, novo];
  emit();
  return novo;
}

export function responderEvento(id: string, resposta: Exclude<Resposta, null>) {
  eventos = eventos.map((e) => {
    if (e.id !== id || e.resposta === resposta) return e;
    let confirmados = e.confirmados;
    if (e.resposta === 'confirmado') confirmados -= 1;
    if (resposta === 'confirmado') confirmados += 1;
    return { ...e, resposta, confirmados };
  });
  emit();
}
