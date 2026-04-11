import type { AttrKey, Attributes } from '@/types'

/**
 * Calculates the D&D 5e attribute modifier.
 * Formula: floor((value − 10) / 2) — UC-02 RN-02
 * Examples: 1 → −5 | 10 → 0 | 16 → +3 | 20 → +5
 */
export function calcMod(value: number): number {
  return Math.floor((value - 10) / 2)
}

/**
 * Returns the Proficiency Bonus for a given level — UC-02 RN-03.
 * Official D&D 5e SRD table:
 *   Levels  1– 4 → +2 | 5– 8 → +3 | 9–12 → +4 | 13–16 → +5 | 17–20 → +6
 */
export function profBonus(level: number): number {
  if (level <= 4)  return 2
  if (level <= 8)  return 3
  if (level <= 12) return 4
  if (level <= 16) return 5
  return 6
}

/** Formats a modifier with an explicit +/− sign. */
export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

/** PT-BR display labels for each attribute key. */
export const ATTR_LABELS: Record<AttrKey, string> = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAB',
  CHA: 'CAR',
}

export const ATTR_KEYS: AttrKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

/** Maps skill names to their governing ability score (D&D 5e SRD). */
const SKILL_MAP: Record<string, AttrKey> = {
  Atletismo:   'STR',
  Intimidacao: 'CHA',
  Percepcao:   'WIS',
  Furtividade: 'DEX',
  Arcana:      'INT',
}

/**
 * Returns the total bonus for a skill check (ability modifier + proficiency bonus).
 * @param skill  - Skill name as defined in SKILL_MAP
 * @param attrs  - Character attributes object
 * @param level  - Character level (1–20)
 */
export function getSkillBonus(skill: string, attrs: Attributes, level: number): number {
  const attr = SKILL_MAP[skill]
  if (!attr) return 0
  return calcMod(attrs[attr]) + profBonus(level)
}

/** D&D 5e SRD class list. */
export const CLASSES = [
  'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Feiticeiro',
  'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino',
  'Patrulheiro', 'Warlock',
]

/** D&D 5e SRD race list. */
export const RACES = [
  'Anão', 'Draconato', 'Elfo', 'Gnomo', 'Halfling',
  'Humano', 'Meio-Elfo', 'Meio-Orc', 'Tiefling',
]
