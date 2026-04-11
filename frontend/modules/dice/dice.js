/**
 * Dice rolling engine — prototype implementation.
 * In the production backend, rolls use java.security.SecureRandom
 * to guarantee cryptographic unpredictability — UC-03 RE01.
 * Math.random() is used here for the frontend prototype only.
 */

/**
 * Returns a random integer between 1 and max (inclusive).
 * @param {number} max - Number of die faces
 * @returns {number}
 */
export function roll(max) {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Rolls a d20 with an optional modifier.
 * @param {number} mod - Flat modifier (bonus or penalty)
 * @returns {{ total: number, rolls: number[], mod: number, type: string }}
 */
export function rollD20(mod = 0) {
  const d20 = roll(20);
  return { total: d20 + mod, rolls: [d20], mod, type: 'd20' };
}

/**
 * Rolls N dice of X faces with an optional modifier — UC-03 RN-01.
 * Accepted formula format: NdX+M
 * @param {number} n     - Number of dice
 * @param {number} sides - Die type (must be a valid side count)
 * @param {number} mod   - Flat modifier added to the total
 * @returns {{ total: number, rolls: number[], mod: number, sides: number }}
 */
export function rollFormula(n, sides, mod = 0) {
  const rolls = Array.from({ length: n }, () => roll(sides));
  const total = rolls.reduce((a, b) => a + b, 0) + mod;
  return { total, rolls, mod, sides };
}
