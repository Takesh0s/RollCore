import type { Character, InventoryItem, Spell } from '../types'
import { calcMod, getSpellAttackBonus } from './engine'

/** Algo que o personagem pode usar e que gera uma rolagem (arma, truque, magia ou item). */
export interface Rollable {
  id: string
  kind: 'weapon' | 'cantrip' | 'spell' | 'item'
  name: string
  /** Texto de apoio: "1D12 Cort. + Dex.", "Evocação · 8d6 fogo"… */
  detail: string
  /** Rolagem de dano/efeito (NdX±M). */
  formula: string
  /** Rolagem de ataque (1d20+bônus), quando a magia exige jogada de ataque. */
  attack?: string
}

const ATTR_WORDS: [RegExp, keyof Character['attributes']][] = [
  [/\b(for|str)\b/i, 'STR'], [/\b(des|dex)\b/i, 'DEX'], [/\bcon\b/i, 'CON'],
  [/\bint\b/i, 'INT'], [/\b(sab|wis)\b/i, 'WIS'], [/\b(car|cha)\b/i, 'CHA'],
]

const SIDES = [4, 6, 8, 10, 12, 20, 100]
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? String(n) : '')

/**
 * O campo "Dano" é texto livre ("1D12 Cort. + Dex."): pega o primeiro NdX e soma o
 * modificador do atributo citado. Devolve null quando não há dado (ex.: "11 + Dex CA").
 */
export function weaponFormula(damage: string, char: Pick<Character, 'attributes'>): string | null {
  const m = damage.match(/(\d*)d(\d+)/i)
  if (!m || !SIDES.includes(Number(m[2]))) return null
  const mod = ATTR_WORDS.find(([re]) => re.test(damage))
  const bonus = mod ? calcMod(char.attributes[mod[1]] ?? 10) : 0
  return `${m[1] || 1}d${m[2]}${signed(bonus)}`
}

/** Armas (com dado de dano) e itens de outras categorias com dado (poções, por exemplo). */
export function itemRollables(char: Character, items: InventoryItem[]): Rollable[] {
  return items.flatMap(i => {
    if (i.quantity < 1 || !i.damage) return []
    const formula = weaponFormula(i.damage, char)
    if (!formula) return []
    return [{ id: i.id, kind: i.category === 'weapon' ? 'weapon' as const : 'item' as const,
              name: i.name, detail: i.damage, formula }]
  })
}

/** Truques e magias conhecidos que têm dado de dano; ataque de magia entra quando houver jogada de ataque. */
export function spellRollables(char: Character, spells: Spell[]): Rollable[] {
  const atk = getSpellAttackBonus(char.class, char.level, char.attributes, char.subclass)
  return spells.flatMap(s => {
    const m = s.damageDice?.match(/(\d*)d(\d+)/i)
    if (!m || !SIDES.includes(Number(m[2]))) return []
    return [{
      id: s.id, kind: s.level === 0 ? 'cantrip' as const : 'spell' as const, name: s.name,
      detail: [s.school, `${s.damageDice}${s.damageType ? ` ${s.damageType}` : ''}`].join(' · '),
      formula: `${m[1] || 1}d${m[2]}`,
      attack: s.attackType && atk !== null ? `1d20${signed(atk)}` : undefined,
    }]
  })
}
