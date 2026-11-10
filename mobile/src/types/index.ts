// Domain types shared by the mobile screens. They mirror the web app (web/src/types) and the API responses.

export type AttrKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface Attributes {
  STR: number; DEX: number; CON: number;
  INT: number; WIS: number; CHA: number;
}

export interface SpellSlots {
  1: number; 2: number; 3: number; 4: number; 5: number;
  6: number; 7: number; 8: number; 9: number;
}

export interface WarlockSlots {
  total: number;
  level: number;
  used: number;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  subclass: string;
  race: string;
  level: number;
  hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  attributes: Attributes;
  spell_slots?: SpellSlots;
  warlock_slots?: WarlockSlots;
  /** Portrait: a small data URL or an http(s) URL. */
  avatar_url?: string;
  /** Game system of the sheet ("D&D 5e", "Personalizado", ...); D&D 5e when absent. */
  game_system?: string;
}

/** Mirrors CharacterResponse from the backend. */
export interface CharacterApiResponse {
  id: string;
  name: string;
  characterClass: string;
  subclass: string;
  race: string;
  level: number;
  attributes: Attributes;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  spellSlots: SpellSlots | null;
  warlockSlots: WarlockSlots | null;
  gameSystem?: string;
  avatarUrl?: string | null;
}

/** Mirrors SpellResponse from the backend. */
export interface Spell {
  id: string;
  name: string;
  /** 0 = cantrip, 1–9 = spell level. */
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  higherLevels?: string | null;
  classes: string[];
  ritual: boolean;
  concentration: boolean;
  /** 'ranged' | 'melee' | null — null for non-attack spells. */
  attackType?: string | null;
  damageDice?: string | null;
  damageType?: string | null;
  saveAttribute?: string | null;
  source: string;
}

/** School display colors, used in badges. */
export const SCHOOL_COLORS: Record<string, string> = {
  'Abjuração': '#4a90d9',
  'Adivinhação': '#9b59b6',
  'Conjuração': '#e67e22',
  'Encantamento': '#e91e8c',
  'Evocação': '#e74c3c',
  'Ilusão': '#8e44ad',
  'Necromancia': '#2c3e50',
  'Transmutação': '#27ae60',
};

export const LEVEL_LABELS = ['Truque', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°'];
