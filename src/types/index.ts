// ─── Domain Types ────────────────────────────────────────────────────────────

export type AttrKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export interface Attributes {
  STR: number; DEX: number; CON: number
  INT: number; WIS: number; CHA: number
}

export interface SpellSlots {
  1: number; 2: number; 3: number; 4: number; 5: number
  6: number; 7: number; 8: number; 9: number
}

export interface WarlockSlots {
  total: number
  level: number
  used:  number
}

export interface Character {
  id:         number
  name:       string
  class:      string
  subclass:   string
  race:       string
  level:      number
  hp:         number
  max_hp:     number
  temp_hp:    number
  ac:         number
  attributes: Attributes
  spell_slots?:   SpellSlots
  warlock_slots?: WarlockSlots
  avatar_url?: string
}

export interface RollResult {
  total: number; rolls: number[]
  mod: number; sides: number
  formula?: string
}

export interface HistoryEntry {
  type:     'formula' | 'skill' | 'dice'
  formula?: string
  skill?:   string
  sides?:   number
  result:   RollResult
  timestamp: number
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  isLogged:      boolean
  email:         string
  username:      string
  keepConnected: boolean
  avatar_url?:   string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type Screen =
  | 'login' | 'cadastro' | 'esqueci-senha'
  | 'dashboard' | 'personagens'
  | 'novo-personagem' | 'editar-personagem' | 'ficha'
  | 'dados' | 'perfil'

// ─── Form Types ───────────────────────────────────────────────────────────────

export type CharacterFormData = Omit<Character, 'id'>
export interface FormErrors { [key: string]: string }

// ─── API Types ────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
  userId:       string
  email:        string
  username:     string
}

export interface CharacterApiResponse {
  id:             string
  name:           string
  characterClass: string
  subclass:       string
  race:           string
  level:          number
  attributes:     Attributes
  hp:             number
  maxHp:          number
  tempHp:         number
  ac:             number
  spellSlots:     SpellSlots | null
  warlockSlots:   WarlockSlots | null
  avatar_url?:    string
}

export interface DiceRollApiResponse {
  id:       string
  formula:  string
  rolls:    number[]
  mod:      number
  total:    number
  rolledAt: string
}

// ─── Spell Types (Sprint 8) ───────────────────────────────────────────────────

/**
 * Mirrors SpellResponse from the backend — V3__spells_schema.sql / Sprint 8.
 * All fields use camelCase as returned by the Spring Boot JSON serializer.
 */
export interface Spell {
  id:            string
  name:          string
  /** 0 = truque, 1–9 = spell level. */
  level:         number
  school:        string
  castingTime:   string
  range:         string
  components:    string
  duration:      string
  description:   string
  higherLevels?: string | null
  classes:       string[]
  ritual:        boolean
  concentration: boolean
  /** 'ranged' | 'melee' | null — null for non-attack spells. */
  attackType?:   string | null
  damageDice?:   string | null
  damageType?:   string | null
  saveAttribute?: string | null
  source:        string
}

export type SpellSchool =
  | 'Abjuração' | 'Adivinhação' | 'Conjuração' | 'Encantamento'
  | 'Evocação'  | 'Ilusão'      | 'Necromancia' | 'Transmutação'

/** School display colors — used in badges. */
export const SCHOOL_COLORS: Record<string, string> = {
  'Abjuração':    '#4a90d9',
  'Adivinhação':  '#9b59b6',
  'Conjuração':   '#e67e22',
  'Encantamento': '#e91e8c',
  'Evocação':     '#e74c3c',
  'Ilusão':       '#8e44ad',
  'Necromancia':  '#2c3e50',
  'Transmutação': '#27ae60',
}

export const LEVEL_LABELS = ['Truque', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°']