/* ═══════════════════════════════════════════════
   ROLLCORE — App (Main Orchestrator)
   Sprint 1: botão Entrar desabilitado, link
   "Esqueci senha", onBlur e-mail, validação
   nível 1-20, validação atributos 1-20.
   Sprint 2: tela Meus Personagens, formulário
   criar personagem, salvar localStorage,
   listar personagens.
══════════════════════════════════════════════════ */

import { state, addHistory, saveCharacters }        from './state.js';
import { rollD20, rollFormula }                      from '../modules/dice/dice.js';
import { calcMod, profBonus, getSkillBonus,
         formatMod, ATTR_LABELS }                   from '../modules/character/engine.js';
import { updateDiceUI }                              from '../ui/components/dice.js';
import { showScreen }                                from '../ui/screens/navigation.js';

/* ── Constantes ───────────────────────────────── */
const VALID_SIDES     = [4, 6, 8, 10, 12, 20, 100];
const FORMULA_REGEX   = /^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\d+)?$/i;
const STRENGTH_COLORS = ['', '#e05555', '#e8a020', '#d4b830', '#4ade80'];

// Atributos base D&D 5e usados no formulário de criação
const ATTR_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/* ═══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  bindNavigation();
  bindAuth();
  bindLoginFields();       // Sprint 1: botão Entrar desabilitado
  bindEmailBlur();         // Sprint 1: onBlur no e-mail do cadastro
  bindPasswordStrength();
  bindDice();
  bindFormulaRoll();
  bindFormulaValidation();
  buildAttrFormFields();   // Sprint 2: gera campos de atributo dinamicamente
  bindNewCharacterForm();  // Sprint 2: formulário novo personagem
  bindPersonagensList();   // Sprint 2: tela lista de personagens
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
  if (!state.user.isLogged && screen !== 'login' && screen !== 'cadastro') {
    navigate('login');
    return;
  }

  state.currentScreen = screen;
  showScreen(screen);

  if (screen === 'personagens') renderCharacterList();
  if (screen === 'ficha')       renderCharacter();
  if (screen === 'dados')       renderHistory();
  if (screen === 'novo-personagem') resetNewCharForm();
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

function isStrongPassword(pass) {
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
}

function passwordStrength(pass) {
  let score = 0;
  if (pass.length >= 8)    score++;
  if (/[A-Z]/.test(pass))  score++;
  if (/[0-9]/.test(pass))  score++;
  if (pass.length >= 12)   score++;
  return score;
}

/* ═══════════════════════════════════════════════
   SPRINT 1 — Botão Entrar desabilitado
   UC-01 I02 Cmd 1: habilitado somente com
   e-mail e senha preenchidos.
══════════════════════════════════════════════════ */
function bindLoginFields() {
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');
  const btnEl   = document.getElementById('login-btn');

  function updateLoginBtn() {
    btnEl.disabled = !(emailEl.value.trim() && passEl.value.trim());
  }

  emailEl?.addEventListener('input', updateLoginBtn);
  passEl?.addEventListener('input', updateLoginBtn);
}

/* ═══════════════════════════════════════════════
   SPRINT 1 — onBlur no e-mail do cadastro
   UC-01 RAP001: valida e-mail no evento blur
   (ao sair do campo) antes da submissão.
══════════════════════════════════════════════════ */
function bindEmailBlur() {
  const emailEl = document.getElementById('reg-email');
  if (!emailEl) return;

  emailEl.addEventListener('blur', () => {
    const val = emailEl.value.trim();
    if (!val) return; // só valida se o usuário digitou algo

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError('reg-email-error', 'Informe um e-mail válido');
      markError('reg-email');
    } else if (state.registeredEmails.includes(val.toLowerCase())) {
      setError('reg-email-error',
        'E-mail já cadastrado. Utilize outro e-mail ou faça login.'); // MSG001
      markError('reg-email');
    } else {
      setError('reg-email-error', '');
      markValid('reg-email');
    }
  });
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

  // UC-01 E01 / RN-03: mensagem genérica — não especifica qual campo
  if (email === 'errado@teste.com') {
    setError('login-pass-error', 'E-mail ou senha incorretos.'); // MSG003
    markError('login-email');
    markError('login-password');
    return;
  }

  state.user = { isLogged: true, email, keepConnected: remember };

  if (remember) {
    localStorage.setItem('rpg_user', JSON.stringify(state.user));
  }

  document.getElementById('dash-welcome').textContent =
    `Bem-vindo, ${email.split('@')[0]}`;

  navigate('dashboard');
}

/* ═══════════════════════════════════════════════
   AUTH — CADASTRO (UC-01)
══════════════════════════════════════════════════ */
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
      setError('reg-pass-error',
        'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); // MSG002
      markError('reg-pass');
    } else if (val) {
      setError('reg-pass-error', '');
      markValid('reg-pass');
    } else {
      setError('reg-pass-error', '');
      passInput.classList.remove('input-error', 'input-valid');
    }

    if (confirmInput.value && confirmInput.value !== val) {
      setError('reg-confirm-error', 'As senhas não coincidem');
    } else if (confirmInput.value) {
      setError('reg-confirm-error', '');
    }
  });

  confirmInput?.addEventListener('input', () => {
    const confirm = confirmInput.value;
    if (confirm && confirm !== passInput.value) {
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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('reg-email-error', 'Informe um e-mail válido');
    markError('reg-email');
    valid = false;
  }

  if (email && state.registeredEmails.includes(email.toLowerCase())) {
    setError('reg-email-error',
      'E-mail já cadastrado. Utilize outro e-mail ou faça login.'); // MSG001
    markError('reg-email');
    valid = false;
  }

  if (!isStrongPassword(pass)) {
    setError('reg-pass-error',
      'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); // MSG002
    markError('reg-pass');
    valid = false;
  }

  if (pass !== confirm) {
    setError('reg-confirm-error', 'As senhas não coincidem');
    markError('reg-confirm');
    valid = false;
  }

  if (!valid) return;

  state.registeredEmails.push(email.toLowerCase());
  state.user = { isLogged: true, email, keepConnected: false };
  document.getElementById('dash-welcome').textContent =
    `Bem-vindo, ${email.split('@')[0]}`;

  showToast('Conta criada com sucesso!', 'success');
  navigate('dashboard');
}

/* ═══════════════════════════════════════════════
   SPRINT 2 — MEUS PERSONAGENS (RF0002.5)
   Lista todos os personagens do usuário.
══════════════════════════════════════════════════ */
function bindPersonagensList() {
  document.getElementById('btn-novo-personagem')
    ?.addEventListener('click', () => navigate('novo-personagem'));
}

function renderCharacterList() {
  const container = document.getElementById('char-list');
  if (!container) return;

  container.innerHTML = '';

  if (state.characters.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum personagem criado ainda.</p>
        <button class="btn-primary" style="width:auto;padding:10px 24px;margin-top:12px"
          id="btn-empty-novo">+ Criar primeiro personagem</button>
      </div>`;
    document.getElementById('btn-empty-novo')
      ?.addEventListener('click', () => navigate('novo-personagem'));
    return;
  }

  // RF0002.5: exibe nome, classe, raça e nível
  state.characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div class="char-card-info">
        <div class="char-card-name">${char.name}</div>
        <div class="char-card-meta">${char.class} · ${char.race} · Nível ${char.level}</div>
      </div>
      <button class="btn-view" data-id="${char.id}">Ver ficha →</button>
    `;
    card.querySelector('.btn-view').addEventListener('click', () => {
      state.selectedCharacterId = char.id;
      navigate('ficha');
    });
    container.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════
   SPRINT 2 — CRIAR PERSONAGEM (RF0002.1)
   Formulário com validações UC-02 E01 e E03.
══════════════════════════════════════════════════ */

/** Gera os 6 campos de atributo dinamicamente */
function buildAttrFormFields() {
  const container = document.getElementById('attr-form-container');
  if (!container) return;

  ATTR_KEYS.forEach(key => {
    const wrapper = document.createElement('div');
    wrapper.className = 'attr-form-item';
    wrapper.innerHTML = `
      <label class="attr-form-label">${ATTR_LABELS[key]}</label>
      <input class="form-input attr-form-input"
             id="new-attr-${key}"
             type="number" min="1" max="20" placeholder="1–20">
      <div class="attr-form-mod" id="new-mod-${key}">—</div>
      <small class="error-msg" id="new-attr-${key}-error"></small>
    `;
    container.appendChild(wrapper);

    // UC-02 E03: validação de atributo em tempo real (onChange)
    const input = wrapper.querySelector(`#new-attr-${key}`);
    input.addEventListener('input', () => {
      validateAttrField(key);
      updateProfBonusPreview();
    });
  });
}

/**
 * UC-02 E03: valida um campo de atributo (1–20).
 * Exibe modificador calculado em tempo real (UC-02 RE01).
 */
function validateAttrField(key) {
  const input  = document.getElementById(`new-attr-${key}`);
  const modEl  = document.getElementById(`new-mod-${key}`);
  const errEl  = document.getElementById(`new-attr-${key}-error`);
  const val    = parseInt(input.value, 10);

  if (!input.value) {
    modEl.textContent = '—';
    errEl.textContent = '';
    input.classList.remove('input-error', 'input-valid');
    return false;
  }

  if (isNaN(val) || val < 1 || val > 20) {
    // UC-02 E03: valor inválido → borda vermelha
    errEl.textContent = 'Valor deve ser entre 1 e 20';
    markError(`new-attr-${key}`);
    modEl.textContent = '—';
    return false;
  }

  errEl.textContent = '';
  markValid(`new-attr-${key}`);
  modEl.textContent = formatMod(calcMod(val)); // UC-02 RE01: cálculo em tempo real
  return true;
}

/** UC-02 RN-03: atualiza preview do bônus de proficiência ao alterar o nível */
function updateProfBonusPreview() {
  const levelVal = parseInt(document.getElementById('new-level')?.value, 10);
  const el       = document.getElementById('new-prof-bonus');
  if (!el) return;
  el.textContent = (!isNaN(levelVal) && levelVal >= 1 && levelVal <= 20)
    ? `+${profBonus(levelVal)}`
    : '+?';
}

function bindNewCharacterForm() {
  // Atualiza bônus de proficiência ao digitar o nível
  document.getElementById('new-level')?.addEventListener('input', () => {
    validateLevelField();
    updateProfBonusPreview();
  });

  document.getElementById('btn-salvar-personagem')
    ?.addEventListener('click', handleSaveCharacter);
}

/**
 * UC-02 E01: valida o campo Nível (1–20).
 * Exibe MSG004 para valores inválidos.
 */
function validateLevelField() {
  const input = document.getElementById('new-level');
  const errEl = document.getElementById('new-level-error');
  const val   = parseInt(input.value, 10);

  if (!input.value) {
    errEl.textContent = '';
    input.classList.remove('input-error', 'input-valid');
    return false;
  }

  if (isNaN(val) || val < 1 || val > 20) {
    errEl.textContent = 'Nível inválido. Informe um valor entre 1 e 20.'; // MSG004
    markError('new-level');
    return false;
  }

  errEl.textContent = '';
  markValid('new-level');
  return true;
}

function handleSaveCharacter() {
  // Limpa erros do formulário de criação
  document.querySelectorAll('#s-novo-personagem .error-msg')
    .forEach(e => { e.textContent = ''; });
  document.querySelectorAll('#s-novo-personagem .form-input')
    .forEach(e => e.classList.remove('input-error', 'input-valid'));

  let valid = true;

  // Nome
  const name = document.getElementById('new-name').value.trim();
  if (!name) {
    setError('new-name-error', 'Informe o nome do personagem');
    markError('new-name');
    valid = false;
  }

  // Classe
  const charClass = document.getElementById('new-class').value;
  if (!charClass) {
    setError('new-class-error', 'Selecione a classe');
    markError('new-class');
    valid = false;
  }

  // Raça
  const race = document.getElementById('new-race').value;
  if (!race) {
    setError('new-race-error', 'Selecione a raça');
    markError('new-race');
    valid = false;
  }

  // Nível — UC-02 E01
  const levelInput = document.getElementById('new-level');
  const level      = parseInt(levelInput.value, 10);
  if (!levelInput.value || isNaN(level) || level < 1 || level > 20) {
    setError('new-level-error', 'Nível inválido. Informe um valor entre 1 e 20.'); // MSG004
    markError('new-level');
    valid = false;
  }

  // Atributos — UC-02 E03
  const attributes = {};
  ATTR_KEYS.forEach(key => {
    if (!validateAttrField(key)) valid = false;
    else attributes[key] = parseInt(document.getElementById(`new-attr-${key}`).value, 10);
  });

  // HP Máx. e CA
  const maxHp = parseInt(document.getElementById('new-max-hp').value, 10);
  const ac    = parseInt(document.getElementById('new-ac').value, 10);
  if (!maxHp || maxHp < 1 || !ac || ac < 0) {
    setError('new-combat-error', 'Informe HP Máximo e CA válidos');
    valid = false;
  }

  // UC-02 A01: nenhum registro inserido se campos obrigatórios inválidos
  if (!valid) return;

  const newChar = {
    id:         Date.now(),
    name,
    class:      charClass,
    race,
    level,
    hp:         maxHp,
    max_hp:     maxHp,
    ac,
    attributes
  };

  // UC-02 passo 9: persiste no localStorage (simula POST /characters)
  state.characters.push(newChar);
  saveCharacters();

  showToast('Personagem salvo com sucesso!', 'success'); // MSG005
  navigate('personagens');
}

/** Reseta o formulário de novo personagem ao navegar para a tela */
function resetNewCharForm() {
  ['new-name', 'new-level', 'new-max-hp', 'new-ac'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['new-class', 'new-race'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });
  ATTR_KEYS.forEach(key => {
    const input = document.getElementById(`new-attr-${key}`);
    const mod   = document.getElementById(`new-mod-${key}`);
    if (input) input.value = '';
    if (mod)   mod.textContent = '—';
  });
  document.getElementById('new-prof-bonus').textContent = '+?';
  document.querySelectorAll('#s-novo-personagem .error-msg')
    .forEach(e => { e.textContent = ''; });
  document.querySelectorAll('#s-novo-personagem .form-input')
    .forEach(e => e.classList.remove('input-error', 'input-valid'));
}

/* ═══════════════════════════════════════════════
   FICHA DE PERSONAGEM — VISUALIZAÇÃO (UC-02)
══════════════════════════════════════════════════ */
function getSelectedCharacter() {
  return state.characters.find(c => c.id === state.selectedCharacterId);
}

function renderCharacter() {
  const char = getSelectedCharacter();
  if (!char) { navigate('personagens'); return; }

  document.getElementById('char-name').textContent = char.name;
  document.getElementById('char-meta').textContent =
    `${char.class} · ${char.race} · Nível ${char.level}`;

  // UC-02 RN-03
  document.getElementById('prof-bonus').textContent = `+${profBonus(char.level)}`;
  document.getElementById('char-hp').textContent    = char.max_hp ?? char.hp;
  document.getElementById('char-ac').textContent    = char.ac;

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
   PERÍCIAS
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
function validateFormula(str) {
  if (!str) return false;
  const m = str.match(FORMULA_REGEX);
  if (!m) return false;
  return VALID_SIDES.includes(parseInt(m[2], 10));
}

function rollFormulaString(formula) {
  const m     = formula.match(FORMULA_REGEX);
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  const mod   = m[3] ? parseInt(m[3], 10) : 0;
  const result = rollFormula(count, sides, mod);
  return { ...result, formula };
}

export function quickRoll(sides) {
  const result = rollFormula(1, sides, 0);
  addHistory({ type: 'formula', formula: `1d${sides}`, result });
  updateDiceUI(result);
  renderHistory();
}

function bindDice() {
  document.querySelectorAll('[data-roll]').forEach(btn => {
    btn.addEventListener('click', () => quickRoll(parseInt(btn.dataset.roll, 10)));
  });
}

function bindFormulaRoll() {
  const btn = document.getElementById('roll-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const input   = document.getElementById('formula');
    const formula = input.value.trim();
    if (!validateFormula(formula)) return;

    const result = rollFormulaString(formula);
    addHistory({ type: 'formula', formula, result });
    updateDiceUI(result);
    renderHistory();

    input.value = '';
    input.classList.remove('input-valid');
    btn.disabled = true;
  });
}

// UC-03 E01: validação em tempo real com MSG006
function bindFormulaValidation() {
  const input   = document.getElementById('formula');
  const btn     = document.getElementById('roll-btn');
  const errorEl = document.getElementById('formula-error');
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
      errorEl.textContent =
        'Fórmula inválida. Use o formato NdX, NdX+M ou NdX-M (ex: 2d6+3).'; // MSG006
      input.classList.add('input-error');
      input.classList.remove('input-valid');
      btn.disabled = true;
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

  state.history.forEach(entry => container.appendChild(renderHistoryEntry(entry)));
}

function renderHistoryEntry(entry) {
  const div    = document.createElement('div');
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

  const badge   = isCrit
    ? '<span class="h-badge crit">CRÍTICO</span>'
    : isFail ? '<span class="h-badge fail">FALHA</span>' : '';

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
   TOAST
══════════════════════════════════════════════════ */
let toastTimer = null;

export function showToast(msg, type = '') {
  const el      = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}
