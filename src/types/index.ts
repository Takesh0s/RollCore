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

/** Tabela characters — UC-02 / Seção 9.2 Doc. de Visão */
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

/** Tabela dice_rolls — UC-03 / Seção 9.2 Doc. de Visão */
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
