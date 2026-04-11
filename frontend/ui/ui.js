export function showScreen(id){
  document.querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));

  document.getElementById('s-' + id)?.classList.add('active');

  document.querySelectorAll('.nav-btn')
    .forEach(b => b.classList.remove('active'));

  document.querySelector(`[data-nav="${id}"]`)?.classList.add('active');
}

export function updateDiceUI(result){
  const resultEl = document.getElementById('result');
  const breakEl = document.getElementById('result-break');
  if(!resultEl) return;

  const parsed = normalizeResult(result);

  triggerRollAnimation(resultEl);
  resultEl.textContent = parsed.total ?? '-';

  if(breakEl){
    breakEl.textContent = buildBreakdown(parsed);
  }

  applySpecialEffects(parsed, resultEl);
}

function normalizeResult(result){
  if(typeof result === 'number'){
    return { total: result, rolls: null, mod: 0 };
  }

  return {
    total: result.total ?? 0,
    rolls: result.rolls ?? null,
    mod: result.mod ?? result.bonus ?? result.modifier ?? 0
  };
}

function buildBreakdown(result){
  if(!result.rolls) return '';

  let text = `[${result.rolls.join(', ')}]`;

  if(result.mod !== 0){
    text += result.mod > 0
      ? ` + ${result.mod}`
      : ` - ${Math.abs(result.mod)}`;
  }

  return text + ` = ${result.total}`;
}

function triggerRollAnimation(el){
  el.classList.remove('roll-anim');
  void el.offsetWidth;
  el.classList.add('roll-anim');
}

function applySpecialEffects(result, el){
  el.classList.remove('crit', 'fail');

  if(!result.rolls || result.rolls.length !== 1) return;

  const roll = result.rolls[0];

  if(roll === 20) el.classList.add('crit');
  if(roll === 1) el.classList.add('fail');
}