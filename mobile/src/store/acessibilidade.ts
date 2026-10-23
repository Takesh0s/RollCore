import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type FontSizeChoice = 'Pequeno' | 'Padrão' | 'Grande';
export type DaltonismType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'acromatopsia';
export type NarrationSpeed = 'Lenta' | 'Normal' | 'Rápida';
export interface Acessibilidade {
  daltonico: boolean;
  tipoDaltonismo: DaltonismType;
  fonte: FontSizeChoice;
  narracao: boolean;
  velocidadeNarracao: NarrationSpeed;
  descreverVisuais: boolean;
  feedbackSonoro: boolean;
}
const KEY = '@rollcore/acessibilidade-v3';
const LEGACY_KEYS = ['@rollcore/acessibilidade-v2', '@rollcore/acessibilidade-v1'];
let settings: Acessibilidade = {
  daltonico: false,
  tipoDaltonismo: 'deuteranopia',
  fonte: 'Padrão',
  narracao: false,
  velocidadeNarracao: 'Normal',
  descreverVisuais: false,
  feedbackSonoro: false,
};
let revision = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const TIPOS: DaltonismType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'acromatopsia'];
const SPEEDS: NarrationSpeed[] = ['Lenta', 'Normal', 'Rápida'];

async function hydrate() {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    let raw = await AsyncStorage.getItem(KEY);
    for (const legacyKey of LEGACY_KEYS) {
      if (raw) break;
      raw = await AsyncStorage.getItem(legacyKey);
    }
    if (!revision && raw) {
      const parsed = JSON.parse(raw) as Partial<Acessibilidade>;
      settings = {
        ...settings,
        ...parsed,
        daltonico: parsed.daltonico === true,
        tipoDaltonismo: TIPOS.includes(parsed.tipoDaltonismo as DaltonismType) ? parsed.tipoDaltonismo as DaltonismType : 'deuteranopia',
        fonte: parsed.fonte === 'Pequeno' || parsed.fonte === 'Grande' ? parsed.fonte : 'Padrão',
        narracao: parsed.narracao === true,
        velocidadeNarracao: SPEEDS.includes(parsed.velocidadeNarracao as NarrationSpeed) ? parsed.velocidadeNarracao as NarrationSpeed : 'Normal',
        descreverVisuais: parsed.descreverVisuais === true,
        feedbackSonoro: parsed.feedbackSonoro === true,
      };
    }
  } catch (error) { console.warn('Falha ao carregar acessibilidade', error); }
  emit();
}
void hydrate();

export function getAcessibilidade(): Acessibilidade { return settings; }
export function updateAcessibilidade(patch: Partial<Acessibilidade>) {
  settings = { ...settings, ...patch };
  revision += 1;
  emit();
  if (!(Platform.OS === 'web' && typeof window === 'undefined')) {
    void AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch((error) => console.warn('Falha ao salvar acessibilidade', error));
  }
}
export function useAcessibilidade(): Acessibilidade {
  const [, refresh] = useState(0);
  useEffect(() => {
    const listener = () => refresh((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return settings;
}
export function fontMultiplier(choice: FontSizeChoice): number {
  return choice === 'Pequeno' ? 0.85 : choice === 'Grande' ? 1.25 : 1;
}
