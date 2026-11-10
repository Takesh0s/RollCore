import { request } from '../services/api';
import type { Character, CharacterApiResponse, Spell } from '../types';
import { DEFAULT_SYSTEM } from './systems';

/** Maps the API response (camelCase) to the sheet shape used by the screens. */
export function mapCharacter(r: CharacterApiResponse): Character {
  return {
    id: r.id,
    name: r.name,
    class: r.characterClass,
    subclass: r.subclass ?? '',
    race: r.race,
    level: r.level,
    attributes: r.attributes,
    hp: r.hp,
    max_hp: r.maxHp,
    temp_hp: r.tempHp ?? 0,
    spell_slots: r.spellSlots ?? undefined,
    warlock_slots: r.warlockSlots ?? undefined,
    ac: r.ac,
    avatar_url: r.avatarUrl ?? undefined,
    game_system: r.gameSystem ?? DEFAULT_SYSTEM,
  };
}

/** Maps a sheet to the body of POST/PUT /characters. */
export function mapCharacterRequest(c: Omit<Character, 'id'>) {
  return {
    name: c.name,
    characterClass: c.class,
    subclass: c.subclass ?? '',
    race: c.race,
    level: c.level,
    attributes: c.attributes,
    hp: c.hp,
    maxHp: c.max_hp,
    tempHp: c.temp_hp ?? 0,
    ac: c.ac,
    gameSystem: c.game_system ?? DEFAULT_SYSTEM,
    // Omitted when unknown, so a save never wipes the portrait stored on the server
    ...(c.avatar_url !== undefined ? { avatarUrl: c.avatar_url } : {}),
  };
}

export async function fetchCharacters(): Promise<Character[]> {
  const data = await request<CharacterApiResponse[]>('/characters');
  return data.map(mapCharacter);
}

export async function createCharacter(c: Omit<Character, 'id'>): Promise<Character> {
  return mapCharacter(await request<CharacterApiResponse>('/characters', { method: 'POST', body: mapCharacterRequest(c) }));
}

export async function saveCharacter(id: string, c: Omit<Character, 'id'>): Promise<Character> {
  return mapCharacter(await request<CharacterApiResponse>(`/characters/${id}`, { method: 'PUT', body: mapCharacterRequest(c) }));
}

export async function removeCharacter(id: string): Promise<void> {
  await request<void>(`/characters/${id}`, { method: 'DELETE' });
}

// ── Spells ───────────────────────────────────────────────────────────────────

export interface SpellFilter { className?: string; level?: number | null; search?: string }

/** GET /spells?className=&level=&search= (up to 100 spells). */
export function fetchSpells(filter: SpellFilter = {}): Promise<Spell[]> {
  const params = new URLSearchParams();
  if (filter.className) params.set('className', filter.className);
  if (filter.level != null) params.set('level', String(filter.level));
  if (filter.search?.trim()) params.set('search', filter.search.trim());
  const qs = params.toString();
  return request<Spell[]>(`/spells${qs ? `?${qs}` : ''}`);
}

export const fetchCharacterSpells = (characterId: string) => request<Spell[]>(`/characters/${characterId}/spells`);
export const addSpellToCharacter = (characterId: string, spellId: string) =>
  request<Spell>(`/characters/${characterId}/spells/${spellId}`, { method: 'POST' });
export const removeSpellFromCharacter = (characterId: string, spellId: string) =>
  request<void>(`/characters/${characterId}/spells/${spellId}`, { method: 'DELETE' });
