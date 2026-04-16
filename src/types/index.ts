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
  subclass:   string   // chosen subclass (empty string until required level)
  race:       string
  level:      number
  hp:         number   // current HP — tracked live during combat
  max_hp:     number   // maximum HP — set on creation/edit
  temp_hp:    number   // temporary HP — absorbed before regular HP (PHB p.198)
  ac:         number
  attributes: Attributes
  spell_slots?:   SpellSlots    // standard spell slot usage (full/half casters)
  warlock_slots?: WarlockSlots  // pact magic usage (warlock only — PHB p.107)
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