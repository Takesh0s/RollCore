/**
 * D&D 5e character rules engine.
 * All formulas follow the SRD (Doc. de Visão §1.4.1).
 */

/**
 * Calculates the D&D 5e attribute modifier — UC-02 RN-02.
 * Formula: floor((value − 10) / 2)
 * Examples: 1 → −5 | 10 → 0 | 16 → +3 | 20 → +5
 * @param {number} value - Attribute score (1–20)
 * @returns {number}
 */
export function calcMod(value) {
  return Math.floor((value - 10) / 2);
}

/**
 * Returns the Proficiency Bonus for a given level — UC-02 RN-03.
 * Official D&D 5e SRD table:
 *   Levels  1– 4 → +2 | 5– 8 → +3 | 9–12 → +4 | 13–16 → +5 | 17–20 → +6
 * @param {number} level - Character level (1–20)
 * @returns {number}
 */
export function profBonus(level) {
  if (level <= 4)  return 2;
  if (level <= 8)  return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

/** Maps skill names to their governing ability score (D&D 5e SRD). */
const SKILL_MAP = {
  Atletismo:    'STR',
  Intimidacao:  'CHA',
  Percepcao:    'WIS',
  Furtividade:  'DEX',
  Arcana:       'INT',
};

/**
 * Returns the total bonus for a skill check (ability modifier + proficiency bonus).
 * @param {string} skill     - Skill name as defined in SKILL_MAP
 * @param {object} character - Character object with `attributes` and `level`
 * @returns {number}
 */
export function getSkillBonus(skill, character) {
  const attr = SKILL_MAP[skill];
  if (!attr) return 0;
  return calcMod(character.attributes[attr]) + profBonus(character.level);
}

/**
 * Formats a modifier with an explicit +/− sign.
 * @param {number} mod
 * @returns {string}
 */
export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** PT-BR display labels for each attribute key. */
export const ATTR_LABELS = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAB',
  CHA: 'CAR',
};
