/* ═══════════════════════════════════════════════
   ROLLCORE — App (Main Orchestrator)
   Inicializa todos os bindings e orquestra os
   módulos: auth, navegação, dados e ficha.
══════════════════════════════════════════════════ */

import { state, addHistory }               from './state.js';
import { rollD20, rollFormula }             from '../modules/dice/dice.js';
import { calcMod, profBonus, getSkillBonus, formatMod, ATTR_LABELS } from '../modules/character/engine.js';
import { updateDiceUI }                    from '../ui/components/dice.js';
import { showScreen }                      from '../ui/screens/navigation.js';

/* ── Tipos válidos de dado (UC-03 RN-01) ──────── */
const VALID_SIDES   = [4, 6, 8, 10, 12, 20, 100];

/** Regex de validação de fórmula: NdX, NdX+M, NdX-M (UC-03 RN-01) */
const FORMULA_REGEX = /^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\d+)?$/i;

/** Cores do indicador de força de senha */
const STRENGTH_COLORS = ['', '#e05555', '#e8a020', '#d4b830', '#4ade80'];

/* ═══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  bindNavigation();
  bindAuth();
  bindDice();
  bindFormulaRoll();
  bindFormulaValidation();
  bindPasswordStrength();
});

/* ═══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════ */
function bindNavigation() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });
}

export function navigate(screen) {
  // Protege rotas autenticadas
  if (!state.user.isLogged && screen !== 'login' && screen !== 'cadastro') {
    navigate('login');
    return;
  }

  state.currentScreen = screen;
  showScreen(screen);

  if (screen === 'ficha') renderCharacter();
  if (screen === 'dados') renderHistory();
}

/* ═══════════════════════════════════════════════
   SESSION PERSISTENCE
══════════════════════════════════════════════════ */
function checkSession() {
  const saved = localStorage.getItem('rpg_user');
  if (!saved) return;

  try {
    const u = JSON.parse(saved);
    if (u.keepConnected) {
      state.user = u;
      document.getElementById('dash-welcome').textContent =
        `Bem-vindo, ${u.email.split('@')[0]}`;
      navigate('dashboard');
    }
  } catch (_) { /* token corrompido — ignora */ }
}

/* ═══════════════════════════════════════════════
   AUTH HELPERS
══════════════════════════════════════════════════ */
function clearErrors() {
  document.querySelectorAll('.error-msg')
    .forEach(e => { e.textContent = ''; });
  document.querySelectorAll('.form-input')
    .forEach(e => e.classList.remove('input-error', 'input-valid'));
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function markError(inputId) {
  document.getElementById(inputId)?.classList.add('input-error');
}

function markValid(inputId) {
  const el = document.getElementById(inputId);
  if (el) { el.classList.remove('input-error'); el.classList.add('input-valid'); }
}

/**
 * UC-01 RN-01: Valida critérios de senha forte.
 * Mínimo 8 caracteres, 1 letra maiúscula, 1 número.
 */
function isStrongPassword(pass) {
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
}

/**
 * Retorna score 0–4 para a barra de força.
 */
function passwordStrength(pass) {
  let score = 0;
  if (pass.length >= 8)  score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (pass.length >= 12) score++;
  return score;
}

/* ═══════════════════════════════════════════════
   AUTH — LOGIN (UC-01)
══════════════════════════════════════════════════ */
function bindAuth() {
  document.getElementById('login-btn')
    ?.addEventListener('click', handleLogin);

  document.getElementById('register-btn')
    ?.addEventListener('click', handleRegister);
}

function handleLogin() {
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const pass     = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  let valid = true;

  if (!email) {
    setError('login-email-error', 'Informe o e-mail');
    markError('login-email');
    valid = false;
  }

  if (!pass) {
    setError('login-pass-error', 'Informe a senha');
    markError('login-password');
    valid = false;
  }

  if (!valid) return;

  // UC-01 E01 / RN-03: mensagem genérica — não especifica qual campo
  // Mock: "errado@teste.com" simula credenciais inválidas
  if (email === 'errado@teste.com') {
    setError('login-pass-error', 'E-mail ou senha incorretos.'); // MSG003
    markError('login-email');
    markError('login-password');
    return;
  }

  // Login bem-sucedido
  state.user = { isLogged: true, email, keepConnected: remember };

  if (remember) {
    // UC-01 A02: persiste sessão (simula cookie HttpOnly com localStorage)
    localStorage.setItem('rpg_user', JSON.stringify(state.user));
  }

  document.getElementById('dash-welcome').textContent =
    `Bem-vindo, ${email.split('@')[0]}`;

  navigate('dashboard');
}

/* ═══════════════════════════════════════════════
   AUTH — CADASTRO (UC-01)
══════════════════════════════════════════════════ */

/** Barra de força de senha — feedback em tempo real (UC-01 RE01) */
function bindPasswordStrength() {
  const passInput    = document.getElementById('reg-pass');
  const confirmInput = document.getElementById('reg-confirm');
  const fill         = document.getElementById('pass-strength-fill');

  if (!passInput) return;

  passInput.addEventListener('input', () => {
    const val   = passInput.value;
    const score = passwordStrength(val);

    fill.style.width      = (score * 25) + '%';
    fill.style.background = STRENGTH_COLORS[score] || 'transparent';

    if (val && !isStrongPassword(val)) {
      // MSG002 — UC-01 E02
      setError('reg-pass-error',
        'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.');
      markError('reg-pass');
    } else if (val) {
      setError('reg-pass-error', '');
      markValid('reg-pass');
    } else {
      setError('reg-pass-error', '');
      passInput.classList.remove('input-error', 'input-valid');
    }

    // Reavalia confirmação ao alterar senha
    if (confirmInput.value && confirmInput.value !== val) {
      setError('reg-confirm-error', 'As senhas não coincidem');
    } else if (confirmInput.value) {
      setError('reg-confirm-error', '');
    }
  });

  confirmInput?.addEventListener('input', () => {
    const pass    = passInput.value;
    const confirm = confirmInput.value;

    if (confirm && confirm !== pass) {
      setError('reg-confirm-error', 'As senhas não coincidem');
      markError('reg-confirm');
    } else {
      setError('reg-confirm-error', '');
      confirmInput.classList.remove('input-error');
      if (confirm) confirmInput.classList.add('input-valid');
    }
  });
}

function handleRegister() {
  clearErrors();

  const email   = document.getElementById('reg-email').value.trim();
  const pass    = document.getElementById('reg-pass').value;
  const confirm = document.getElementById('reg-confirm').value;

  let valid = true;

  // Validação de e-mail
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('reg-email-error', 'Informe um e-mail válido');
    markError('reg-email');
    valid = false;
  }

  // UC-01 A01 / RN-04: unicidade de e-mail → MSG001
  if (email && state.registeredEmails.includes(email.toLowerCase())) {
    setError('reg-email-error',
      'E-mail já cadastrado. Utilize outro e-mail ou faça login.'); // MSG001
    markError('reg-email');
    valid = false;
  }

  // UC-01 E02 / RN-01: senha forte → MSG002
  if (!isStrongPassword(pass)) {
    setError('reg-pass-error',
      'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); // MSG002
    markError('reg-pass');
    valid = false;
  }

  // Confirmação de senha
  if (pass !== confirm) {
    setError('reg-confirm-error', 'As senhas não coincidem');
    markError('reg-confirm');
    valid = false;
  }

  if (!valid) return;

  // Registra e-mail no mock (simula INSERT na tabela users)
  state.registeredEmails.push(email.toLowerCase());
  state.user = { isLogged: true, email, keepConnected: false };

  document.getElementById('dash-welcome').textContent =
    `Bem-vindo, ${email.split('@')[0]}`;

  showToast('Conta criada com sucesso!', 'success');
  navigate('dashboard');
}

/* ═══════════════════════════════════════════════
   FICHA DE PERSONAGEM (UC-02)
══════════════════════════════════════════════════ */
function getSelectedCharacter() {
  return state.characters.find(c => c.id === state.selectedCharacterId);
}

function renderCharacter() {
  const char = getSelectedCharacter();
  if (!char) return;

  document.getElementById('char-name').textContent = char.name;
  document.getElementById('char-meta').textContent =
    `${char.class} • Nível ${char.level}`;

  // UC-02 RN-03: bônus de proficiência pelo nível
  document.getElementById('prof-bonus').textContent = `+${profBonus(char.level)}`;
  document.getElementById('char-hp').textContent = char.hp;
  document.getElementById('char-ac').textContent = char.ac;

  const container = document.getElementById('attr-container');
  container.innerHTML = '';

  // UC-02 RN-02: modificador = floor((valor–10)/2)
  Object.entries(char.attributes).forEach(([key, value]) => {
    const mod = calcMod(value);
    const div = document.createElement('div');
    div.className = 'attr-box';
    div.innerHTML = `
      <span>${ATTR_LABELS[key] || key}</span>
      <strong>${value}</strong>
      <small>${formatMod(mod)}</small>
    `;
    container.appendChild(div);
  });
}

/* ═══════════════════════════════════════════════
   PERÍCIAS (exportado para uso externo)
══════════════════════════════════════════════════ */
export function rollSkill(skill) {
  const character = getSelectedCharacter();
  const bonus     = getSkillBonus(skill, character);
  const result    = rollD20(bonus);

  addHistory({ type: 'skill', skill, result });
  updateDiceUI(result);
  renderHistory();
  navigate('dados');
}

/* ═══════════════════════════════════════════════
   DADOS — ROLAGEM (UC-03)
══════════════════════════════════════════════════ */

/** UC-03 RN-01: valida formato NdX, NdX+M, NdX-M */
function validateFormula(str) {
  if (!str) return false;
  const m = str.match(FORMULA_REGEX);
  if (!m) return false;
  return VALID_SIDES.includes(parseInt(m[2], 10));
}

/**
 * Interpreta uma string de fórmula e retorna o resultado.
 * @param {string} formula - Ex: "2d6+3"
 * @returns {{ total, rolls, mod, sides, formula }}
 */
function rollFormulaString(formula) {
  const m     = formula.match(FORMULA_REGEX);
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const mod   = m[3] ? parseInt(m[3], 10) : 0;

  const result = rollFormula(count, sides, mod);
  return { ...result, formula };
}

/** UC-03 S01: rolagem por atalho rápido d4–d100 */
export function quickRoll(sides) {
  const result = rollFormula(1, sides, 0);
  const entry  = { type: 'formula', formula: `1d${sides}`, result };

  addHistory(entry);
  updateDiceUI(result);
  renderHistory();
}

/* ── Bindings de dados ───────────────────────── */
function bindDice() {
  document.querySelectorAll('[data-roll]').forEach(btn => {
    btn.addEventListener('click', () => {
      quickRoll(parseInt(btn.dataset.roll, 10));
    });
  });
}

function bindFormulaRoll() {
  const btn = document.getElementById('roll-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const input   = document.getElementById('formula');
    const formula = input.value.trim();

    if (!validateFormula(formula)) return; // botão já estará desabilitado

    const result = rollFormulaString(formula);
    addHistory({ type: 'formula', formula, result });
    updateDiceUI(result);
    renderHistory();

    input.value = '';
    input.classList.remove('input-valid');
    btn.disabled = true;
  });
}

/**
 * UC-03 E01: validação de fórmula em tempo real (onChange).
 * Exibe MSG006 e desabilita o botão "Rolar" se inválida.
 */
function bindFormulaValidation() {
  const input    = document.getElementById('formula');
  const btn      = document.getElementById('roll-btn');
  const errorEl  = document.getElementById('formula-error');

  if (!input) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();

    if (!val) {
      errorEl.textContent = '';
      input.classList.remove('input-error', 'input-valid');
      btn.disabled = true;
      return;
    }

    if (!validateFormula(val)) {
      // UC-03 E01 — MSG006
      errorEl.textContent =
        'Fórmula inválida. Use o formato NdX, NdX+M ou NdX-M (ex: 2d6+3).';
      input.classList.add('input-error');
      input.classList.remove('input-valid');
      btn.disabled = true; // UC-03 E01: botão permanece desabilitado
    } else {
      errorEl.textContent = '';
      input.classList.remove('input-error');
      input.classList.add('input-valid');
      btn.disabled = false;
    }
  });
}

/* ═══════════════════════════════════════════════
   HISTÓRICO (UC-03 S02 / RN-04)
══════════════════════════════════════════════════ */
function renderHistory() {
  const container = document.getElementById('history');
  if (!container) return;

  container.innerHTML = '';

  if (state.history.length === 0) {
    container.innerHTML =
      '<div style="color:var(--text-muted);font-size:14px;padding:12px 0">Nenhuma rolagem ainda.</div>';
    return;
  }

  // UC-03 RN-04: exibe até 50 entradas (já limitado em addHistory)
  state.history.forEach(entry => {
    container.appendChild(renderHistoryEntry(entry));
  });
}

function renderHistoryEntry(entry) {
  const div = document.createElement('div');

  const result = entry.result;
  const isCrit = result?.sides === 20 && result?.rolls?.[0] === 20;
  const isFail = result?.sides === 20 && result?.rolls?.[0] === 1;

  div.className = 'history-entry' +
    (isCrit ? ' crit-entry' : isFail ? ' fail-entry' : '');

  let breakdown = '';

  if (result?.rolls) {
    breakdown = `[${result.rolls.join(', ')}]`;
    if (result.mod > 0) breakdown += ` +${result.mod}`;
    if (result.mod < 0) breakdown += ` ${result.mod}`;
  }

  const badge = isCrit
    ? '<span class="h-badge crit">CRÍTICO</span>'
    : isFail
      ? '<span class="h-badge fail">FALHA</span>'
      : '';

  const formula = entry.formula || (entry.skill ? entry.skill : `d${entry.sides}`);
  const total   = result?.total ?? entry.result;

  div.innerHTML = `
    <span class="h-formula">${formula}${breakdown ? ' → ' + breakdown : ''}</span>
    <span style="display:flex;align-items:center;gap:8px">
      ${badge}
      <span class="h-total">${total}</span>
    </span>
  `;

  return div;
}

/* ═══════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════ */
export function logout() {
  state.user = { isLogged: false, email: '', keepConnected: false };
  localStorage.removeItem('rpg_user');
  navigate('login');
}

/* ═══════════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════════════ */
let toastTimer = null;

export function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent  = msg;
  el.className    = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}
