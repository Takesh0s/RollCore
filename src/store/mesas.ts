import { useEffect, useState } from 'react';

export interface Mesa {
  id: string;
  sistema: string;
  titulo: string;
  descricao?: string;
  papel: 'Mestre' | 'Jogador';
  proximaSessao: string;
}

let mesas: Mesa[] = [
  { id: 'strahd', sistema: 'D&D 5e', titulo: 'A Maldição de Strahd', papel: 'Mestre', proximaSessao: 'Sábado, 20h' },
  { id: 'arkham', sistema: 'Chamado de Cthulhu', titulo: 'Sombras de Arkham', papel: 'Jogador', proximaSessao: 'Domingo, 15h' },
];

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function gerarId(titulo: string) {
  const slug = titulo.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return slug || `mesa-${Date.now()}`;
}

export function addMesa(input: { titulo: string; sistema?: string; descricao?: string }): Mesa {
  const nova: Mesa = {
    id: gerarId(input.titulo),
    titulo: input.titulo,
    sistema: input.sistema?.trim() || 'Sistema Livre',
    descricao: input.descricao,
    papel: 'Mestre',
    proximaSessao: 'A definir',
  };
  mesas = [...mesas, nova];
  emit();
  return nova;
}

export function entrarPorCodigo(codigo: string): Mesa {
  const nova: Mesa = {
    id: `convite-${codigo.toLowerCase()}`,
    titulo: `Mesa via convite ${codigo.toUpperCase()}`,
    sistema: 'A confirmar',
    papel: 'Jogador',
    proximaSessao: 'A definir',
  };
  mesas = [...mesas, nova];
  emit();
  return nova;
}

export function getMesaById(id: string): Mesa | undefined {
  return mesas.find((m) => m.id === id);
}

export function removeMesa(id: string): void {
  mesas = mesas.filter((m) => m.id !== id);
  emit();
}

export function useMesas(): Mesa[] {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return mesas;
}