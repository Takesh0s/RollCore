import type { Character, InventoryItem } from '@/types'
import { calcMod } from '@/lib/engine'

/** Arma da ficha pronta para rolar no rolador de dados. */
export interface RollableWeapon {
  id: string
  name: string
  character: string
  damageText: string
  formula: string
}

const ATTR_WORDS: [RegExp, keyof Character['attributes']][] = [
  [/\b(for|str)\b/i, 'STR'], [/\b(des|dex)\b/i, 'DEX'], [/\bcon\b/i, 'CON'],
  [/\bint\b/i, 'INT'], [/\b(sab|wis)\b/i, 'WIS'], [/\b(car|cha)\b/i, 'CHA'],
]

/**
 * O campo "Dano" é texto livre ("1D12 Cort. + Dex."): pega o primeiro NdX e soma o
 * modificador do atributo citado. Devolve null quando não há dado (ex.: "11 + Dex CA").
 */
export function weaponFormula(damage: string, char: Pick<Character, 'attributes'>): string | null {
  const m = damage.match(/(\d*)d(\d+)/i)
  if (!m) return null
  const sides = Number(m[2])
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) return null
  const mod = ATTR_WORDS.find(([re]) => re.test(damage))
  const bonus = mod ? calcMod(char.attributes[mod[1]] ?? 10) : 0
  return `${m[1] || 1}d${sides}${bonus > 0 ? `+${bonus}` : bonus < 0 ? String(bonus) : ''}`
}

export function toRollable(char: Character, items: InventoryItem[]): RollableWeapon[] {
  return items.flatMap(i => {
    if (i.category !== 'weapon' || i.quantity < 1 || !i.damage) return []
    const formula = weaponFormula(i.damage, char)
    return formula ? [{ id: i.id, name: i.name, character: char.name, damageText: i.damage, formula }] : []
  })
}
