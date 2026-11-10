import { useMemo } from 'react';
import { useTables } from './useTables';

/**
 * Visão simplificada das mesas para o Calendário (que ainda usa nomes em português).
 * Os dados vêm do `useTables`, a fonte única das mesas.
 */
export interface Mesa {
  id: string;
  titulo: string;
  sistema: string;
}

export function useMesas(): Mesa[] {
  const tables = useTables((s) => s.tables);
  return useMemo(() => tables.map((t) => ({ id: t.id, titulo: t.name, sistema: t.gameSystem })), [tables]);
}

export const carregarMesas = () => useTables.getState().load();
export const limparMesas = () => useTables.getState().clear();
