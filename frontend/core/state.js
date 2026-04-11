/**
 * Global application state for the Vanilla JS prototype.
 * In the production backend this data lives in PostgreSQL (UC-01, UC-02, UC-03).
 * Characters are persisted in localStorage to simulate the REST API between
 * page reloads (Phase 1, no backend).
 */

const STORAGE_KEY_USER  = 'rpg_user';
const STORAGE_KEY_CHARS = 'rpg_characters';

/** Loads characters from localStorage, returning an empty array on any error. */
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
    keepConnected: false,
  },

  // Seed with a pre-existing e-mail to simulate the `users` table — UC-01 RN-04
  registeredEmails: ['teste@rpg.com'],

  // Characters hydrated from localStorage on load — mirrors `characters` table (UC-02)
  characters: loadCharacters(),

  selectedCharacterId: null,

  // In-memory roll history — mirrors `dice_rolls` table (UC-03)
  history: [],
};

/**
 * Persists the character list to localStorage.
 * Simulates POST/PUT /characters from the backend (UC-02 basic flow steps 8–9).
 */
export function saveCharacters() {
  localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(state.characters));
}

/**
 * Prepends an entry to the roll history and enforces the 50-entry limit — UC-03 RN-04.
 * @param {object} entry - Roll entry without a timestamp (added here).
 */
export function addHistory(entry) {
  state.history.unshift({
    ...entry,
    timestamp: Date.now(),
  });

  if (state.history.length > 50) {
    state.history.length = 50;
  }
}
