import type { RollResult } from '@/types'

/** UC-03 RN-01: tipos de dado válidos */
export const VALID_SIDES = [4, 6, 8, 10, 12, 20, 100] as const
export type DiceSides = typeof VALID_SIDES[number]

/** UC-03 RN-01: regex de validação de fórmula NdX, NdX+M, NdX-M */
export const FORMULA_REGEX = /^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\d+)?$/i

/** Rola um inteiro aleatório entre 1 e max (inclusivo) */
function roll(max: number): number {
  return Math.floor(Math.random() * max) + 1
}

/** Valida se a string é uma fórmula de dados válida — UC-03 RN-01 */
export function validateFormula(str: string): boolean {
  if (!str) return false
  const m = str.match(FORMULA_REGEX)
  if (!m) return false
  return (VALID_SIDES as readonly number[]).includes(parseInt(m[2], 10))
}

/** Rola N dados de X faces com modificador — UC-03 RF0003.1 */
export function rollFormula(n: number, sides: number, mod = 0): RollResult {
  const rolls = Array.from({ length: n }, () => roll(sides))
  const total = rolls.reduce((a, b) => a + b, 0) + mod
  return { total, rolls, mod, sides }
}

/** Interpreta uma string de fórmula e retorna o resultado */
export function rollFormulaString(formula: string): RollResult {
  const m = formula.match(FORMULA_REGEX)!
  const n    = parseInt(m[1], 10)
  const sides = parseInt(m[2], 10)
  const mod   = m[3] ? parseInt(m[3], 10) : 0
  return { ...rollFormula(n, sides, mod), formula }
}

/** Rola 1dX — UC-03 S01 atalho rápido */
export function quickRoll(sides: number): RollResult {
  return rollFormula(1, sides, 0)
}

/** Monta string de breakdown: [4, 2] + 3 = 9 */
export function buildBreakdown(result: RollResult): string {
  let text = `[${result.rolls.join(', ')}]`
  if (result.mod > 0) text += ` + ${result.mod}`
  if (result.mod < 0) text += ` - ${Math.abs(result.mod)}`
  if (result.rolls.length > 1 || result.mod !== 0) text += ` = ${result.total}`
  return text
}

/** Formata timestamp como DD/MM/AAAA HH:MM — UC-03 S02 passo 18 */
export function formatTimestamp(ts: number): string {
  const d   = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
