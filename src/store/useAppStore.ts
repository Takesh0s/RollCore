import { create } from 'zustand'
import { api, tokenStorage } from '@/lib/api'
import { storage } from '@/lib/storage'
import { getMaxSpellSlots, getWarlockSlots } from '@/lib/engine'
import type {
  User, Character, HistoryEntry, Screen, RollResult,
  AuthTokens, CharacterApiResponse, DiceRollApiResponse,
} from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the API's camelCase response to the frontend's snake_case Character shape.
 * localAvatarUrl: when provided, preserves the locally-stored avatar instead of
 * overwriting with the server value (which is always null — no backend column yet).
 * This prevents the avatar from disappearing after server responses and page reloads.
 */
function mapCharacter(r: CharacterApiResponse, localAvatarUrl?: string): Character {
  return {
    id:            r.id as unknown as number,   // UUIDs from backend — cast for compatibility
    name:          r.name,
    class:         r.characterClass,
    subclass:      r.subclass ?? '',
    race:          r.race,
    level:         r.level,
    attributes:    r.attributes,
    hp:            r.hp,
    max_hp:        r.maxHp,
    temp_hp:       r.tempHp ?? 0,
    ac:            r.ac,
    spell_slots:   r.spellSlots   ?? undefined,
    warlock_slots: r.warlockSlots ?? undefined,
    // Preserve local avatar — backend has no avatar_url column (Fase 1 local-only)
    avatar_url:    localAvatarUrl ?? r.avatar_url,
  }
}

/** Maps the frontend Character shape to the API's CharacterRequest body. */
function mapCharacterRequest(c: Omit<Character, 'id'>) {
  return {
    name:           c.name,
    characterClass: c.class,
    subclass:       c.subclass ?? '',
    race:           c.race,
    level:          c.level,
    attributes:     c.attributes,
    hp:             c.hp,
    maxHp:          c.max_hp,
    tempHp:         c.temp_hp ?? 0,
  }
}

// ── Store interface ───────────────────────────────────────────────────────────

interface AppState {
  screen: Screen
  navigate: (screen: Screen) => void

  // Auth
  user:             User
  registeredEmails: string[]
  login:            (email: string, password: string, keepConnected: boolean) => Promise<void>
  register:         (email: string, username: string, password: string) => Promise<void>
  logout:           () => void
  updateProfile:    (updates: Partial<Pick<User, 'username' | 'avatar_url'>>) => Promise<void>

  // Characters
  characters:          Character[]
  selectedCharacterId: number | null
  isLoadingChars:      boolean
  selectCharacter:     (id: number) => void
  loadCharacters:      () => Promise<void>
  addCharacter:        (char: Omit<Character, 'id'>) => Promise<void>
  updateCharacter:     (id: number, data: Omit<Character, 'id'>) => Promise<void>
  deleteCharacter:     (id: number) => Promise<void>

  // Dice history
  history:    HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => Promise<void>
  loadHistory: () => Promise<void>

  // UI
  toast:      { message: string; type: 'success' | 'error' | '' } | null
  showToast:  (message: string, type?: 'success' | 'error' | '') => void
  clearToast: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'login',

  navigate(screen) {
    const { user } = get()
    const pub: Screen[] = ['login', 'cadastro', 'esqueci-senha']
    if (!user.isLogged && !pub.includes(screen)) { set({ screen: 'login' }); return }
    set({ screen })
  },

  // ── Auth ───────────────────────────────────────────────────────────────────

  user:             { isLogged: false, email: '', username: '', keepConnected: false },
  registeredEmails: ['teste@rpg.com'],

  async login(email, password, keepConnected) {
    try {
      const { data } = await api.post<AuthTokens>('/auth/login', { email, password })
      tokenStorage.set(data.accessToken, data.refreshToken)

      const user: User = {
        isLogged:      true,
        email:         data.email,
        username:      data.username,
        keepConnected,
        avatar_url:    storage.getUser()?.avatar_url,   // preserve local avatar until backend supports it
      }

      if (keepConnected) storage.setUser(user)
      set({ user, screen: 'dashboard' })

      // Load characters and history in background after login
      get().loadCharacters()
      get().loadHistory()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'E-mail ou senha incorretos.'
      get().showToast(msg, 'error')
      throw err
    }
  },

  async register(email, username, password) {
    try {
      const { data } = await api.post<AuthTokens>('/auth/register', { email, username, password })
      tokenStorage.set(data.accessToken, data.refreshToken)

      const user: User = { isLogged: true, email: data.email, username: data.username, keepConnected: false }
      set(s => ({ user, registeredEmails: [...s.registeredEmails, email.toLowerCase()], screen: 'dashboard' }))
      storage.addUsername(username)
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Erro ao cadastrar. Tente novamente.'
      get().showToast(msg, 'error')
      throw err
    }
  },

  logout() {
    tokenStorage.clear()
    storage.removeUser()
    set({
      user:       { isLogged: false, email: '', username: '', keepConnected: false },
      characters: [],
      history:    [],
      screen:     'login',
    })
  },

  async updateProfile(updates) {
    const { user } = get()

    // Avatar is stored locally only in Fase 1 — no backend endpoint yet
    const updatedUser: User = { ...user, ...updates }
    storage.setUser(updatedUser)
    set({ user: updatedUser })

    // Username change: update backend too if it's not just the avatar
    if (updates.username && updates.username !== user.username) {
      storage.removeUsername(user.username)
      storage.addUsername(updates.username)
      // NOTE: POST /users/profile will be added when the backend endpoint is ready
    }
  },

  // ── Characters ─────────────────────────────────────────────────────────────

  characters:          storage.getCharacters(),
  selectedCharacterId: null,
  isLoadingChars:      false,

  selectCharacter(id) { set({ selectedCharacterId: id }) },

  async loadCharacters() {
    set({ isLoadingChars: true })
    try {
      const { data } = await api.get<CharacterApiResponse[]>('/characters')
      // Preserve locally-stored avatar_url values — the backend has no avatar column
      const existingChars = get().characters
      const characters = data.map(r => {
        const existing = existingChars.find(c => String(c.id) === String(r.id))
        return mapCharacter(r, existing?.avatar_url)
      })
      storage.setCharacters(characters)
      set({ characters, isLoadingChars: false })
    } catch {
      // Fall back to local cache silently — user might be offline
      set({ isLoadingChars: false })
    }
  },

  async addCharacter(charData) {
    // Optimistic: compute slots locally for instant UI feedback
    const slots  = getMaxSpellSlots(charData.class, charData.level, charData.subclass)
    const wSlots = getWarlockSlots(charData.class, charData.level, charData.subclass)
    const optimistic: Character = {
      id:            Date.now(),
      ...charData,
      subclass:      charData.subclass      ?? '',
      temp_hp:       charData.temp_hp       ?? 0,
      spell_slots:   slots   ?? undefined,
      warlock_slots: wSlots  ?? undefined,
    }

    set(s => {
      const characters = [...s.characters, optimistic]
      storage.setCharacters(characters)
      return { characters }
    })

    try {
      const { data } = await api.post<CharacterApiResponse>('/characters', mapCharacterRequest(charData))
      // Preserve local avatar_url — not sent to or stored by the backend
      const saved = mapCharacter(data, charData.avatar_url)

      // Replace optimistic entry with server-assigned UUID
      set(s => {
        const characters = s.characters.map(c => c.id === optimistic.id ? saved : c)
        storage.setCharacters(characters)
        return { characters }
      })
    } catch (err: any) {
      // Rollback optimistic entry
      set(s => {
        const characters = s.characters.filter(c => c.id !== optimistic.id)
        storage.setCharacters(characters)
        return { characters }
      })
      get().showToast('Erro ao salvar personagem.', 'error')
      throw err
    }
  },

  async updateCharacter(id, data) {
    const slots  = getMaxSpellSlots(data.class, data.level, data.subclass)
    const wSlots = getWarlockSlots(data.class, data.level, data.subclass)

    set(s => {
      const existing  = s.characters.find(c => c.id === id)
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

    try {
      await api.put(`/characters/${id}`, mapCharacterRequest(data))
    } catch {
      get().showToast('Erro ao atualizar personagem.', 'error')
    }
  },

  async deleteCharacter(id) {
    set(s => {
      const characters = s.characters.filter(c => c.id !== id)
      storage.setCharacters(characters)
      return { characters, selectedCharacterId: null }
    })

    try {
      await api.delete(`/characters/${id}`)
    } catch {
      // Character already removed from UI; reload from server to stay in sync
      get().loadCharacters()
    }
  },

  // ── Dice history ───────────────────────────────────────────────────────────

  history: storage.getHistory(),

  async loadHistory() {
    try {
      const { data } = await api.get<DiceRollApiResponse[]>('/dice/history')
      const history: HistoryEntry[] = data.map(r => {
        const sidesMatch = r.formula.match(/d(\d+)/i)
        const sides = sidesMatch ? parseInt(sidesMatch[1], 10) : 0
        return {
          type:      'formula' as const,
          formula:   r.formula,
          result:    { total: r.total, rolls: r.rolls, mod: r.mod, sides, formula: r.formula },
          timestamp: new Date(r.rolledAt).getTime(),
        }
      })
      storage.setHistory(history)
      set({ history })
    } catch {
      // Backend unavailable — keep local cache as fallback
    }
  },

  async addHistory(entry) {
    // 1. Add to local history immediately for instant UI feedback
    const localEntry: HistoryEntry = { ...entry, timestamp: Date.now() }
    set(s => {
      const next = [localEntry, ...s.history]
      if (next.length > 50) next.length = 50
      storage.setHistory(next)
      return { history: next }
    })

    // 2. Persist the exact client-computed result to backend via /dice/save
    //    This keeps history consistent across all devices (PC, mobile, etc.)
    try {
      const { data } = await api.post<DiceRollApiResponse>('/dice/save', {
        formula: entry.formula ?? `1d${entry.result.sides}`,
        rolls:   entry.result.rolls,
        total:   entry.result.total,
        mod:     entry.result.mod ?? 0,
      })

      // Update local entry with the server-confirmed timestamp and id
      const confirmed: HistoryEntry = {
        ...localEntry,
        timestamp: new Date(data.rolledAt).getTime(),
      }
      set(s => {
        const next = s.history.map((h, i) => i === 0 ? confirmed : h)
        storage.setHistory(next)
        return { history: next }
      })
    } catch {
      // Backend unavailable — local entry stays, syncs on next loadHistory
    }
  },

  // ── Toast ──────────────────────────────────────────────────────────────────

  toast: null,
  showToast(message, type = '') {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  clearToast() { set({ toast: null }) },
}))

// ── Restore session on page reload ────────────────────────────────────────────

const saved = storage.getUser()
if (saved?.keepConnected && tokenStorage.getAccess()) {
  useAppStore.setState({ user: { ...saved, isLogged: true }, screen: 'dashboard' })
  useAppStore.getState().loadCharacters()
  useAppStore.getState().loadHistory()
}

// ── Selector helpers ──────────────────────────────────────────────────────────

export function useSelectedCharacter(): Character | undefined {
  return useAppStore(s => s.characters.find(c => c.id === s.selectedCharacterId))
}

export function dispatchRoll(result: RollResult, formula: string): void {
  useAppStore.getState().addHistory({ type: 'formula', formula, result })
}