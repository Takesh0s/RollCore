import { create } from 'zustand';
import {
  createCharacter, fetchCharacters, removeCharacter, saveCharacter,
} from '../lib/characters';
import { getMaxSpellSlots, getWarlockSlots } from '../lib/engine';
import { mensagemDeErro } from '../services/api';
import type { Character } from '../types';

type Result = { ok: true; character: Character } | { ok: false; error: string };

/**
 * Spell slots are derived from class, subclass and level. They are recomputed when one of those changes;
 * otherwise the slots already spent in the sheet are kept (saving HP must not give the slots back).
 */
function withSlots(data: Omit<Character, 'id'>, previous?: Character): Omit<Character, 'id'> {
  const max = getMaxSpellSlots(data.class, data.level, data.subclass);
  const warlock = getWarlockSlots(data.class, data.level, data.subclass);
  const same = !!previous && previous.class === data.class && previous.level === data.level && previous.subclass === data.subclass;
  return {
    ...data,
    spell_slots: max ? (same && previous?.spell_slots ? previous.spell_slots : max) : undefined,
    warlock_slots: warlock ? (same && previous?.warlock_slots ? previous.warlock_slots : warlock) : undefined,
  };
}

interface CharactersState {
  characters: Character[];
  loading: boolean;
  /** Set when the last load failed (the list shows an error state with "Tentar de novo"). */
  error: string | null;
  loaded: boolean;
  load: () => Promise<void>;
  get: (id: string | undefined) => Character | undefined;
  add: (data: Omit<Character, 'id'>) => Promise<Result>;
  update: (id: string, data: Omit<Character, 'id'>) => Promise<Result>;
  remove: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Changes a sheet in memory only (no API call), e.g. spell slots spent during a session. */
  patchLocal: (id: string, patch: Partial<Character>) => void;
  clear: () => void;
}

const pickSlots = (c: Omit<Character, 'id'>) => ({ spell_slots: c.spell_slots, warlock_slots: c.warlock_slots });

export const useCharacters = create<CharactersState>((set, getState) => ({
  characters: [],
  loading: false,
  error: null,
  loaded: false,

  async load() {
    set({ loading: true, error: null });
    try {
      set({ characters: await fetchCharacters(), loading: false, loaded: true });
    } catch (e) {
      set({ loading: false, error: mensagemDeErro(e) });
    }
  },

  get: (id) => getState().characters.find((c) => c.id === id),

  async add(data) {
    try {
      const saved = { ...(await createCharacter(data)), ...pickSlots(withSlots(data)) };
      set((s) => ({ characters: [...s.characters, saved] }));
      return { ok: true, character: saved };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async update(id, data) {
    const previous = getState().characters;
    const next = withSlots(data, previous.find((c) => c.id === id));
    // Optimistic: the sheet reflects the change right away (HP tracker), and rolls back if the API refuses.
    set((s) => ({ characters: s.characters.map((c) => (c.id === id ? { ...c, ...next, id } : c)) }));
    try {
      const saved = { ...(await saveCharacter(id, data)), ...pickSlots(next) };
      set((s) => ({ characters: s.characters.map((c) => (c.id === id ? saved : c)) }));
      return { ok: true, character: saved };
    } catch (e) {
      set({ characters: previous });
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  async remove(id) {
    try {
      await removeCharacter(id);
      set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mensagemDeErro(e) };
    }
  },

  patchLocal(id, patch) {
    set((s) => ({ characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  },

  clear() { set({ characters: [], loaded: false, error: null }); },
}));
