/**
 * Dice result UI component.
 * Handles the roll animation, breakdown string, and special visual states
 * for critical hits (d20=20) and critical fails (d20=1) — UC-03 A01 / RAP002.
 */

/**
 * Updates the result area with a new roll result.
 * @param {object} result - { total, rolls, mod, sides, formula }
 */
export function updateDiceUI(result) {
  const numEl   = document.getElementById('result');
  const breakEl = document.getElementById('result-break');
  const critEl  = document.getElementById('crit-label');

  if (!numEl) return;

  const parsed = normalizeResult(result);

  // Removing and re-adding the class forces the browser to restart the animation
  numEl.classList.remove('roll-anim', 'crit', 'fail');
  void numEl.offsetWidth; // trigger reflow
  numEl.classList.add('roll-anim');

  numEl.textContent = parsed.total ?? '—';

  if (breakEl) breakEl.textContent = buildBreakdown(parsed);
  if (critEl)  critEl.className = 'crit-label';

  applySpecialEffects(parsed, numEl, critEl);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Normalises raw roll results to a consistent shape. */
function normalizeResult(result) {
  if (typeof result === 'number') {
    return { total: result, rolls: null, mod: 0, sides: null };
  }
  return {
    total: result.total ?? 0,
    rolls: result.rolls ?? null,
    mod:   result.mod ?? result.bonus ?? result.modifier ?? 0,
    sides: result.sides ?? null,
  };
}

/**
 * Builds a human-readable breakdown string from a roll result.
 * Example: [4, 2] + 3 = 9
 */
function buildBreakdown(result) {
  if (!result.rolls) return '';

  let text = `[${result.rolls.join(', ')}]`;
  if (result.mod > 0) text += ` + ${result.mod}`;
  if (result.mod < 0) text += ` - ${Math.abs(result.mod)}`;
  if (result.rolls.length > 1 || result.mod !== 0) text += ` = ${result.total}`;

  return text;
}

/**
 * Applies golden highlight for critical hits (d20=20) and red for critical
 * fails (d20=1). Only triggered for single d20 rolls — UC-03 A01.
 */
function applySpecialEffects(result, numEl, critEl) {
  if (!result.rolls || result.rolls.length !== 1 || result.sides !== 20) return;

  const roll = result.rolls[0];
  if (roll === 20) { numEl.classList.add('crit'); if (critEl) critEl.classList.add('visible'); }
  if (roll === 1)  { numEl.classList.add('fail'); }
}
