export function showScreen(id){
  document.querySelectorAll('.screen')
    .forEach(s => s.classList.remove('active'));

  const target = document.getElementById('s-' + id);
  if(target) target.classList.add('active');

  document.querySelectorAll('.nav-btn')
    .forEach(b => b.classList.remove('active'));

  const activeBtn = document.querySelector(`[data-nav="${id}"]`);
  if(activeBtn) activeBtn.classList.add('active');
}

export function updateDiceUI(result){
  const resultEl = document.getElementById('result');
  const breakEl = document.getElementById('result-break');

  if(resultEl){
    resultEl.textContent = result.total;
  }

  if(breakEl && result.rolls){
    const mod = result.bonus ?? result.mod ?? 0;
    const modText = mod !== 0 ? ` + ${mod}` : '';

    breakEl.textContent = `[${result.rolls.join(', ')}]${modText}`;
  }
}