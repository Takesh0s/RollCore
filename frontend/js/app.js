import { state, addHistory } from './state.js';
import { rollD20, rollFormula } from './dice.js';
import { getSkillBonus, calcMod } from './engine.js';
import { updateDiceUI, showScreen } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  bindNavigation();
  bindDice();
  bindFormulaRoll();
  bindAuth();
  checkSession();
});

function bindNavigation(){
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const screen = el.dataset.nav;

      if(!state.user.isLogged && screen !== 'login' && screen !== 'cadastro'){
        navigate('login');
        return;
      }

      navigate(screen);
    });
  });
}

function bindAuth(){
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('register-btn')?.addEventListener('click', handleRegister);
}

function handleLogin(){
  clearErrors();

  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  const remember = document.getElementById('remember').checked;

  let valid = true;

  if(!email){
    setError('login-email-error', 'Informe o e-mail');
    valid = false;
  }

  if(!pass){
    setError('login-pass-error', 'Informe a senha');
    valid = false;
  }

  if(!valid) return;

  state.user.isLogged = true;
  state.user.keepConnected = remember;

  if(remember){
    localStorage.setItem('rpg_user', JSON.stringify(state.user));
  }

  navigate('dashboard');
}

function handleRegister(){
  clearErrors();

  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value.trim();
  const confirm = document.getElementById('reg-confirm').value.trim();

  let valid = true;

  if(!email){
    setError('reg-email-error', 'Informe o e-mail');
    valid = false;
  }

  if(pass.length < 6){
    setError('reg-pass-error', 'Senha deve ter pelo menos 6 caracteres');
    valid = false;
  }

  if(pass !== confirm){
    setError('reg-confirm-error', 'As senhas não coincidem');
    valid = false;
  }

  if(!valid) return;

  state.user.isLogged = true;
  navigate('dashboard');
}

function checkSession(){
  const saved = localStorage.getItem('rpg_user');

  if(saved){
    const user = JSON.parse(saved);

    if(user.keepConnected){
      state.user = user;
      navigate('dashboard');
    }
  }
}

function setError(id, message){
  const el = document.getElementById(id);
  if(el) el.textContent = message;
}

function clearErrors(){
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}

function bindDice(){
  document.querySelectorAll('[data-roll]').forEach(btn => {
    btn.addEventListener('click', () => {
      quickRoll(parseInt(btn.dataset.roll, 10));
    });
  });
}

function bindFormulaRoll(){
  const btn = document.getElementById('roll-btn');
  if(!btn) return;

  btn.addEventListener('click', () => {
    const input = document.getElementById('formula');
    const formula = input.value.trim();

    if(!formula){
      alert('Digite uma fórmula!');
      return;
    }

    try{
      const result = rollFormulaString(formula);

      addHistory({
        type: 'formula',
        formula,
        result
      });

      updateDiceUI(result);
      updateHistoryUI();
      input.value = '';

    }catch{
      alert('Fórmula inválida! Ex: 2d6+3');
    }
  });
}

function rollFormulaString(formula){
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if(!match) throw new Error('invalid');

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const mod = match[3] ? parseInt(match[3], 10) : 0;

  const rolls = [];
  let total = 0;

  for(let i = 0; i < count; i++){
    const roll = rollFormula(1, sides, 0);
    rolls.push(roll.rolls[0]);
    total += roll.rolls[0];
  }

  total += mod;

  return { total, rolls, mod };
}

function updateHistoryUI(){
  const container = document.getElementById('history');
  if(!container) return;

  container.innerHTML = '';

  state.history.slice(0, 20).forEach(entry => {
    container.appendChild(renderHistoryEntry(entry));
  });
}

function renderHistoryEntry(entry){
  const div = document.createElement('div');

  const formatMod = (mod) => {
    if(!mod) return '';
    return mod > 0 ? `+ ${mod}` : `- ${Math.abs(mod)}`;
  };

  switch(entry.type){
    case 'formula':
      div.innerHTML = `
        <strong>${entry.formula}</strong> →
        [${entry.result.rolls?.join(', ') ?? '-'}]
        ${formatMod(entry.result.mod)}
        = <b>${entry.result.total}</b>
      `;
      break;

    case 'dice':
      div.innerHTML = `
        d${entry.sides} →
        <b>${entry.result.total ?? entry.result}</b>
      `;
      break;

    case 'skill':
      div.innerHTML = `
        ${entry.skill} →
        [${entry.result.rolls?.[0] ?? '-'}]
        ${formatMod(entry.result.mod)}
        = <b>${entry.result.total}</b>
      `;
      break;
  }

  return div;
}

function getSelectedCharacter(){
  return state.characters.find(c => c.id === state.selectedCharacterId);
}

export function rollSkill(skill){
  const character = getSelectedCharacter();
  const bonus = getSkillBonus(skill, character);
  const result = rollD20(bonus);

  addHistory({ type: 'skill', skill, result });

  updateDiceUI(result);
  updateHistoryUI();
  showScreen('dados');
}

export function quickRoll(sides){
  const result = rollFormula(1, sides, 0);

  addHistory({ type: 'dice', sides, result });

  updateDiceUI(result);
  updateHistoryUI();
}

export function navigate(screen){
  state.currentScreen = screen;
  showScreen(screen);

  if(screen === 'ficha'){
    renderCharacter();
  }
}

function renderCharacter(){
  const char = getSelectedCharacter();
  if(!char) return;

  document.getElementById('char-name').textContent = char.name;
  document.getElementById('char-meta').textContent =
    `${char.class} • Nível ${char.level}`;

  document.getElementById('prof-bonus').textContent = `+${char.profBonus}`;

  const container = document.getElementById('attr-container');
  container.innerHTML = '';

  Object.entries(char.attributes).forEach(([key, value]) => {
    const mod = calcMod(value);

    const div = document.createElement('div');
    div.className = 'attr-box';

    div.innerHTML = `
      <span>${translateAttr(key)}</span>
      <strong>${value}</strong>
      <small>${formatMod(mod)}</small>
    `;

    container.appendChild(div);
  });

  document.getElementById('hp').textContent = char.hp;
  document.getElementById('ac').textContent = char.ac;
}

function translateAttr(attr){
  return {
    STR:'FOR', DEX:'DES', CON:'CON',
    INT:'INT', WIS:'SAB', CHA:'CAR'
  }[attr] || attr;
}

function formatMod(mod){
  return mod >= 0 ? `+${mod}` : mod;
}

export function logout(){
  state.user = { isLogged: false, keepConnected: false };
  localStorage.removeItem('rpg_user');
  navigate('login');
}