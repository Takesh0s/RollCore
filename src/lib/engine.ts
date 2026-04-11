import type { AttrKey, Attributes } from '@/types'

/** UC-02 RN-02: Modificador = floor((valor – 10) / 2) */
export function calcMod(value: number): number {
  return Math.floor((value - 10) / 2)
}

/** UC-02 RN-03: Bônus de Proficiência pela tabela SRD D&D 5e */
export function profBonus(level: number): number {
  if (level <= 4)  return 2
  if (level <= 8)  return 3
  if (level <= 12) return 4
  if (level <= 16) return 5
  return 6
}

/** Formata modificador com sinal +/- */
export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

/** Rótulos PT-BR dos atributos */
export const ATTR_LABELS: Record<AttrKey, string> = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAB',
  CHA: 'CAR',
}

export const ATTR_KEYS: AttrKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

/** Mapa de perícias → atributo base (SRD D&D 5e) */
const SKILL_MAP: Record<string, AttrKey> = {
  Atletismo:   'STR',
  Intimidacao: 'CHA',
  Percepcao:   'WIS',
  Furtividade: 'DEX',
  Arcana:      'INT',
}

export function getSkillBonus(skill: string, attrs: Attributes, level: number): number {
  const attr = SKILL_MAP[skill]
  if (!attr) return 0
  return calcMod(attrs[attr]) + profBonus(level)
}

/** Classes D&D 5e SRD */
export const CLASSES = [
  'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Feiticeiro',
  'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino',
  'Patrulheiro', 'Warlock',
]

/** Raças D&D 5e SRD */
export const RACES = [
  'Anão', 'Draconato', 'Elfo', 'Gnomo', 'Halfling',
  'Humano', 'Meio-Elfo', 'Meio-Orc', 'Tiefling',
]
