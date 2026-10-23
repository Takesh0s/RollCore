/**
 * engine-hp.ts — HP and CA auto-calculation per PHB rules.
 *
 * These functions are ADDITIONS to the existing engine.ts.
 * Add these exports directly into src/lib/engine.ts after the existing content,
 * or import from this file and re-export.
 *
 * PHB Sources:
 *  - Hit Dice per class: PHB Chapter 3 (each class description)
 *  - HP formula: PHB p.15 "Além do 1° Nível"
 *    Level 1: max hit die + CON modifier
 *    Each subsequent level: average (rounded up) + CON modifier
 *  - Unarmored AC: PHB p.145 (general), p.47 (Bárbaro), p.103 (Monge)
 *  - Attribute cap: PHB p.14 — "Você não pode aumentar um valor de habilidade acima de 20"
 */

import type { Attributes } from '@/types'

// ── Hit Dice per class (PHB Ch.3) ─────────────────────────────────────────────

/** Maps each D&D 5e class to its hit die face count — PHB Chapter 3. */
export const CLASS_HIT_DIE: Record<string, number> = {
  'Bárbaro':     12,
  'Bardo':        8,
  'Bruxo':        8,   // Warlock
  'Warlock':      8,   // alias
  'Clérigo':      8,
  'Druida':       8,
  'Feiticeiro':   6,
  'Guerreiro':   10,
  'Ladino':       8,
  'Mago':         6,
  'Monge':        8,
  'Paladino':    10,
  'Patrulheiro': 10,
}

/**
 * Returns the hit die average rounded up for levels beyond 1st.
 * PHB p.15: "o resultado médio da rolagem de dado (arredondado para cima)"
 * d6→4, d8→5, d10→6, d12→7
 */
function hitDieAverage(die: number): number {
  return Math.ceil(die / 2) + 1
}

/**
 * Calculates the maximum HP using the fixed-average method (PHB p.15).
 *
 * Formula:
 *  Level 1 : hitDie (max) + CON modifier
 *  Level N : level 1 HP + (N-1) × (hitDieAverage + CON modifier)
 *
 * @param className - D&D 5e class name matching CLASS_HIT_DIE keys
 * @param level     - Character level 1–20
 * @param con       - CON attribute score (before modifier calculation)
 * @returns Calculated max HP, or null if the class is not found
 */
export function calcMaxHp(className: string, level: number, con: number): number | null {
  const die = CLASS_HIT_DIE[className]
  if (!die) return null

  const conMod = Math.floor((con - 10) / 2)
  const level1Hp  = die + conMod
  const perLevel  = hitDieAverage(die) + conMod

  return level1Hp + Math.max(0, level - 1) * perLevel
}

/**
 * Calculates AC for an unarmored character (PHB p.145 + class features).
 *
 * Default (all classes): 10 + DEX modifier
 * Bárbaro (Defesa sem Armadura, PHB p.47): 10 + DEX modifier + CON modifier
 * Monge   (Defesa sem Armadura, PHB p.103): 10 + DEX modifier + WIS modifier
 *
 * @param className  - D&D 5e class name
 * @param attributes - Character attribute scores
 */
export function calcUnarmoredAC(className: string, attributes: Attributes): number {
  const dexMod = Math.floor((attributes.DEX - 10) / 2)
  const conMod = Math.floor((attributes.CON - 10) / 2)
  const wisMod = Math.floor((attributes.WIS - 10) / 2)

  if (className === 'Bárbaro') return 10 + dexMod + conMod
  if (className === 'Monge')   return 10 + dexMod + wisMod
  return 10 + dexMod
}

/**
 * Attribute input cap — PHB p.14.
 * "Você não pode aumentar um valor de habilidade acima de 20."
 * The player always types the BASE score (1–20). Racial bonuses are applied
 * on top by the form and stored as post-bonus values in the database.
 */
export const ATTR_INPUT_MAX = 20
export const ATTR_INPUT_MIN = 1
