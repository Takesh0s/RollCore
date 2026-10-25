import type { RollResult } from '@/types'

/** Valid die types accepted by the system — UC-03 RN-01 */
export const VALID_SIDES = [4, 6, 8, 10, 12, 20, 100] as const
export type DiceSides = typeof VALID_SIDES[number]

/** Regex for formula validation: NdX, NdX+M, NdX−M — UC-03 RN-01 */
export const FORMULA_REGEX = /^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\d+)?$/i

/** Returns a random integer between 1 and max (inclusive). */
function roll(max: number): number {
  return Math.floor(Math.random() * max) + 1
}

/**
 * Validates a dice formula string against UC-03 RN-01 rules.
 * Accepted formats: NdX | NdX+M | NdX−M  (N=1–99, X=valid side, M=integer)
 */
export function validateFormula(str: string): boolean {
  if (!str) return false
  const m = str.match(FORMULA_REGEX)
  if (!m) return false
  return (VALID_SIDES as readonly number[]).includes(parseInt(m[2], 10))
}

/**
 * Rolls N dice of X sides with an optional modifier — UC-03 RF0003.1.
 * @param n    - Number of dice
 * @param sides - Die type (must be a valid side count)
 * @param mod  - Flat modifier added to the total
 */
export function rollFormula(n: number, sides: number, mod = 0): RollResult {
  const rolls = Array.from({ length: n }, () => roll(sides))
  const total = rolls.reduce((a, b) => a + b, 0) + mod
  return { total, rolls, mod, sides }
}

/**
 * Parses a formula string and returns the roll result.
 * Assumes the formula has already been validated.
 */
export function rollFormulaString(formula: string): RollResult {
  const m     = formula.match(FORMULA_REGEX)!
  const n     = parseInt(m[1], 10)
  const sides = parseInt(m[2], 10)
  const mod   = m[3] ? parseInt(m[3], 10) : 0
  return { ...rollFormula(n, sides, mod), formula }
}

/** Quick-rolls a single die of the given type — UC-03 S01 */
export function quickRoll(sides: number): RollResult {
  return rollFormula(1, sides, 0)
}

/**
 * Builds a human-readable breakdown string from a roll result.
 * Example: [4, 2] + 3 = 9
 */
export function buildBreakdown(result: RollResult): string {
  let text = `[${result.rolls.join(', ')}]`
  if (result.mod > 0) text += ` + ${result.mod}`
  if (result.mod < 0) text += ` - ${Math.abs(result.mod)}`
  if (result.rolls.length > 1 || result.mod !== 0) text += ` = ${result.total}`
  return text
}

/**
 * Formats a Unix timestamp as DD/MM/YYYY HH:MM — UC-03 S02 step 18
 */
export function formatTimestamp(ts: number): string {
  const d   = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
