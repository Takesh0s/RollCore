/* ═══════════════════════════════════════════════
   ROLLCORE — Character Engine (D&D 5e SRD)
   Regras de cálculo conforme UC-02 e Seção 1.4.1
   do Documento de Visão — Equipe 9.
══════════════════════════════════════════════════ */

/**
 * Calcula o modificador de atributo D&D 5e.
 * Fórmula: floor((valor – 10) / 2)  — UC-02 RN-02
 * Exemplos: 1→–5 | 10→0 | 11→0 | 16→+3 | 20→+5
 * @param {number} value - Valor do atributo (1–20)
 * @returns {number}
 */
export function calcMod(value) {
  return Math.floor((value - 10) / 2);
}

/**
 * Calcula o Bônus de Proficiência por nível — UC-02 RN-03.
 * Tabela oficial D&D 5e SRD:
 *   Níveis  1– 4 → +2
 *   Níveis  5– 8 → +3
 *   Níveis  9–12 → +4
 *   Níveis 13–16 → +5
 *   Níveis 17–20 → +6
 * @param {number} level - Nível do personagem (1–20)
 * @returns {number}
 */
export function profBonus(level) {
  if (level <= 4)  return 2;
  if (level <= 8)  return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

// Mapa de perícias → atributo base (SRD D&D 5e)
const SKILL_MAP = {
  Atletismo:    'STR',
  Intimidacao:  'CHA',
  Percepcao:    'WIS',
  Furtividade:  'DEX',
  Arcana:       'INT'
};

/**
 * Retorna o bônus total de uma perícia (mod + proficiência).
 * @param {string} skill     - Nome da perícia
 * @param {object} character - Objeto personagem com attributes e profBonus
 * @returns {number}
 */
export function getSkillBonus(skill, character) {
  const attr = SKILL_MAP[skill];
  if (!attr) return 0;

  const baseMod = calcMod(character.attributes[attr]);
  return baseMod + profBonus(character.level);
}

/**
 * Formata um modificador com sinal (+/-).
 * @param {number} mod
 * @returns {string}
 */
export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Tradução das chaves de atributo para exibição em PT-BR
export const ATTR_LABELS = {
  STR: 'FOR',
  DEX: 'DES',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAB',
  CHA: 'CAR'
};
