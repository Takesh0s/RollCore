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
  total: number   // total pact magic slots at this level
  level: number   // slot level (all slots are the same level — PHB p.107)
  used:  number   // slots currently expended
}

/** Mirrors the `characters` table — UC-02 / Doc. de Visão §9.2 */
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
  /** Optional character portrait — base64 data URL or remote URL. */
  avatar_url?: string
}

/** Mirrors the `dice_rolls` table — UC-03 / Doc. de Visão §9.2 */
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
  /** Optional profile photo — base64 data URL stored locally (Fase 1). */
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

/** Shape returned by POST /auth/register and POST /auth/login */
export interface AuthTokens {
  accessToken:  string
  refreshToken: string
  userId:       string
  email:        string
  username:     string
}

/** Shape returned by GET /characters and POST /characters */
export interface CharacterApiResponse {
  id:           string
  name:         string
  characterClass: string
  subclass:     string
  race:         string
  level:        number
  attributes:   Attributes
  hp:           number
  maxHp:        number
  tempHp:       number
  ac:           number
  spellSlots:   SpellSlots | null
  warlockSlots: WarlockSlots | null
  avatar_url?:  string
}

/** Shape returned by POST /dice/roll */
export interface DiceRollApiResponse {
  id:       string
  formula:  string
  rolls:    number[]
  mod:      number
  total:    number
  rolledAt: string
}
