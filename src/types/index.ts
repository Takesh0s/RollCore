// ─── Domain Types ────────────────────────────────────────────────────────────

export type AttrKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export interface Attributes {
  STR: number
  DEX: number
  CON: number
  INT: number
  WIS: number
  CHA: number
}

/** Mirrors the `characters` table — UC-02 / Doc. de Visão §9.2 */
export interface Character {
  id: number
  name: string
  class: string
  race: string
  level: number
  hp: number
  max_hp: number
  ac: number
  attributes: Attributes
}

/** Mirrors the `dice_rolls` table — UC-03 / Doc. de Visão §9.2 */
export interface RollResult {
  total: number
  rolls: number[]
  mod: number
  sides: number
  formula?: string
}

export interface HistoryEntry {
  type: 'formula' | 'skill' | 'dice'
  formula?: string
  skill?: string
  sides?: number
  result: RollResult
  timestamp: number
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface User {
  isLogged: boolean
  email: string
  keepConnected: boolean
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type Screen =
  | 'login'
  | 'cadastro'
  | 'esqueci-senha'
  | 'dashboard'
  | 'personagens'
  | 'novo-personagem'
  | 'editar-personagem'
  | 'ficha'
  | 'dados'

// ─── Form Types ───────────────────────────────────────────────────────────────

export type CharacterFormData = Omit<Character, 'id'>

export interface FormErrors {
  [key: string]: string
}
