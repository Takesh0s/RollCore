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

/** PT-BR abbreviated labels for each attribute key. */
export const ATTR_LABELS: Record<AttrKey, string> = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAB',
  CHA: 'CAR',
}

/** PT-BR full labels for each attribute key. */
export const ATTR_LABELS_FULL: Record<AttrKey, string> = {
  STR: 'Força',
  DEX: 'Destreza',
  CON: 'Constituição',
  INT: 'Inteligência',
  WIS: 'Sabedoria',
  CHA: 'Carisma',
}

export const ATTR_KEYS: AttrKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

/**
 * Represents a single D&D 5e skill with its governing attribute.
 * Doc. de Visão §4.1 — Compêndio integrado de regras / §1.4.1 SRD D&D 5e
 */
export interface SkillDef {
  name: string
  attr: AttrKey
}

/**
 * Complete D&D 5e SRD skill list — all 18 skills mapped to their governing attribute.
 * Replaces the previous partial SKILL_MAP (5 entries, some with typos).
 * Reference: SRD D&D 5e §1.4.1 Doc. de Visão Equipe 9.
 */
export const SKILLS: SkillDef[] = [
  // FOR / STR
  { name: 'Atletismo',       attr: 'STR' },
  // DES / DEX
  { name: 'Acrobacia',       attr: 'DEX' },
  { name: 'Prestidigitação', attr: 'DEX' },
  { name: 'Furtividade',     attr: 'DEX' },
  // INT
  { name: 'Arcanismo',       attr: 'INT' },
  { name: 'História',        attr: 'INT' },
  { name: 'Investigação',    attr: 'INT' },
  { name: 'Natureza',        attr: 'INT' },
  { name: 'Religião',        attr: 'INT' },
  // SAB / WIS
  { name: 'Adestramento',    attr: 'WIS' },
  { name: 'Intuição',        attr: 'WIS' },
  { name: 'Medicina',        attr: 'WIS' },
  { name: 'Percepção',       attr: 'WIS' },
  { name: 'Sobrevivência',   attr: 'WIS' },
  // CAR / CHA
  { name: 'Atuação',         attr: 'CHA' },
  { name: 'Enganação',       attr: 'CHA' },
  { name: 'Intimidação',     attr: 'CHA' },
  { name: 'Persuasão',       attr: 'CHA' },
]

/**
 * Returns the total bonus for a skill check (ability modifier + proficiency bonus).
 * @param skillName - Skill name as defined in SKILLS
 * @param attrs     - Character attributes object
 * @param level     - Character level (1–20)
 */
export function getSkillBonus(skillName: string, attrs: Attributes, level: number): number {
  const def = SKILLS.find(s => s.name === skillName)
  if (!def) return 0
  return calcMod(attrs[def.attr]) + profBonus(level)
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
