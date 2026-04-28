import type { AttrKey, Attributes, SpellSlots, WarlockSlots } from '@/types'

// ─── Attribute Calculations ───────────────────────────────────────────────────

/**
 * Calculates the D&D 5e attribute modifier.
 * Formula: floor((value − 10) / 2) — UC-02 RN-02
 */
export function calcMod(value: number): number {
  return Math.floor((value - 10) / 2)
}

/**
 * Returns the Proficiency Bonus for a given level — UC-02 RN-03.
 * Levels 1–4 → +2 | 5–8 → +3 | 9–12 → +4 | 13–16 → +5 | 17–20 → +6
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

// ─── Attribute Labels ─────────────────────────────────────────────────────────

export const ATTR_LABELS: Record<AttrKey, string> = {
  STR: 'FOR', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR',
}

export const ATTR_LABELS_FULL: Record<AttrKey, string> = {
  STR: 'Força', DEX: 'Destreza', CON: 'Constituição',
  INT: 'Inteligência', WIS: 'Sabedoria', CHA: 'Carisma',
}

export const ATTR_KEYS: AttrKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

// ─── Skills ───────────────────────────────────────────────────────────────────

export interface SkillDef { name: string; attr: AttrKey }

/** All 18 D&D 5e SRD skills — PHB Chapter 7 / Doc. de Visão §4.1 */
export const SKILLS: SkillDef[] = [
  { name: 'Atletismo',       attr: 'STR' },
  { name: 'Acrobacia',       attr: 'DEX' },
  { name: 'Prestidigitação', attr: 'DEX' },
  { name: 'Furtividade',     attr: 'DEX' },
  { name: 'Arcanismo',       attr: 'INT' },
  { name: 'História',        attr: 'INT' },
  { name: 'Investigação',    attr: 'INT' },
  { name: 'Natureza',        attr: 'INT' },
  { name: 'Religião',        attr: 'INT' },
  { name: 'Adestramento',    attr: 'WIS' },
  { name: 'Intuição',        attr: 'WIS' },
  { name: 'Medicina',        attr: 'WIS' },
  { name: 'Percepção',       attr: 'WIS' },
  { name: 'Sobrevivência',   attr: 'WIS' },
  { name: 'Atuação',         attr: 'CHA' },
  { name: 'Enganação',       attr: 'CHA' },
  { name: 'Intimidação',     attr: 'CHA' },
  { name: 'Persuasão',       attr: 'CHA' },
]

export function getSkillBonus(skillName: string, attrs: Attributes, level: number): number {
  const def = SKILLS.find(s => s.name === skillName)
  if (!def) return 0
  return calcMod(attrs[def.attr]) + profBonus(level)
}

// ─── Race Traits ──────────────────────────────────────────────────────────────

/**
 * A racial trait — either a stat bonus or a passive ability.
 * PHB Chapter 2.
 */
export interface RaceTrait {
  name: string
  description: string
  type: 'stat_bonus' | 'passive' | 'choice'
  /** For stat_bonus: which attribute and how much */
  stat?: AttrKey
  bonus?: number
}

export interface RaceData {
  name: string
  size: string
  speed: number  // in meters
  traits: RaceTrait[]
  /** Stat bonuses as a convenient summary (derived from traits) */
  statBonuses: Partial<Record<AttrKey, number>>
}

/**
 * Complete racial data — PHB Chapter 2.
 * Stat bonuses are auto-applied when a race is selected on the character form.
 */
export const RACE_DATA: Record<string, RaceData> = {
  'Anão': {
    name: 'Anão', size: 'Médio', speed: 7.5,
    statBonuses: { CON: 2 },
    traits: [
      { name: 'Aumento de Constituição', description: 'Seu valor de Constituição aumenta em 2.', type: 'stat_bonus', stat: 'CON', bonus: 2 },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra. Não distingue cores no escuro.', type: 'passive' },
      { name: 'Resiliência Anã', description: 'Vantagem em testes de resistência contra veneno e resistência contra dano de veneno.', type: 'passive' },
      { name: 'Treinamento Anão em Combate', description: 'Proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra.', type: 'passive' },
      { name: 'Proficiência com Ferramentas', description: 'Proficiência em uma ferramenta de artesão: ferramentas de ferreiro, ferramentas de cervejeiro ou ferramentas de pedreiro.', type: 'choice' },
      { name: 'Conhecimento sobre Pedra', description: 'Whenever you make an Intelligence (History) check related to stonework, add twice your proficiency bonus.', type: 'passive' },
    ],
  },
  'Elfo': {
    name: 'Elfo', size: 'Médio', speed: 9,
    statBonuses: { DEX: 2, WIS: 1 },
    traits: [
      { name: 'Aumento de Destreza', description: 'Seu valor de Destreza aumenta em 2.', type: 'stat_bonus', stat: 'DEX', bonus: 2 },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra.', type: 'passive' },
      { name: 'Sentidos Aguçados', description: 'Você tem proficiência na perícia Percepção.', type: 'passive' },
      { name: 'Ancestral Feérico', description: 'Você tem vantagem em testes de resistência contra ser enfeitiçado e a magia não pode colocá-lo para dormir.', type: 'passive' },
      { name: 'Transe', description: 'Os elfos não dormem. Em vez disso, ficam em um estado semiconsciente por 4 horas, obtendo o mesmo benefício que um humano obtém em 8 horas de sono.', type: 'passive' },
      { name: 'Aumento de Sabedoria (Elfo da Floresta)', description: 'Seu valor de Sabedoria aumenta em 1.', type: 'stat_bonus', stat: 'WIS', bonus: 1 },
      { name: 'Pés Ligeiros', description: 'Seu deslocamento base de caminhada aumenta para 10,5 metros.', type: 'passive' },
      { name: 'Máscara da Natureza', description: 'Você pode tentar se esconder mesmo quando está apenas levemente obscurecido por folhagem, chuva, neve, névoa ou outros fenômenos naturais.', type: 'passive' },
    ],
  },
  'Halfling': {
    name: 'Halfling', size: 'Pequeno', speed: 7.5,
    statBonuses: { DEX: 2 },
    traits: [
      { name: 'Aumento de Destreza', description: 'Seu valor de Destreza aumenta em 2.', type: 'stat_bonus', stat: 'DEX', bonus: 2 },
      { name: 'Sortudo', description: 'Ao obter um 1 natural em uma jogada de ataque, teste de habilidade ou teste de resistência, você pode rolar novamente e deve usar o novo resultado.', type: 'passive' },
      { name: 'Bravura', description: 'Você tem vantagem em testes de resistência contra ficar amedrontado.', type: 'passive' },
      { name: 'Agilidade Halfling', description: 'Você pode se mover através do espaço de qualquer criatura que seja de tamanho maior que o seu.', type: 'passive' },
    ],
  },
  'Humano': {
    name: 'Humano', size: 'Médio', speed: 9,
    statBonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
    traits: [
      { name: 'Aumento de Habilidade (todos)', description: 'Todos os seus valores de habilidade aumentam em 1.', type: 'stat_bonus' },
      { name: 'Idioma Adicional', description: 'Você pode falar, ler e escrever um idioma adicional à sua escolha.', type: 'choice' },
    ],
  },
  'Draconato': {
    name: 'Draconato', size: 'Médio', speed: 9,
    statBonuses: { STR: 2, CHA: 1 },
    traits: [
      { name: 'Aumento de Força', description: 'Seu valor de Força aumenta em 2.', type: 'stat_bonus', stat: 'STR', bonus: 2 },
      { name: 'Aumento de Carisma', description: 'Seu valor de Carisma aumenta em 1.', type: 'stat_bonus', stat: 'CHA', bonus: 1 },
      { name: 'Ancestral Dracônico', description: 'Você tem ancestral dracônico de um tipo específico de dragão. Escolha um tipo: Azul (Elétrico), Branco (Frio), Bronze (Elétrico), Cobre (Ácido), Latão (Fogo), Negro (Ácido), Ouro (Fogo), Prata (Frio), Verde (Veneno), Vermelho (Fogo).', type: 'choice' },
      { name: 'Sopro de Arma', description: 'Você pode usar sua ação para exalar energia destrutiva. O tipo de dano e o formato dependem do seu ancestral dracônico. CD = 8 + mod. de Con + bônus de proficiência. Uso: 1×/descanso curto ou longo.', type: 'passive' },
      { name: 'Resistência a Dano', description: 'Você tem resistência ao tipo de dano associado ao seu ancestral dracônico.', type: 'passive' },
    ],
  },
  'Gnomo': {
    name: 'Gnomo', size: 'Pequeno', speed: 7.5,
    statBonuses: { INT: 2 },
    traits: [
      { name: 'Aumento de Inteligência', description: 'Seu valor de Inteligência aumenta em 2.', type: 'stat_bonus', stat: 'INT', bonus: 2 },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra.', type: 'passive' },
      { name: 'Esperteza Gnômica', description: 'Você possui vantagem em todos os testes de resistência de Inteligência, Sabedoria e Carisma contra magia.', type: 'passive' },
    ],
  },
  'Meio-Elfo': {
    name: 'Meio-Elfo', size: 'Médio', speed: 9,
    statBonuses: { CHA: 2 },
    traits: [
      { name: 'Aumento de Carisma', description: 'Seu valor de Carisma aumenta em 2.', type: 'stat_bonus', stat: 'CHA', bonus: 2 },
      { name: 'Bônus de Habilidade (escolha 2)', description: 'Outros dois valores de habilidade, à sua escolha, aumentam em 1.', type: 'choice' },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra.', type: 'passive' },
      { name: 'Ancestral Feérico', description: 'Vantagem em testes de resistência contra ser enfeitiçado e a magia não pode colocá-lo para dormir.', type: 'passive' },
      { name: 'Versatilidade de Perícia', description: 'Você ganha proficiência em duas perícias à sua escolha.', type: 'choice' },
    ],
  },
  'Meio-Orc': {
    name: 'Meio-Orc', size: 'Médio', speed: 9,
    statBonuses: { STR: 2, CON: 1 },
    traits: [
      { name: 'Aumento de Força', description: 'Seu valor de Força aumenta em 2.', type: 'stat_bonus', stat: 'STR', bonus: 2 },
      { name: 'Aumento de Constituição', description: 'Seu valor de Constituição aumenta em 1.', type: 'stat_bonus', stat: 'CON', bonus: 1 },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra.', type: 'passive' },
      { name: 'Ameaçador', description: 'Você ganha proficiência na perícia Intimidação.', type: 'passive' },
      { name: 'Resistência Implacável', description: 'Quando você é reduzido a 0 pontos de vida, mas não morto instantaneamente, pode caí para 1 ponto de vida. Não pode usar essa característica novamente até terminar um descanso longo.', type: 'passive' },
      { name: 'Ataques Selvagens', description: 'Quando você acertar um crítico com um ataque corpo-a-corpo, pode rolar um dos dados de dano da arma mais uma vez e somá-lo ao dano extra do crítico.', type: 'passive' },
    ],
  },
  'Tiefling': {
    name: 'Tiefling', size: 'Médio', speed: 9,
    statBonuses: { INT: 1, CHA: 2 },
    traits: [
      { name: 'Aumento de Inteligência', description: 'Seu valor de Inteligência aumenta em 1.', type: 'stat_bonus', stat: 'INT', bonus: 1 },
      { name: 'Aumento de Carisma', description: 'Seu valor de Carisma aumenta em 2.', type: 'stat_bonus', stat: 'CHA', bonus: 2 },
      { name: 'Visão no Escuro', description: 'Você enxerga na penumbra a até 18 metros como se fosse luz plena, e no escuro como se fosse penumbra.', type: 'passive' },
      { name: 'Resistência Infernal', description: 'Você tem resistência a dano de fogo.', type: 'passive' },
      { name: 'Legado Infernal', description: 'Você conhece o truque Taumaturgia. Ao atingir o 3° nível, você pode conjurar Chamas Infernais uma vez por dia. Ao atingir o 5° nível, você pode conjurar Escuridão uma vez por dia. Carisma é a habilidade para conjurar essas magias.', type: 'passive' },
    ],
  },
}

/**
 * Returns the automatic stat bonuses for a given race.
 * These are applied as base adjustments when a character is created/edited.
 */
export function getRaceBonuses(raceName: string): Partial<Record<AttrKey, number>> {
  return RACE_DATA[raceName]?.statBonuses ?? {}
}

/**
 * Returns race traits for display in the character sheet.
 */
export function getRaceTraits(raceName: string): RaceTrait[] {
  return RACE_DATA[raceName]?.traits ?? []
}

// ─── Subclasses ───────────────────────────────────────────────────────────────

/**
 * Maps each class to its available subclasses.
 * The subclass is chosen at the level indicated — PHB Chapter 3.
 */
export const SUBCLASSES: Record<string, { options: string[]; choiceLevel: number }> = {
  'Bárbaro':    { choiceLevel: 3,  options: ['Via do Guerreiro Totêmico', 'Via do Berserker'] },
  'Bardo':      { choiceLevel: 3,  options: ['Colégio do Conhecimento', 'Colégio do Valor'] },
  'Clérigo':    { choiceLevel: 1,  options: ['Domínio do Conhecimento', 'Domínio da Vida', 'Domínio da Luz', 'Domínio da Natureza', 'Domínio da Tempestade', 'Domínio do Engano', 'Domínio da Guerra'] },
  'Druida':     { choiceLevel: 2,  options: ['Círculo da Terra', 'Círculo da Lua'] },
  'Feiticeiro': { choiceLevel: 1,  options: ['Origem da Magia Selvagem', 'Linhagem Dracônica'] },
  'Guerreiro':  { choiceLevel: 3,  options: ['Campeão', 'Cavaleiro Arcano', 'Mestre de Batalha'] },
  'Ladino':     { choiceLevel: 3,  options: ['Trapaceiro Arcano', 'Assassino', 'Ladrão'] },
  'Mago':       { choiceLevel: 2,  options: ['Escola da Abjuração', 'Escola da Conjuração', 'Escola da Adivinhação', 'Escola do Encantamento', 'Escola da Evocação', 'Escola da Ilusão', 'Escola da Necromancia', 'Escola da Transmutação'] },
  'Monge':      { choiceLevel: 3,  options: ['Via da Mão Aberta', 'Via da Sombra', 'Via dos Quatro Elementos'] },
  'Paladino':   { choiceLevel: 3,  options: ['Juramento de Devoção', 'Juramento dos Anciões', 'Juramento da Vingança'] },
  'Patrulheiro':{ choiceLevel: 3,  options: ['Caçador', 'Mestre das Bestas'] },
  'Warlock':    { choiceLevel: 1,  options: ['A Arquifada', 'O Corruptor', 'O Grande Antigo'] },
}

// ─── Spellcasting System ──────────────────────────────────────────────────────

/**
 * Caster types:
 *  full    — full caster (Bardo, Clérigo, Druida, Feiticeiro, Mago)
 *  half    — half caster, slots from level 2 (Paladino, Patrulheiro)
 *  third   — 1/3 caster, slots from level 3 (Cavaleiro Arcano, Trapaceiro Arcano)
 *  warlock — Pact Magic, slots from level 1 (Warlock)
 *  none    — no spellcasting
 */
export type CasterType = 'full' | 'half' | 'third' | 'warlock' | 'none'

export const CLASS_CASTER_TYPE: Record<string, CasterType> = {
  'Bárbaro':    'none',
  'Bardo':      'full',
  'Clérigo':    'full',
  'Druida':     'full',
  'Feiticeiro': 'full',
  'Guerreiro':  'none',   // base class — overridden by subclass below
  'Ladino':     'none',   // base class — overridden by subclass below
  'Mago':       'full',
  'Monge':      'none',   // Via dos Quatro Elementos uses Ki, not spell slots
  'Paladino':   'half',
  'Patrulheiro':'half',
  'Warlock':    'warlock',
}

/**
 * Subclasses that grant spellcasting — PHB Chapter 3.
 * Overrides CLASS_CASTER_TYPE when a specific subclass is selected.
 * Key: subclass name (must match SUBCLASSES options exactly).
 */
export const SUBCLASS_CASTER_TYPE: Record<string, { type: CasterType; ability: AttrKey }> = {
  // Guerreiro — Cavaleiro Arcano (PHB p.85)
  // 1/3 caster starting at level 3, uses INT, same table as Trapaceiro Arcano
  'Cavaleiro Arcano': { type: 'third', ability: 'INT' },

  // Ladino — Trapaceiro Arcano (PHB p.92)
  // 1/3 caster starting at level 3, uses INT
  'Trapaceiro Arcano': { type: 'third', ability: 'INT' },
}

/** Spellcasting ability by class — PHB Chapter 3 */
export const CLASS_SPELL_ABILITY: Record<string, AttrKey> = {
  'Bardo':      'CHA',
  'Clérigo':    'WIS',
  'Druida':     'WIS',
  'Feiticeiro': 'CHA',
  'Mago':       'INT',
  'Paladino':   'CHA',
  'Patrulheiro':'WIS',
  'Warlock':    'CHA',
}

/**
 * Resolves the effective CasterType for a class+subclass combination.
 * Subclass overrides class when the subclass grants spellcasting.
 */
export function resolveCasterType(className: string, subclass?: string): CasterType {
  if (subclass && SUBCLASS_CASTER_TYPE[subclass]) {
    return SUBCLASS_CASTER_TYPE[subclass].type
  }
  return CLASS_CASTER_TYPE[className] ?? 'none'
}

/**
 * Resolves the spellcasting ability for a class+subclass combination.
 * Returns null for non-casters.
 */
export function resolveSpellAbility(className: string, subclass?: string): AttrKey | null {
  if (subclass && SUBCLASS_CASTER_TYPE[subclass]) {
    return SUBCLASS_CASTER_TYPE[subclass].ability
  }
  return CLASS_SPELL_ABILITY[className] ?? null
}

/** Full-caster slot table — PHB Ch.3 (Bardo/Clérigo/Druida/Mago/Feiticeiro) */
const FULL_CASTER_SLOTS: number[][] = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],[4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],
  [4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]

/** Half-caster slot table — PHB Ch.3 (Paladino/Patrulheiro) */
const HALF_CASTER_SLOTS: number[][] = [
  [0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,2,0,0,0,0,0],[4,3,3,3,1,0,0,0,0],[4,3,3,3,1,0,0,0,0],
  [4,3,3,3,2,0,0,0,0],[4,3,3,3,2,0,0,0,0],
]

/**
 * Third-caster slot table — PHB Ch.3 (Cavaleiro Arcano / Trapaceiro Arcano).
 * Slots start at level 3. Levels 1-2 have no slots (row of zeros).
 * Max spell level reaches 4th at character level 19+.
 */
const THIRD_CASTER_SLOTS: number[][] = [
  [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],
  [3,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],
  [4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],
  [4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],
]

/** Warlock Pact Magic table — PHB p.107 */
const WARLOCK_TABLE: Array<{total: number; level: number}> = [
  {total:1,level:1},{total:2,level:1},{total:2,level:2},{total:2,level:2},
  {total:2,level:3},{total:2,level:3},{total:2,level:4},{total:2,level:4},
  {total:2,level:5},{total:2,level:5},{total:3,level:5},{total:3,level:5},
  {total:3,level:5},{total:3,level:5},{total:3,level:5},{total:3,level:5},
  {total:4,level:5},{total:4,level:5},{total:4,level:5},{total:4,level:5},
]

/**
 * Returns the spell slot counts for a class+subclass at a given level.
 * Now subclass-aware: Cavaleiro Arcano and Trapaceiro Arcano use the 1/3
 * caster table despite their base classes being 'none'.
 */
export function getMaxSpellSlots(className: string, level: number, subclass?: string): SpellSlots | null {
  const type = resolveCasterType(className, subclass)
  const table = type === 'full'  ? FULL_CASTER_SLOTS
              : type === 'half'  ? HALF_CASTER_SLOTS
              : type === 'third' ? THIRD_CASTER_SLOTS : null
  if (!table) return null
  const row = table[Math.min(level, 20) - 1]
  // Return null instead of all-zeros for third-casters below level 3
  if (row.every(v => v === 0)) return null
  return { 1:row[0], 2:row[1], 3:row[2], 4:row[3], 5:row[4], 6:row[5], 7:row[6], 8:row[7], 9:row[8] }
}

/**
 * Returns Warlock Pact Magic slots or null for non-warlocks.
 */
export function getWarlockSlots(className: string, level: number, subclass?: string): WarlockSlots | null {
  if (resolveCasterType(className, subclass) !== 'warlock') return null
  const row = WARLOCK_TABLE[Math.min(level, 20) - 1]
  return { total: row.total, level: row.level, used: 0 }
}

/**
 * Returns the spell save DC for a caster.
 * Formula: 8 + proficiency bonus + spellcasting ability modifier — PHB p.205
 * Now subclass-aware for Cavaleiro Arcano and Trapaceiro Arcano.
 */
export function getSpellSaveDC(className: string, level: number, attrs: Attributes, subclass?: string): number | null {
  const abilityKey = resolveSpellAbility(className, subclass)
  if (!abilityKey) return null
  return 8 + profBonus(level) + calcMod(attrs[abilityKey])
}

/**
 * Returns the spell attack bonus for a caster.
 * Formula: proficiency bonus + spellcasting ability modifier — PHB p.205
 * Now subclass-aware for Cavaleiro Arcano and Trapaceiro Arcano.
 */
export function getSpellAttackBonus(className: string, level: number, attrs: Attributes, subclass?: string): number | null {
  const abilityKey = resolveSpellAbility(className, subclass)
  if (!abilityKey) return null
  return profBonus(level) + calcMod(attrs[abilityKey])
}

// ─── Classes & Races ─────────────────────────────────────────────────────────

export const CLASSES = [
  'Bárbaro', 'Bardo', 'Clérigo', 'Druida', 'Feiticeiro',
  'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino',
  'Patrulheiro', 'Warlock',
]

export const RACES = [
  'Anão', 'Draconato', 'Elfo', 'Gnomo', 'Halfling',
  'Humano', 'Meio-Elfo', 'Meio-Orc', 'Tiefling',
]