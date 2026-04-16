import { create } from 'zustand'
import { storage } from '@/lib/storage'
import { getMaxSpellSlots, getWarlockSlots } from '@/lib/engine'
import type { User, Character, HistoryEntry, Screen, RollResult } from '@/types'

interface AppState {
  screen: Screen
  navigate: (screen: Screen) => void
  user: User
  registeredEmails: string[]
  login:         (email: string, keepConnected: boolean) => void
  register:      (email: string, username: string) => void
  logout:        () => void
  updateProfile: (updates: Partial<Pick<User, 'username'>>) => void
  characters:          Character[]
  selectedCharacterId: number | null
  selectCharacter:     (id: number) => void
  addCharacter:        (char: Omit<Character, 'id'>) => void
  updateCharacter:     (id: number, data: Omit<Character, 'id'>) => void
  deleteCharacter:     (id: number) => void
  history:    HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void
  toast: { message: string; type: 'success' | 'error' | '' } | null
  showToast:  (message: string, type?: 'success' | 'error' | '') => void
  clearToast: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'login',
  navigate(screen) {
    const { user } = get()
    const pub: Screen[] = ['login', 'cadastro', 'esqueci-senha']
    if (!user.isLogged && !pub.includes(screen)) { set({ screen: 'login' }); return }
    set({ screen })
  },

  user: { isLogged: false, email: '', username: '', keepConnected: false },
  registeredEmails: ['teste@rpg.com'],

  login(email, keepConnected) {
    const saved = storage.getUser()
    const user: User = saved?.email === email
      ? { ...saved, keepConnected }
      : { isLogged: true, email, username: email.split('@')[0], keepConnected }
    if (keepConnected) storage.setUser({ ...user, isLogged: true })
    set({ user: { ...user, isLogged: true }, screen: 'dashboard' })
  },

  register(email, username) {
    const user: User = { isLogged: true, email, username, keepConnected: false }
    storage.addUsername(username)
    set(s => ({ user, registeredEmails: [...s.registeredEmails, email.toLowerCase()], screen: 'dashboard' }))
  },

  logout() {
    storage.removeUser()
    set({ user: { isLogged: false, email: '', username: '', keepConnected: false }, screen: 'login' })
  },

  updateProfile(updates) {
    const { user } = get()
    if (updates.username && updates.username !== user.username) {
      storage.removeUsername(user.username)
      storage.addUsername(updates.username)
    }
    const updated: User = { ...user, ...updates }
    storage.setUser(updated)
    set({ user: updated })
  },

  characters: storage.getCharacters(),
  selectedCharacterId: null,
  selectCharacter(id) { set({ selectedCharacterId: id }) },

  addCharacter(data) {
    const slots  = getMaxSpellSlots(data.class, data.level)
    const wSlots = getWarlockSlots(data.class, data.level)
    const char: Character = {
      id: Date.now(), ...data,
      subclass:      data.subclass ?? '',
      temp_hp:       data.temp_hp  ?? 0,
      spell_slots:   slots   ?? undefined,
      warlock_slots: wSlots  ?? undefined,
    }
    set(s => { const characters = [...s.characters, char]; storage.setCharacters(characters); return { characters } })
  },

  updateCharacter(id, data) {
    const slots  = getMaxSpellSlots(data.class, data.level)
    const wSlots = getWarlockSlots(data.class, data.level)
    set(s => {
      const existing = s.characters.find(c => c.id === id)
      const updated: Character = {
        id, ...data,
        subclass:      data.subclass      ?? existing?.subclass      ?? '',
        temp_hp:       data.temp_hp       ?? existing?.temp_hp       ?? 0,
        spell_slots:   slots  ?? undefined,
        warlock_slots: wSlots ? { ...wSlots, used: existing?.warlock_slots?.used ?? 0 } : undefined,
      }
      const characters = s.characters.map(c => c.id === id ? updated : c)
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

  history: storage.getHistory(),
  addHistory(entry) {
    set(s => {
      const next = [{ ...entry, timestamp: Date.now() }, ...s.history]
      if (next.length > 50) next.length = 50
      storage.setHistory(next)
      return { history: next }
    })
  },

  toast: null,
  showToast(message, type = '') {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  clearToast() { set({ toast: null }) },
}))

const saved = storage.getUser()
if (saved?.keepConnected) {
  useAppStore.setState({ user: { ...saved, isLogged: true }, screen: 'dashboard' })
}

export function useSelectedCharacter(): Character | undefined {
  return useAppStore(s => s.characters.find(c => c.id === s.selectedCharacterId))
}

export function dispatchRoll(result: RollResult, formula: string): void {
  useAppStore.getState().addHistory({ type: 'formula', formula, result })
}