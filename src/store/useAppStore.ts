import { create } from 'zustand'
import { storage } from '@/lib/storage'
import type { User, Character, HistoryEntry, Screen, RollResult } from '@/types'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  screen: Screen
  navigate: (screen: Screen) => void

  // Auth — UC-01
  user: User
  registeredEmails: string[]
  login:    (email: string, keepConnected: boolean) => void
  register: (email: string) => void
  logout:   () => void

  // Characters — UC-02
  characters:          Character[]
  selectedCharacterId: number | null
  selectCharacter:     (id: number) => void
  addCharacter:        (char: Omit<Character, 'id'>) => void
  updateCharacter:     (id: number, data: Omit<Character, 'id'>) => void
  deleteCharacter:     (id: number) => void

  // Dice history — UC-03 RN-04
  history:    HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void

  // Toast
  toast: { message: string; type: 'success' | 'error' | '' } | null
  showToast: (message: string, type?: 'success' | 'error' | '') => void
  clearToast: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Navigation ────────────────────────────────────────────────────────────
  screen: 'login',

  navigate(screen) {
    const { user } = get()
    const publicScreens: Screen[] = ['login', 'cadastro']
    if (!user.isLogged && !publicScreens.includes(screen)) {
      set({ screen: 'login' })
      return
    }
    set({ screen })
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  user: { isLogged: false, email: '', keepConnected: false },
  registeredEmails: ['teste@rpg.com'],

  login(email, keepConnected) {
    const user: User = { isLogged: true, email, keepConnected }
    if (keepConnected) storage.setUser(user)
    set({ user, screen: 'dashboard' })
  },

  register(email) {
    const user: User = { isLogged: true, email, keepConnected: false }
    set(s => ({
      user,
      registeredEmails: [...s.registeredEmails, email.toLowerCase()],
      screen: 'dashboard',
    }))
  },

  logout() {
    storage.removeUser()
    set({ user: { isLogged: false, email: '', keepConnected: false }, screen: 'login' })
  },

  // ── Characters ────────────────────────────────────────────────────────────
  characters:          storage.getCharacters(),
  selectedCharacterId: null,

  selectCharacter(id) {
    set({ selectedCharacterId: id })
  },

  addCharacter(data) {
    const char: Character = { id: Date.now(), ...data }
    set(s => {
      const characters = [...s.characters, char]
      storage.setCharacters(characters)
      return { characters }
    })
  },

  updateCharacter(id, data) {
    set(s => {
      const characters = s.characters.map(c => c.id === id ? { id, ...data } : c)
      storage.setCharacters(characters)
      return { characters }
    })
  },

  deleteCharacter(id) {
    set(s => {
      const characters = s.characters.filter(c => c.id !== id)
      storage.setCharacters(characters)
      return { characters, selectedCharacterId: null }
    })
  },

  // ── History ───────────────────────────────────────────────────────────────
  history: [],

  addHistory(entry) {
    set(s => {
      const next = [{ ...entry, timestamp: Date.now() }, ...s.history]
      // UC-03 RN-04: limite de 50 entradas
      if (next.length > 50) next.length = 50
      return { history: next }
    })
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: null,

  showToast(message, type = '') {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },

  clearToast() { set({ toast: null }) },
}))

// ─── Session rehydration ──────────────────────────────────────────────────────
// Runs once on module load — restores session if keepConnected is true
const saved = storage.getUser()
if (saved?.keepConnected) {
  useAppStore.setState({ user: saved, screen: 'dashboard' })
}

// ─── Typed selector helper ────────────────────────────────────────────────────
export function useSelectedCharacter(): Character | undefined {
  return useAppStore(s => s.characters.find(c => c.id === s.selectedCharacterId))
}

/** Adds a roll to history and returns the result — convenience wrapper */
export function dispatchRoll(result: RollResult, formula: string): void {
  useAppStore.getState().addHistory({ type: 'formula', formula, result })
}
