/* ═══════════════════════════════════════════════
   ROLLCORE — State
   Armazena o estado global da aplicação.
   Personagens persistidos no localStorage
   (RF0002.1 — Fase 1, sem backend).
══════════════════════════════════════════════════ */

const STORAGE_KEY_USER  = 'rpg_user';
const STORAGE_KEY_CHARS = 'rpg_characters';

/** Carrega personagens do localStorage ou retorna lista vazia */
function loadCharacters() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CHARS);
    return saved ? JSON.parse(saved) : [];
  } catch (_) {
    return [];
  }
}

export const state = {
  currentScreen: 'login',

  user: {
    isLogged: false,
    email: '',
    keepConnected: false
  },

  // Mock de e-mails já cadastrados (UC-01 RN-04 — unicidade)
  registeredEmails: ['teste@rpg.com'],

  // Personagens persistidos no localStorage (tabela characters — UC-02)
  characters: loadCharacters(),

  selectedCharacterId: null,

  // Histórico de rolagens em memória (tabela dice_rolls — UC-03)
  history: []
};

/**
 * Persiste a lista de personagens no localStorage.
 * Simula o POST/PUT /characters do backend (UC-02 Fluxo Básico passos 8–9).
 */
export function saveCharacters() {
  localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(state.characters));
}

/**
 * Adiciona uma entrada ao histórico e mantém o limite de 50
 * registros (UC-03 RN-04).
 * @param {object} entry
 */
export function addHistory(entry) {
  state.history.unshift({
    ...entry,
    timestamp: Date.now()
  });

  // UC-03 RN-04: exibir apenas últimas 50 rolagens
  if (state.history.length > 50) {
    state.history.length = 50;
  }
}
