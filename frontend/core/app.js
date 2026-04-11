/* ═══════════════════════════════════════════════
   ROLLCORE — App (Main Orchestrator)
   Sprint 1: botão Entrar desabilitado, link
   "Esqueci senha", onBlur e-mail, validação
   nível 1-20, validação atributos 1-20.
   Sprint 2: tela Meus Personagens, criar
   personagem, salvar localStorage, listar.
   Sprint 3: editar personagem (RF0002.4),
   excluir com confirmação (RF0002.6),
   exibição de max_hp (Seção 9.2),
   data/hora no histórico (UC-03 S02 p.18).
══════════════════════════════════════════════════ */

import { state, addHistory, saveCharacters }   from './state.js';
import { rollD20, rollFormula }                 from '../modules/dice/dice.js';
import { calcMod, profBonus, getSkillBonus,
         formatMod, ATTR_LABELS }              from '../modules/character/engine.js';
import { updateDiceUI }                         from '../ui/components/dice.js';
import { showScreen }                           from '../ui/screens/navigation.js';

/* ── Constantes ───────────────────────────────── */
const VALID_SIDES     = [4, 6, 8, 10, 12, 20, 100];
const FORMULA_REGEX   = /^([1-9][0-9]?)d(4|6|8|10|12|20|100)([+-]\d+)?$/i;
const STRENGTH_COLORS = ['', '#e05555', '#e8a020', '#d4b830', '#4ade80'];
const ATTR_KEYS       = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/* ═══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  bindNavigation();
  bindAuth();
  bindLoginFields();
  bindEmailBlur();
  bindPasswordStrength();
  bindDice();
  bindFormulaRoll();
  bindFormulaValidation();
  buildAttrFormFields('attr-form-container', 'new'); // Sprint 2: novo personagem
  buildAttrFormFields('edit-attr-container', 'edit'); // Sprint 3: editar personagem
  bindNewCharacterForm();
  bindEditCharacterForm();   // Sprint 3
  bindDeleteModal();         // Sprint 3
  bindPersonagensList();
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

  if (screen === 'personagens')       renderCharacterList();
  if (screen === 'ficha')             renderCharacter();
  if (screen === 'dados')             renderHistory();
  if (screen === 'novo-personagem')   resetForm('new');
  if (screen === 'editar-personagem') loadEditForm();
}

/* ═══════════════════════════════════════════════
   SESSION
══════════════════════════════════════════════════ */
function checkSession() {
  try {
    const u = JSON.parse(localStorage.getItem('rpg_user') || 'null');
    if (u?.keepConnected) {
      state.user = u;
      document.getElementById('dash-welcome').textContent =
        `Bem-vindo, ${u.email.split('@')[0]}`;
      navigate('dashboard');
    }
  } catch (_) {}
}

/* ═══════════════════════════════════════════════
   AUTH HELPERS
══════════════════════════════════════════════════ */
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => { e.textContent = ''; });
  document.querySelectorAll('.form-input').forEach(e => e.classList.remove('input-error', 'input-valid'));
}

function setError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function markError(id)     { document.getElementById(id)?.classList.add('input-error'); }
function markValid(id)     {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('input-error'); el.classList.add('input-valid'); }
}

function isStrongPassword(p) { return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p); }
function passwordStrength(p) {
  let s = 0;
  if (p.length >= 8)   s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (p.length >= 12)  s++;
  return s;
}

/* ═══════════════════════════════════════════════
   SPRINT 1 — Botão Entrar / onBlur e-mail
══════════════════════════════════════════════════ */
function bindLoginFields() {
  const em  = document.getElementById('login-email');
  const pw  = document.getElementById('login-password');
  const btn = document.getElementById('login-btn');
  const upd = () => { btn.disabled = !(em.value.trim() && pw.value.trim()); };
  em?.addEventListener('input', upd);
  pw?.addEventListener('input', upd);
}

function bindEmailBlur() {
  const el = document.getElementById('reg-email');
  if (!el) return;
  el.addEventListener('blur', () => {
    const v = el.value.trim();
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError('reg-email-error', 'Informe um e-mail válido'); markError('reg-email');
    } else if (state.registeredEmails.includes(v.toLowerCase())) {
      setError('reg-email-error', 'E-mail já cadastrado. Utilize outro e-mail ou faça login.'); markError('reg-email');
    } else { setError('reg-email-error', ''); markValid('reg-email'); }
  });
}

/* ═══════════════════════════════════════════════
   AUTH — LOGIN / CADASTRO (UC-01)
══════════════════════════════════════════════════ */
function bindAuth() {
  document.getElementById('login-btn')?.addEventListener('click', handleLogin);
  document.getElementById('register-btn')?.addEventListener('click', handleRegister);
}

function handleLogin() {
  clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const pass     = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember').checked;

  if (email === 'errado@teste.com') {
    setError('login-pass-error', 'E-mail ou senha incorretos.'); // MSG003
    markError('login-email'); markError('login-password');
    return;
  }

  state.user = { isLogged: true, email, keepConnected: remember };
  if (remember) localStorage.setItem('rpg_user', JSON.stringify(state.user));
  document.getElementById('dash-welcome').textContent = `Bem-vindo, ${email.split('@')[0]}`;
  navigate('dashboard');
}

function bindPasswordStrength() {
  const pi = document.getElementById('reg-pass');
  const ci = document.getElementById('reg-confirm');
  const fi = document.getElementById('pass-strength-fill');
  if (!pi) return;

  pi.addEventListener('input', () => {
    const v = pi.value, s = passwordStrength(v);
    fi.style.width      = (s * 25) + '%';
    fi.style.background = STRENGTH_COLORS[s] || 'transparent';
    if (v && !isStrongPassword(v)) { setError('reg-pass-error', 'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); markError('reg-pass'); }
    else if (v) { setError('reg-pass-error', ''); markValid('reg-pass'); }
    else { setError('reg-pass-error', ''); pi.classList.remove('input-error', 'input-valid'); }
    if (ci.value && ci.value !== v) setError('reg-confirm-error', 'As senhas não coincidem');
    else if (ci.value) setError('reg-confirm-error', '');
  });

  ci?.addEventListener('input', () => {
    const c = ci.value;
    if (c && c !== pi.value) { setError('reg-confirm-error', 'As senhas não coincidem'); markError('reg-confirm'); }
    else { setError('reg-confirm-error', ''); ci.classList.remove('input-error'); if (c) ci.classList.add('input-valid'); }
  });
}

function handleRegister() {
  clearErrors();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const conf  = document.getElementById('reg-confirm').value;
  let valid   = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('reg-email-error', 'Informe um e-mail válido'); markError('reg-email'); valid = false; }
  if (email && state.registeredEmails.includes(email.toLowerCase())) { setError('reg-email-error', 'E-mail já cadastrado. Utilize outro e-mail ou faça login.'); markError('reg-email'); valid = false; }
  if (!isStrongPassword(pass)) { setError('reg-pass-error', 'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); markError('reg-pass'); valid = false; }
  if (pass !== conf) { setError('reg-confirm-error', 'As senhas não coincidem'); markError('reg-confirm'); valid = false; }
  if (!valid) return;

  state.registeredEmails.push(email.toLowerCase());
  state.user = { isLogged: true, email, keepConnected: false };
  document.getElementById('dash-welcome').textContent = `Bem-vindo, ${email.split('@')[0]}`;
  showToast('Conta criada com sucesso!', 'success');
  navigate('dashboard');
}

/* ═══════════════════════════════════════════════
   MEUS PERSONAGENS (RF0002.5)
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
    document.getElementById('btn-empty-novo')?.addEventListener('click', () => navigate('novo-personagem'));
    return;
  }

  state.characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div class="char-card-info">
        <div class="char-card-name">${char.name}</div>
        <div class="char-card-meta">${char.class} · ${char.race} · Nível ${char.level}</div>
      </div>
      <div class="char-card-actions">
        <button class="btn-edit"  data-id="${char.id}">✏️ Editar</button>
        <button class="btn-view"  data-id="${char.id}">Ver ficha →</button>
      </div>
    `;
    // Ver ficha
    card.querySelector('.btn-view').addEventListener('click', () => {
      state.selectedCharacterId = char.id;
      navigate('ficha');
    });
    // Editar — Sprint 3 (RF0002.4)
    card.querySelector('.btn-edit').addEventListener('click', () => {
      state.selectedCharacterId = char.id;
      navigate('editar-personagem');
    });
    container.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════
   SHARED: campos de atributo dinâmicos
   Reutilizado por "novo" e "editar".
══════════════════════════════════════════════════ */
function buildAttrFormFields(containerId, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;

  ATTR_KEYS.forEach(key => {
    const wrapper = document.createElement('div');
    wrapper.className = 'attr-form-item';
    wrapper.innerHTML = `
      <label class="attr-form-label">${ATTR_LABELS[key]}</label>
      <input class="form-input attr-form-input"
             id="${prefix}-attr-${key}"
             type="number" min="1" max="20" placeholder="1–20">
      <div class="attr-form-mod" id="${prefix}-mod-${key}">—</div>
      <small class="error-msg" id="${prefix}-attr-${key}-error"></small>
    `;
    container.appendChild(wrapper);

    wrapper.querySelector(`#${prefix}-attr-${key}`).addEventListener('input', () => {
      validateAttrField(key, prefix);
      updateProfPreview(prefix);
    });
  });
}

function validateAttrField(key, prefix) {
  const input = document.getElementById(`${prefix}-attr-${key}`);
  const modEl = document.getElementById(`${prefix}-mod-${key}`);
  const errEl = document.getElementById(`${prefix}-attr-${key}-error`);
  const val   = parseInt(input.value, 10);

  if (!input.value) { modEl.textContent = '—'; errEl.textContent = ''; input.classList.remove('input-error', 'input-valid'); return false; }
  if (isNaN(val) || val < 1 || val > 20) { errEl.textContent = 'Valor deve ser entre 1 e 20'; markError(`${prefix}-attr-${key}`); modEl.textContent = '—'; return false; }

  errEl.textContent = '';
  markValid(`${prefix}-attr-${key}`);
  modEl.textContent = formatMod(calcMod(val));
  return true;
}

function updateProfPreview(prefix) {
  const v  = parseInt(document.getElementById(`${prefix}-level`)?.value, 10);
  const el = document.getElementById(`${prefix}-prof-bonus`);
  if (!el) return;
  el.textContent = (!isNaN(v) && v >= 1 && v <= 20) ? `+${profBonus(v)}` : '+?';
}

function validateLevelField(prefix) {
  const input = document.getElementById(`${prefix}-level`);
  const errEl = document.getElementById(`${prefix}-level-error`);
  const val   = parseInt(input.value, 10);
  if (!input.value) { errEl.textContent = ''; input.classList.remove('input-error', 'input-valid'); return false; }
  if (isNaN(val) || val < 1 || val > 20) { errEl.textContent = 'Nível inválido. Informe um valor entre 1 e 20.'; markError(`${prefix}-level`); return false; }
  errEl.textContent = '';
  markValid(`${prefix}-level`);
  return true;
}

function collectCharacterData(prefix) {
  // Limpa erros da seção
  document.querySelectorAll(`#s-${prefix === 'new' ? 'novo' : 'editar'}-personagem .error-msg`)
    .forEach(e => { e.textContent = ''; });
  document.querySelectorAll(`#s-${prefix === 'new' ? 'novo' : 'editar'}-personagem .form-input`)
    .forEach(e => e.classList.remove('input-error', 'input-valid'));

  let valid = true;

  const name = document.getElementById(`${prefix}-name`).value.trim();
  if (!name) { setError(`${prefix}-name-error`, 'Informe o nome do personagem'); markError(`${prefix}-name`); valid = false; }

  const charClass = document.getElementById(`${prefix}-class`).value;
  if (!charClass) { setError(`${prefix}-class-error`, 'Selecione a classe'); markError(`${prefix}-class`); valid = false; }

  const race = document.getElementById(`${prefix}-race`).value;
  if (!race) { setError(`${prefix}-race-error`, 'Selecione a raça'); markError(`${prefix}-race`); valid = false; }

  const levelInput = document.getElementById(`${prefix}-level`);
  const level      = parseInt(levelInput.value, 10);
  if (!levelInput.value || isNaN(level) || level < 1 || level > 20) {
    setError(`${prefix}-level-error`, 'Nível inválido. Informe um valor entre 1 e 20.'); markError(`${prefix}-level`); valid = false;
  }

  const attributes = {};
  ATTR_KEYS.forEach(key => {
    if (!validateAttrField(key, prefix)) valid = false;
    else attributes[key] = parseInt(document.getElementById(`${prefix}-attr-${key}`).value, 10);
  });

  const maxHp = parseInt(document.getElementById(`${prefix}-max-hp`).value, 10);
  const ac    = parseInt(document.getElementById(`${prefix}-ac`).value, 10);
  if (!maxHp || maxHp < 1 || isNaN(ac) || ac < 0) {
    setError(`${prefix}-combat-error`, 'Informe HP Máximo e CA válidos'); valid = false;
  }

  if (!valid) return null;
  return { name, class: charClass, race, level, hp: maxHp, max_hp: maxHp, ac, attributes };
}

function resetForm(prefix) {
  [`${prefix}-name`, `${prefix}-level`, `${prefix}-max-hp`, `${prefix}-ac`].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  [`${prefix}-class`, `${prefix}-race`].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });
  ATTR_KEYS.forEach(key => {
    const inp = document.getElementById(`${prefix}-attr-${key}`);
    const mod = document.getElementById(`${prefix}-mod-${key}`);
    if (inp) inp.value = '';
    if (mod) mod.textContent = '—';
  });
  const pb = document.getElementById(`${prefix}-prof-bonus`);
  if (pb) pb.textContent = '+?';
  document.querySelectorAll(`#s-${prefix === 'new' ? 'novo' : 'editar'}-personagem .error-msg`)
    .forEach(e => { e.textContent = ''; });
  document.querySelectorAll(`#s-${prefix === 'new' ? 'novo' : 'editar'}-personagem .form-input`)
    .forEach(e => e.classList.remove('input-error', 'input-valid'));
}

/* ═══════════════════════════════════════════════
   SPRINT 2 — CRIAR PERSONAGEM (RF0002.1)
══════════════════════════════════════════════════ */
function bindNewCharacterForm() {
  document.getElementById('new-level')?.addEventListener('input', () => {
    validateLevelField('new'); updateProfPreview('new');
  });
  document.getElementById('btn-salvar-personagem')?.addEventListener('click', () => {
    const data = collectCharacterData('new');
    if (!data) return;
    state.characters.push({ id: Date.now(), ...data });
    saveCharacters();
    showToast('Personagem salvo com sucesso!', 'success'); // MSG005
    navigate('personagens');
  });
}

/* ═══════════════════════════════════════════════
   SPRINT 3 — EDITAR PERSONAGEM (RF0002.4)
   UC-02 S01: carrega dados atuais, permite
   alterar e salva via PUT /characters/{id}.
══════════════════════════════════════════════════ */
function bindEditCharacterForm() {
  document.getElementById('edit-level')?.addEventListener('input', () => {
    validateLevelField('edit'); updateProfPreview('edit');
  });

  document.getElementById('btn-salvar-edicao')?.addEventListener('click', () => {
    const data = collectCharacterData('edit');
    if (!data) return;

    // Atualiza o personagem na lista (simula PUT /characters/{id})
    const idx = state.characters.findIndex(c => c.id === state.selectedCharacterId);
    if (idx === -1) return;
    state.characters[idx] = { ...state.characters[idx], ...data };
    saveCharacters();

    showToast('Alterações salvas com sucesso!', 'success'); // MSG005
    navigate('personagens');
  });

  // Botão editar na tela de ficha
  document.getElementById('btn-editar-ficha')?.addEventListener('click', () => {
    navigate('editar-personagem');
  });
}

/** Pré-preenche o formulário de edição com os dados do personagem selecionado */
function loadEditForm() {
  const char = state.characters.find(c => c.id === state.selectedCharacterId);
  if (!char) { navigate('personagens'); return; }

  resetForm('edit');

  document.getElementById('edit-name').value  = char.name;
  document.getElementById('edit-level').value = char.level;
  document.getElementById('edit-max-hp').value = char.max_hp ?? char.hp;
  document.getElementById('edit-ac').value    = char.ac;

  // Classe e raça nos selects
  const classEl = document.getElementById('edit-class');
  const raceEl  = document.getElementById('edit-race');
  [...classEl.options].forEach(o => { if (o.value === char.class) o.selected = true; });
  [...raceEl.options].forEach(o  => { if (o.value === char.race)  o.selected = true; });

  // Atributos
  ATTR_KEYS.forEach(key => {
    const val   = char.attributes[key] ?? '';
    const input = document.getElementById(`edit-attr-${key}`);
    const mod   = document.getElementById(`edit-mod-${key}`);
    if (input) input.value = val;
    if (mod && val) mod.textContent = formatMod(calcMod(val));
  });

  updateProfPreview('edit');
}

/* ═══════════════════════════════════════════════
   SPRINT 3 — EXCLUIR PERSONAGEM (RF0002.6)
   UC-02 S02: diálogo de confirmação antes do
   DELETE /characters/{id} (hard delete).
══════════════════════════════════════════════════ */
function bindDeleteModal() {
  const overlay   = document.getElementById('modal-excluir');
  const btnExcl   = document.getElementById('btn-excluir-personagem');
  const btnCancel = document.getElementById('modal-cancelar');
  const btnConfirm = document.getElementById('modal-confirmar');

  // Abre o modal ao clicar em "Excluir"
  btnExcl?.addEventListener('click', () => {
    overlay.classList.add('active');
  });

  // Cancela — fecha o modal
  btnCancel?.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  // Fecha clicando fora do modal
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  // Confirma exclusão (simula DELETE /characters/{id} — hard delete)
  btnConfirm?.addEventListener('click', () => {
    state.characters = state.characters.filter(c => c.id !== state.selectedCharacterId);
    saveCharacters();
    overlay.classList.remove('active');
    state.selectedCharacterId = null;
    showToast('Personagem excluído.', '');
    navigate('personagens');
  });
}

/* ═══════════════════════════════════════════════
   FICHA — VISUALIZAÇÃO (UC-02)
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
  document.getElementById('prof-bonus').textContent = `+${profBonus(char.level)}`;

  // Sprint 3: exibe max_hp separado (Seção 9.2 — tabela characters)
  document.getElementById('char-hp').textContent = char.max_hp ?? char.hp;
  document.getElementById('char-ac').textContent = char.ac;

  const container = document.getElementById('attr-container');
  container.innerHTML = '';
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
  return m ? VALID_SIDES.includes(parseInt(m[2], 10)) : false;
}

function rollFormulaString(formula) {
  const m      = formula.match(FORMULA_REGEX);
  const result = rollFormula(parseInt(m[1], 10), parseInt(m[2], 10), m[3] ? parseInt(m[3], 10) : 0);
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

function bindFormulaValidation() {
  const input   = document.getElementById('formula');
  const btn     = document.getElementById('roll-btn');
  const errorEl = document.getElementById('formula-error');
  if (!input) return;
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (!val) { errorEl.textContent = ''; input.classList.remove('input-error', 'input-valid'); btn.disabled = true; return; }
    if (!validateFormula(val)) {
      errorEl.textContent = 'Fórmula inválida. Use o formato NdX, NdX+M ou NdX-M (ex: 2d6+3).'; // MSG006
      input.classList.add('input-error'); input.classList.remove('input-valid'); btn.disabled = true;
    } else {
      errorEl.textContent = ''; input.classList.remove('input-error'); input.classList.add('input-valid'); btn.disabled = false;
    }
  });
}

/* ═══════════════════════════════════════════════
   HISTÓRICO (UC-03 S02 / RN-04)
   Sprint 3: exibe rolled_at (data/hora) em
   cada entrada — UC-03 S02 passo 18.
══════════════════════════════════════════════════ */
function renderHistory() {
  const container = document.getElementById('history');
  if (!container) return;
  container.innerHTML = '';

  if (state.history.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:14px;padding:12px 0">Nenhuma rolagem ainda.</div>';
    return;
  }

  state.history.forEach(entry => container.appendChild(renderHistoryEntry(entry)));
}

/**
 * UC-03 S02 passo 18: exibe fórmula, resultados individuais, total e data/hora.
 * Formato de data: DD/MM/AAAA HH:MM
 */
function formatTimestamp(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistoryEntry(entry) {
  const div    = document.createElement('div');
  const result = entry.result;
  const isCrit = result?.sides === 20 && result?.rolls?.[0] === 20;
  const isFail = result?.sides === 20 && result?.rolls?.[0] === 1;

  div.className = 'history-entry' + (isCrit ? ' crit-entry' : isFail ? ' fail-entry' : '');

  let breakdown = '';
  if (result?.rolls) {
    breakdown = `[${result.rolls.join(', ')}]`;
    if (result.mod > 0) breakdown += ` +${result.mod}`;
    if (result.mod < 0) breakdown += ` ${result.mod}`;
  }

  const badge   = isCrit
    ? '<span class="h-badge crit">CRÍTICO</span>'
    : isFail ? '<span class="h-badge fail">FALHA</span>' : '';

  const formula    = entry.formula || (entry.skill ? entry.skill : `d${entry.sides}`);
  const total      = result?.total ?? entry.result;
  const timeString = entry.timestamp ? formatTimestamp(entry.timestamp) : '';

  div.innerHTML = `
    <div class="h-left">
      <span class="h-formula">${formula}${breakdown ? ' → ' + breakdown : ''}</span>
      ${timeString ? `<span class="h-time">${timeString}</span>` : ''}
    </div>
    <span style="display:flex;align-items:center;gap:8px">
      ${badge}
      <span class="h-total">${total}</span>
    </span>
  `;
  return div;
}

/* ═══════════════════════════════════════════════
   LOGOUT / TOAST
══════════════════════════════════════════════════ */
export function logout() {
  state.user = { isLogged: false, email: '', keepConnected: false };
  localStorage.removeItem('rpg_user');
  navigate('login');
}

let toastTimer = null;
export function showToast(msg, type = '') {
  const el      = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ` toast-${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}
