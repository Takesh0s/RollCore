/* ═══════════════════════════════════════════════
   ROLLCORE — Dice UI Component
   Atualiza a área de resultado de rolagem.
   Implementa:
     - Animação de rolagem (roll-anim)
     - Destaque crítico d20=20 com borda dourada
       (UC-03 A01 / RAP002 — HU-03)
     - Destaque de falha crítica d20=1
     - Breakdown: fórmula → [individuais] = total
══════════════════════════════════════════════════ */

/**
 * Atualiza a UI de dados com o resultado de uma rolagem.
 * @param {object} result - { total, rolls, mod, sides, formula }
 */
export function updateDiceUI(result) {
  const numEl   = document.getElementById('result');
  const breakEl = document.getElementById('result-break');
  const critEl  = document.getElementById('crit-label');

  if (!numEl) return;

  const parsed = normalizeResult(result);

  // Animação de rolagem
  numEl.classList.remove('roll-anim', 'crit', 'fail');
  void numEl.offsetWidth; // força reflow para reiniciar animação
  numEl.classList.add('roll-anim');

  numEl.textContent = parsed.total ?? '—';

  if (breakEl) {
    breakEl.textContent = buildBreakdown(parsed);
  }

  // Reseta label de crítico
  if (critEl) critEl.className = 'crit-label';

  applySpecialEffects(parsed, numEl, critEl);
}

/* ── Helpers ─────────────────────────────────── */

function normalizeResult(result) {
  if (typeof result === 'number') {
    return { total: result, rolls: null, mod: 0, sides: null };
  }
  return {
    total: result.total ?? 0,
    rolls: result.rolls ?? null,
    mod:   result.mod ?? result.bonus ?? result.modifier ?? 0,
    sides: result.sides ?? null
  };
}

/**
 * Monta a string de breakdown.
 * Exemplo: [4, 2] + 3 = 9
 */
function buildBreakdown(result) {
  if (!result.rolls) return '';

  let text = `[${result.rolls.join(', ')}]`;

  if (result.mod > 0) text += ` + ${result.mod}`;
  if (result.mod < 0) text += ` - ${Math.abs(result.mod)}`;

  if (result.rolls.length > 1 || result.mod !== 0) {
    text += ` = ${result.total}`;
  }

  return text;
}

/**
 * Aplica estilos especiais para crítico e falha crítica.
 * UC-03 A01: resultado máximo d20=20 → borda dourada + "Crítico!"
 * README: falha crítica d20=1 → destaque vermelho
 */
function applySpecialEffects(result, numEl, critEl) {
  if (!result.rolls || result.rolls.length !== 1 || result.sides !== 20) return;

  const roll = result.rolls[0];

  if (roll === 20) {
    numEl.classList.add('crit');
    if (critEl) critEl.classList.add('visible');
  }

  if (roll === 1) {
    numEl.classList.add('fail');
  }
}
