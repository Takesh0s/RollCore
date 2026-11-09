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
  /** Game system of the sheet ("D&D 5e", "Personalizado", ...); D&D 5e when absent. */
  game_system?: string
}

export interface RollResult {
  total: number; rolls: number[]
  mod: number; sides: number
  formula?: string
}

export type DiceMode = 'normal' | 'advantage' | 'disadvantage'

export interface HistoryEntry {
  type:     'formula' | 'skill' | 'dice'
  formula?: string
  skill?:   string
  sides?:   number
  result:   RollResult
  timestamp: number
  /** Motivo da rolagem ("Ataque com espada longa"), quando informado. */
  label?:     string
  mode?:      DiceMode
  /** Dados descartados em vantagem/desvantagem. */
  discarded?: number[]
  tableId?:   string
  tableName?: string
}

/** Atalho de rolagem salvo pelo usuário ("Atalhos salvos"). */
export interface DiceShortcut {
  id:      string
  name:    string
  formula: string
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
  | 'dados' | 'perfil' | 'tema'
  | 'mesas' | 'nova-mesa' | 'editar-mesa' | 'mesa' | 'mapas'
  | 'calendario' | 'novo-evento' | 'notificacoes'

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'ROLE_CHANGED' | 'REMOVED_FROM_TABLE'
  | 'HOST_TRANSFERRED' | 'TABLE_DELETED' | 'EVENT_CREATED'

/** Mirrors NotificationResponse; the sentence is built on the client from type + snapshot fields. */
export interface AppNotification {
  id:        string
  type:      NotificationType
  tableId:   string | null
  tableName: string | null
  actorName: string | null
  detail:    string | null
  read:      boolean
  createdAt: string
}

// ─── Tables (mesas) ───────────────────────────────────────────────────────────

export type TableRole = 'MASTER' | 'MODERATOR' | 'PLAYER'

/** Mirrors TableSummaryResponse from the backend. */
export interface TableSummary {
  id:            string
  name:          string
  gameSystem:    string
  description:   string | null
  maxPlayers:    number
  playerCount:   number
  coverUrl:      string | null
  myRole:        TableRole
  ownerUsername: string
  createdAt:     string
}

export interface TableMember {
  userId:      string
  username:    string
  displayName: string | null
  avatarUrl:   string | null
  role:        TableRole
  joinedAt:    string
}

/** Mirrors TableDetailResponse (inviteCode only comes for master/moderators). */
export interface TableDetail {
  table:      TableSummary
  inviteCode: string | null
  members:    TableMember[]
  me?:        TableMemberSelf
  canTransferHost?: boolean
}

/** Mirrors MemberSelfResponse: the caller's own settings on this table. */
export interface TableMemberSelf {
  displayName: string | null
  avatarUrl:   string | null
  muted:       boolean
  role:        TableRole
}

/** Mirrors TablePreviewResponse: public overview shown before joining with an invite code. */
export interface TablePreview {
  name:          string
  gameSystem:    string
  description:   string | null
  coverUrl:      string | null
  playerCount:   number
  maxPlayers:    number
  ownerUsername: string
  full:          boolean
}

export interface CreateTableInput {
  name:         string
  gameSystem?:  string
  description?: string
  maxPlayers?:  number
  /** Cropped photo (data URL); it is uploaded and the table stores the resulting URL. */
  cover?:       string
}

export interface UpdateTableInput {
  name:         string
  gameSystem:   string
  description:  string
  maxPlayers:   number
  /** New cropped cover (data URL) to upload; omit to keep the current one. */
  cover?:       string
  removeCover?: boolean
}

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

export interface UserProfileApiResponse {
  userId:      string
  username:    string
  email:       string
  plan:        string
  avatarUrl?:  string | null
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
  gameSystem?:    string
  avatarUrl?:     string | null
}

export interface DiceRollApiResponse {
  id:       string
  formula:  string
  rolls:    number[]
  mod:      number
  total:    number
  rolledAt: string
  label?:          string | null
  mode?:           DiceMode
  discardedRolls?: number[] | null
  tableId?:        string | null
  tableName?:      string | null
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
/** Item do inventário de uma ficha (peso por unidade, em kg). */
export interface InventoryItem {
  id:           string
  name:         string
  category:     'weapon' | 'armor' | 'consumable' | 'other'
  quantity:     number
  weight:       number
  damage?:      string | null
  description?: string | null
}

/** Moedas de uma ficha: platina, ouro, prata e cobre. */
export interface Coins { pp: number; gp: number; sp: number; cp: number }

export interface InventoryApiResponse { items: InventoryItem[]; coins: Coins }
