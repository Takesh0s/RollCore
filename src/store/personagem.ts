import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

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
  nome: string;
  classe: string;
  nivel: number;
  valores: Record<string, number>;
}

let personagem: Personagem = {
  nome: 'Valerius',
  classe: 'Paladin',
  nivel: 5,
  valores: { for: 16, des: 8, con: 14, int: 10, sab: 12, car: 18 },
};

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export function getPersonagem(): Personagem {
  return personagem;
}

export function setPersonagem(novo: Personagem) {
  personagem = novo;
  emit();
}

export function usePersonagem(): Personagem {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return personagem;
}

export function modificador(valor: number): number {
  return Math.floor((valor - 10) / 2);
}