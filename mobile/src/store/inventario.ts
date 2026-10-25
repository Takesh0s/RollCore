import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export type CategoriaItem = 'Arma' | 'Armadura' | 'Poção' | 'Equipamento' | 'Tesouro';

export const CATEGORIAS: { key: CategoriaItem; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'Arma', icon: 'gavel' },
  { key: 'Armadura', icon: 'shield' },
  { key: 'Poção', icon: 'science' },
  { key: 'Equipamento', icon: 'backpack' },
  { key: 'Tesouro', icon: 'diamond' },
];

export interface ItemInventario {
  id: string;
  nome: string;
  categoria: CategoriaItem;
  quantidade: number;
  peso: number; // kg por unidade
  equipado: boolean;
  descricao?: string;
}

export interface Moedas {
  po: number; // ouro
  pp: number; // prata
  pc: number; // cobre
}

let itens: ItemInventario[] = [
  { id: 'i1', nome: 'Espada Longa', categoria: 'Arma', quantidade: 1, peso: 1.5, equipado: true, descricao: '1d8 cortante, versátil (1d10).' },
  { id: 'i2', nome: 'Cota de Malha', categoria: 'Armadura', quantidade: 1, peso: 27, equipado: true, descricao: 'CA 16. Desvantagem em Furtividade.' },
  { id: 'i3', nome: 'Escudo', categoria: 'Armadura', quantidade: 1, peso: 3, equipado: true, descricao: '+2 de CA.' },
  { id: 'i4', nome: 'Poção de Cura', categoria: 'Poção', quantidade: 3, peso: 0.25, equipado: false, descricao: 'Recupera 2d4+2 pontos de vida.' },
  { id: 'i5', nome: 'Corda de Cânhamo (15 m)', categoria: 'Equipamento', quantidade: 1, peso: 5, equipado: false },
  { id: 'i6', nome: 'Tochas', categoria: 'Equipamento', quantidade: 5, peso: 0.5, equipado: false },
  { id: 'i7', nome: 'Símbolo Sagrado', categoria: 'Equipamento', quantidade: 1, peso: 0.5, equipado: true },
  { id: 'i8', nome: 'Rubi Pequeno', categoria: 'Tesouro', quantidade: 2, peso: 0, equipado: false, descricao: 'Valor estimado: 50 PO cada.' },
];

let moedas: Moedas = { po: 124, pp: 36, pc: 12 };

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export function addItem(input: Omit<ItemInventario, 'id' | 'equipado'> & { equipado?: boolean }): ItemInventario {
  const novo: ItemInventario = {
    ...input,
    id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    equipado: input.equipado ?? false,
  };
  itens = [...itens, novo];
  emit();
  return novo;
}

export function removeItem(id: string) {
  itens = itens.filter((i) => i.id !== id);
  emit();
}

export function alterarQuantidade(id: string, delta: number) {
  itens = itens
    .map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
    .filter((i) => i.quantidade > 0); // chegou a 0 → remove
  emit();
}

export function toggleEquipado(id: string) {
  itens = itens.map((i) => (i.id === id ? { ...i, equipado: !i.equipado } : i));
  emit();
}

export function setMoedas(novas: Moedas) {
  moedas = novas;
  emit();
}

export function ajustarMoeda(tipo: keyof Moedas, delta: number) {
  moedas = { ...moedas, [tipo]: Math.max(0, moedas[tipo] + delta) };
  emit();
}

export function pesoTotal(lista: ItemInventario[]): number {
  return lista.reduce((soma, i) => soma + i.peso * i.quantidade, 0);
}

// D&D 5e: capacidade de carga = Força × 7,5 kg (15 lb por ponto de Força).
export function capacidadeCarga(forca: number): number {
  return forca * 7.5;
}

function useStore<T>(get: () => T): T {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return get();
}

export function useInventario(): ItemInventario[] {
  return useStore(() => itens);
}

export function useMoedas(): Moedas {
  return useStore(() => moedas);
}
