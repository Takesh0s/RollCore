/* ═══════════════════════════════════════════════
   ROLLCORE — Dice Engine
   Funções primitivas de rolagem.
   No backend real, a rolagem usa SecureRandom
   (UC-03 RE01). No frontend, Math.random() é
   usado apenas para o protótipo.
══════════════════════════════════════════════════ */

/**
 * Gera um inteiro aleatório entre 1 e max (inclusivo).
 * @param {number} max - Número de faces do dado
 * @returns {number}
 */
export function roll(max) {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Rola um d20 com modificador.
 * @param {number} mod - Modificador (bônus/penalidade)
 * @returns {{ total: number, rolls: number[], mod: number, type: string }}
 */
export function rollD20(mod = 0) {
  const d20 = roll(20);
  return {
    total: d20 + mod,
    rolls: [d20],
    mod,
    type: 'd20'
  };
}

/**
 * Rola N dados de X faces com modificador opcional.
 * Formato: NdX+M (UC-03 RN-01).
 * @param {number} n     - Quantidade de dados
 * @param {number} sides - Faces do dado
 * @param {number} mod   - Modificador
 * @returns {{ total: number, rolls: number[], mod: number, sides: number }}
 */
export function rollFormula(n, sides, mod = 0) {
  const rolls = Array.from({ length: n }, () => roll(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { total, rolls, mod, sides };
}
