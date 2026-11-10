import { create } from 'zustand';
import { request, mensagemDeErro } from '../services/api';
import type { DiceMode, DiceRollApiResponse, DiceShortcut, HistoryEntry } from '../types';

export interface RollInput {
  formula: string;
  label?: string;
  mode?: DiceMode;
  tableId?: string;
  tableName?: string;
}

const MAX_HISTORY = 50;

const sidesOf = (formula: string) => parseInt(formula.match(/d(\d+)/i)?.[1] ?? '0', 10);

/** Turns the API response into a history entry. */
function toEntry(r: DiceRollApiResponse): HistoryEntry {
  return {
    formula: r.formula,
    result: { total: r.total, rolls: r.rolls, mod: r.mod, sides: sidesOf(r.formula), formula: r.formula },
    timestamp: new Date(r.rolledAt).getTime(),
    label: r.label ?? undefined,
    mode: r.mode ?? 'normal',
    discarded: r.discardedRolls ?? undefined,
    tableId: r.tableId ?? undefined,
    tableName: r.tableName ?? undefined,
  };
}

type Outcome<T = undefined> = { ok: true; value: T } | { ok: false; error: string };

interface DiceState {
  history: HistoryEntry[];
  shortcuts: DiceShortcut[];
  loadHistory: () => Promise<void>;
  loadShortcuts: () => Promise<void>;
  /** The server rolls (so every device and the table see the same result) and returns the entry. */
  roll: (input: RollInput) => Promise<Outcome<HistoryEntry>>;
  addShortcut: (name: string, formula: string) => Promise<Outcome>;
  removeShortcut: (id: string) => Promise<Outcome>;
  clear: () => void;
}

export const useDice = create<DiceState>((set, get) => ({
  history: [],
  shortcuts: [],

  async loadHistory() {
    try {
      const data = await request<DiceRollApiResponse[]>('/dice/history');
      set({ history: data.map(toEntry) });
    } catch {
      // offline: keep what is on screen
    }
  },

  async loadShortcuts() {
    try {
      const data = await request<DiceShortcut[]>('/dice/shortcuts');
      if (Array.isArray(data)) set({ shortcuts: data });
    } catch {
      // offline: keep the current list
    }
  },

  async roll({ formula, label, mode, tableId, tableName }) {
    try {
      const url = tableId ? `/tables/${tableId}/rolls` : '/dice/roll';
      const data = await request<DiceRollApiResponse>(url, { method: 'POST', body: { formula, mode, ...(label ? { label } : {}) } });
      const entry = toEntry({ ...data, tableId: tableId ?? null, tableName: tableName ?? null });
      set((s) => ({ history: [entry, ...s.history].slice(0, MAX_HISTORY) }));
      return { ok: true, value: entry };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async addShortcut(name, formula) {
    try {
      const created = await request<DiceShortcut>('/dice/shortcuts', { method: 'POST', body: { name, formula } });
      set((s) => ({ shortcuts: [...s.shortcuts, created] }));
      return { ok: true, value: undefined };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async removeShortcut(id) {
    const before = get().shortcuts;
    set({ shortcuts: before.filter((x) => x.id !== id) });
    try {
      await request<void>(`/dice/shortcuts/${id}`, { method: 'DELETE' });
      return { ok: true, value: undefined };
    } catch (e) {
      set({ shortcuts: before });
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  clear() { set({ history: [], shortcuts: [] }); },
}));
