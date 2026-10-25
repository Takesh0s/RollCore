import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface AtributoBase {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export const ATRIBUTOS_BASE: AtributoBase[] = [
  { key: 'for', label: 'FORÇA', icon: 'fitness-center' },
  { key: 'des', label: 'DESTREZA', icon: 'directions-run' },
  { key: 'con', label: 'CONSTITUIÇÃO', icon: 'favorite' },
  { key: 'int', label: 'INTELIGÊNCIA', icon: 'psychology' },
  { key: 'sab', label: 'SABEDORIA', icon: 'visibility' },
  { key: 'car', label: 'CARISMA', icon: 'auto-awesome' },
];

export interface Personagem {
  id: string;
  nome: string;
  classe: string;
  nivel: number;
  raca?: string;
  imagemUri?: string;
  pontosVida?: number;
  classeArmadura?: number;
  valores: Record<string, number>;
}

const STORAGE_KEY = '@rollcore/personagens-v1';
const EMPTY: Personagem = {
  id: 'sem-personagem', nome: 'Nenhum personagem', classe: 'Aventureiro', nivel: 1,
  valores: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
};
let personagens: Personagem[] = [];
let personagemAtivoId: string | null = null;
let revision = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function persist() {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ personagens, personagemAtivoId }))
    .catch((error) => console.warn('Falha ao salvar personagens localmente', error));
}

async function hydrate() {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (revision === 0 && raw) {
      const parsed = JSON.parse(raw) as { personagens?: Personagem[]; personagemAtivoId?: string | null };
      personagens = Array.isArray(parsed.personagens) ? parsed.personagens : [];
      personagemAtivoId = parsed.personagemAtivoId ?? personagens[0]?.id ?? null;
    } else if (!raw) {
      persist();
    }
  } catch (error) {
    console.warn('Falha ao carregar personagens locais', error);
  }
  emit();
}
void hydrate();

function makeId() {
  return `personagem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getPersonagens(): Personagem[] {
  return personagens;
}

export function getPersonagem(id?: string): Personagem {
  if (id) return personagens.find((item) => item.id === id) ?? EMPTY;
  return personagens.find((item) => item.id === personagemAtivoId) ?? personagens[0] ?? EMPTY;
}

export function setPersonagem(input: Omit<Personagem, 'id'> & { id?: string }): Personagem {
  const id = input.id ?? makeId();
  const saved: Personagem = { ...input, id };
  const exists = personagens.some((item) => item.id === id);
  personagens = exists
    ? personagens.map((item) => item.id === id ? saved : item)
    : [...personagens, saved];
  personagemAtivoId = id;
  revision += 1;
  persist();
  emit();
  return saved;
}

export function updatePersonagem(id: string, patch: Partial<Omit<Personagem, 'id'>>): void {
  personagens = personagens.map((item) => item.id === id ? { ...item, ...patch } : item);
  revision += 1;
  persist();
  emit();
}

export function selectPersonagem(id: string): void {
  if (!personagens.some((item) => item.id === id)) return;
  personagemAtivoId = id;
  revision += 1;
  persist();
  emit();
}

export function removePersonagem(id: string): void {
  personagens = personagens.filter((item) => item.id !== id);
  if (personagemAtivoId === id) personagemAtivoId = personagens[0]?.id ?? null;
  revision += 1;
  persist();
  emit();
}

function useStoreUpdate(): void {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
}

export function usePersonagens(): Personagem[] {
  useStoreUpdate();
  return personagens;
}

export function usePersonagem(id?: string): Personagem {
  useStoreUpdate();
  return getPersonagem(id);
}

export function modificador(valor: number): number {
  return Math.floor((valor - 10) / 2);
}
