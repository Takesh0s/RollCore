/**
 * Spell API helpers — Sprint 8.
 * All calls go through the central Axios instance (lib/api.ts) which
 * handles JWT injection and silent token refresh automatically.
 */

import api from '@/lib/api'
import type { Spell } from '@/types'

export interface SpellFilter {
  className?: string
  level?:     number | null
  search?:    string
}

// ── Catalog ───────────────────────────────────────────────────────────────────

/**
 * GET /spells?class=&level=&search=
 * All params are optional. Returns up to 100 spells.
 */
export async function fetchSpells(filter: SpellFilter = {}): Promise<Spell[]> {
  const params: Record<string, string | number> = {}
  if (filter.className) params.className = filter.className
  if (filter.level != null) params.level = filter.level
  if (filter.search?.trim()) params.search = filter.search.trim()

  const { data } = await api.get<Spell[]>('/spells', { params })
  return data
}

// ── Character spells ──────────────────────────────────────────────────────────

/** GET /characters/{characterId}/spells */
export async function fetchCharacterSpells(characterId: string | number): Promise<Spell[]> {
  const { data } = await api.get<Spell[]>(`/characters/${characterId}/spells`)
  return data
}

/**
 * POST /characters/{characterId}/spells/{spellId}
 * Returns the spell that was added.
 */
export async function addSpellToCharacter(
  characterId: string | number,
  spellId:     string,
): Promise<Spell> {
  const { data } = await api.post<Spell>(`/characters/${characterId}/spells/${spellId}`)
  return data
}

/** DELETE /characters/{characterId}/spells/{spellId} */
export async function removeSpellFromCharacter(
  characterId: string | number,
  spellId:     string,
): Promise<void> {
  await api.delete(`/characters/${characterId}/spells/${spellId}`)
}