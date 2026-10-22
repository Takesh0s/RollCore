import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface Mesa {
  id: string;
  sistema: string;
  titulo: string;
  descricao?: string;
  papel: 'Mestre' | 'Jogador';
  proximaSessao: string;
  imagemUri?: string;
}

const STORAGE_KEY = '@rollcore/mesas-v1';
const INITIAL_TABLES: Mesa[] = [
  { id: 'strahd', sistema: 'D&D 5e', titulo: 'A Maldição de Strahd', papel: 'Mestre', proximaSessao: 'Sábado, 20h' },
  { id: 'arkham', sistema: 'Chamado de Cthulhu', titulo: 'Sombras de Arkham', papel: 'Jogador', proximaSessao: 'Domingo, 15h' },
];
let mesas: Mesa[] = INITIAL_TABLES;
let revision = 0;
type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener());

function persist() {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mesas)).catch((error) => console.warn('Falha ao salvar mesas localmente', error));
}

async function hydrate() {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (revision === 0 && raw) {
      const parsed = JSON.parse(raw) as Mesa[];
      if (Array.isArray(parsed)) mesas = parsed;
    } else if (!raw) {
      persist();
    }
  } catch (error) {
    console.warn('Falha ao carregar mesas locais', error);
  } finally {
    emit();
  }
}
void hydrate();

function makeId(titulo: string) {
  const slug = titulo.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'mesa';
  return `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function addMesa(input: { titulo: string; sistema?: string; descricao?: string; imagemUri?: string }): Mesa {
  const nova: Mesa = {
    id: makeId(input.titulo),
    titulo: input.titulo.trim(),
    sistema: input.sistema?.trim() || 'Sistema Livre',
    descricao: input.descricao?.trim(),
    imagemUri: input.imagemUri,
    papel: 'Mestre',
    proximaSessao: 'A definir',
  };
  mesas = [...mesas, nova];
  revision += 1;
  persist();
  emit();
  return nova;
}

export function updateMesa(id: string, patch: Partial<Omit<Mesa, 'id'>>): void {
  mesas = mesas.map((mesa) => mesa.id === id ? { ...mesa, ...patch } : mesa);
  revision += 1;
  persist();
  emit();
}

export function entrarPorCodigo(codigo: string): Mesa {
  const code = codigo.trim().toUpperCase();
  const nova: Mesa = {
    id: `convite-${Date.now().toString(36)}`,
    titulo: `Mesa via convite ${code}`,
    sistema: 'A confirmar',
    papel: 'Jogador',
    proximaSessao: 'A definir',
  };
  mesas = [...mesas, nova];
  revision += 1;
  persist();
  emit();
  return nova;
}

export function getMesaById(id: string): Mesa | undefined {
  return mesas.find((mesa) => mesa.id === id);
}

export function removeMesa(id: string): void {
  mesas = mesas.filter((mesa) => mesa.id !== id);
  revision += 1;
  persist();
  emit();
}

export function useMesas(): Mesa[] {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return mesas;
}
