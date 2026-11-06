import { create } from 'zustand'
import { api, tokenStorage } from '@/lib/api'
import { storage } from '@/lib/storage'
import { shrink } from '@/lib/image'
import { getMaxSpellSlots, getWarlockSlots } from '@/lib/engine'
import type {
  User, Character, HistoryEntry, Screen, RollResult,
  AuthTokens, CharacterApiResponse, UserProfileApiResponse, DiceRollApiResponse,
  TableSummary, TableDetail, CreateTableInput, DiceMode, DiceShortcut,
} from '@/types'

// Data transformation helpers

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
    // The server copy wins; the local one only fills in for photos that were never uploaded
    avatar_url:    r.avatarUrl ?? localAvatarUrl,
    game_system:   r.gameSystem ?? 'D&D 5e',
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
    gameSystem:     c.game_system ?? 'D&D 5e',
    // Omitted when unknown so a save never wipes the portrait stored on the server
    ...(c.avatar_url ? { avatarUrl: c.avatar_url } : {}),
  }
}

// Application state interface
interface AppState {
  screen: Screen
  navigate: (screen: Screen) => void

  // Authentication and user management
  user:             User
  registeredEmails: string[]
  login:            (email: string, password: string, keepConnected: boolean) => Promise<void>
  register:         (email: string, username: string, password: string) => Promise<void>
  loginWithGoogle:  (idToken: string) => Promise<void>
  logout:           () => void
  loadProfile:      () => Promise<void>
  updateProfile:    (updates: Partial<Pick<User, 'username' | 'avatar_url'>>) => Promise<void>

  // Character management
  characters:          Character[]
  selectedCharacterId: number | null
  isLoadingChars:      boolean
  selectCharacter:     (id: number) => void
  loadCharacters:      () => Promise<void>
  addCharacter:        (char: Omit<Character, 'id'>) => Promise<void>
  updateCharacter:     (id: number, data: Omit<Character, 'id'>) => Promise<void>
  patchCharacterLocal: (id: number, patch: Partial<Character>) => void
  deleteCharacter:     (id: number) => Promise<void>

  // Dice roll history
  history:    HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => Promise<void>
  loadHistory: () => Promise<void>
  /** Rola no servidor (SecureRandom), com motivo, vantagem/desvantagem e mesa opcionais. */
  rollDice:   (input: RollInput) => Promise<HistoryEntry | null>

  // Atalhos de rolagem salvos
  shortcuts:      DiceShortcut[]
  loadShortcuts:  () => Promise<void>
  addShortcut:    (name: string, formula: string) => Promise<boolean>
  removeShortcut: (id: string) => Promise<void>

  // Tables (mesas)
  tables:          TableSummary[]
  isLoadingTables: boolean
  tableDetail:     TableDetail | null
  loadTables:      () => Promise<void>
  createTable:     (input: CreateTableInput) => Promise<TableDetail>
  openTable:       (id: string) => Promise<void>

  // UI notifications
  toast:      { message: string; type: 'success' | 'error' | '' } | null
  showToast:  (message: string, type?: 'success' | 'error' | '') => void
  clearToast: () => void
}

/** Dados enviados ao servidor para rolar. */
export interface RollInput {
  formula:  string
  label?:   string
  mode?:    DiceMode
  tableId?: string
}

/** Converte a resposta da API de rolagem em uma entrada do histórico. */
function apiRollToEntry(r: DiceRollApiResponse, sides: number): HistoryEntry {
  return {
    type:      'formula',
    formula:   r.formula,
    result:    { total: r.total, rolls: r.rolls, mod: r.mod, sides, formula: r.formula },
    timestamp: new Date(r.rolledAt).getTime(),
    label:     r.label ?? undefined,
    mode:      r.mode ?? 'normal',
    discarded: r.discardedRolls ?? undefined,
    tableId:   r.tableId ?? undefined,
    tableName: r.tableName ?? undefined,
  }
}

// Store implementation
/** Photo cached in this browser, but only if it belongs to the account that is signing in. */
function cachedAvatar(email: string): string | undefined {
  const cached = storage.getUser()
  return cached && cached.email.toLowerCase() === email.toLowerCase() ? cached.avatar_url : undefined
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'login',

  navigate(screen) {
    const { user } = get()
    const pub: Screen[] = ['login', 'cadastro', 'esqueci-senha']
    if (!user.isLogged && !pub.includes(screen)) { set({ screen: 'login' }); return }
    set({ screen })
  },

  // Authentication handlers
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
        avatar_url:    cachedAvatar(data.email),
      }

      if (keepConnected) storage.setUser(user)
      set({ user, screen: 'dashboard' })

      // Load characters and history in background after login
      get().loadProfile()
      get().loadCharacters()
      get().loadHistory()
      get().loadShortcuts()
      get().loadTables()
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'E-mail ou senha incorretos.'
      get().showToast(msg, 'error')
      throw err
    }
  },

  async loginWithGoogle(idToken) {
    try {
      const { data } = await api.post<AuthTokens>('/auth/google', { idToken })
      tokenStorage.set(data.accessToken, data.refreshToken)

      const user: User = {
        isLogged:      true,
        email:         data.email,
        username:      data.username,
        keepConnected: true,
        avatar_url:    cachedAvatar(data.email),
      }

      storage.setUser(user)
      set({ user, screen: 'dashboard' })

      get().loadProfile()
      get().loadCharacters()
      get().loadHistory()
      get().loadTables()
    } catch (err: any) {
      get().showToast('Não foi possível entrar com o Google. Tente novamente.', 'error')
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
      shortcuts:  [],
      tables:     [],
      tableDetail: null,
      screen:     'login',
    })
  },

  /** Pulls username and photo from the account so every device shows the same profile. */
  async loadProfile() {
    try {
      const { data } = await api.get<UserProfileApiResponse>('/users/me')
      const { user } = get()
      let avatar = data.avatarUrl ?? undefined

      // One-time migration: a photo chosen before profiles were synced only exists in this browser.
      if (!avatar && user.avatar_url?.startsWith('data:image/')) {
        try {
          await api.put('/users/me', { avatarUrl: user.avatar_url })
          avatar = user.avatar_url
        } catch { /* too large or offline: keep the local copy */ }
      }

      const updated: User = { ...user, username: data.username, email: data.email, avatar_url: avatar }
      if (user.keepConnected) storage.setUser(updated)
      set({ user: updated })
    } catch {
      // Offline: keep the cached profile.
    }
  },

  async updateProfile(updates) {
    const { user } = get()
    const body: { username?: string; avatarUrl?: string } = {}
    if (updates.username && updates.username !== user.username) body.username = updates.username
    if ('avatar_url' in updates && updates.avatar_url !== user.avatar_url) body.avatarUrl = updates.avatar_url ?? ''

    if (Object.keys(body).length > 0) {
      const { data } = await api.put<UserProfileApiResponse>('/users/me', body)
      if (body.username) {
        storage.removeUsername(user.username)
        storage.addUsername(data.username)
      }
      const updatedUser: User = { ...user, username: data.username, avatar_url: data.avatarUrl ?? undefined }
      if (user.keepConnected) storage.setUser(updatedUser)
      set({ user: updatedUser })
    }
  },

  // Character management handlers
  characters:          storage.getCharacters(),
  selectedCharacterId: null,
  isLoadingChars:      false,

  selectCharacter(id) { set({ selectedCharacterId: id }) },

  async loadCharacters() {
    set({ isLoadingChars: true })
    try {
      const { data } = await api.get<CharacterApiResponse[]>('/characters')
      const existingChars = get().characters
      const characters = data.map(r => {
        const existing = existingChars.find(c => String(c.id) === String(r.id))
        const mapped = mapCharacter(r, existing?.avatar_url)
        // One-time migration: a portrait chosen before sheets synced it only exists in this browser.
        if (!r.avatarUrl && existing?.avatar_url?.startsWith('data:image/')) {
          const local = existing.avatar_url
          void (async () => {
            try {
              const small = local.length > 300_000 ? await shrink(local) : local
              await api.put(`/characters/${r.id}`, mapCharacterRequest({ ...mapped, avatar_url: small }))
            } catch { /* too large or offline: the local copy stays */ }
          })()
        }
        return mapped
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

  async updateCharacter(id, data) {    const slots  = getMaxSpellSlots(data.class, data.level, data.subclass)
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

  /**
   * Updates a character only in local state and localStorage — no API call.
   * Used for spell slot pip clicks (used slots are session state, not persisted
   * to the server, which would recalculate and overwrite them).
   */
  patchCharacterLocal(id: number, patch: Partial<Character>) {
    set(s => {
      const characters = s.characters.map(c =>
        c.id === id ? { ...c, ...patch } : c
      )
      storage.setCharacters(characters)
      return { characters }
    })
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

  // Dice roll history handlers
  history: storage.getHistory(),

  async loadHistory() {
    try {
      const { data } = await api.get<DiceRollApiResponse[]>('/dice/history')
      const history: HistoryEntry[] = data.map(r => {
        const sidesMatch = r.formula.match(/d(\d+)/i)
        const sides = sidesMatch ? parseInt(sidesMatch[1], 10) : 0
        return apiRollToEntry(r, sides)
      })
      storage.setHistory(history)
      set({ history })
    } catch {
      // Backend unavailable — keep local cache as fallback
    }
  },

  async rollDice({ formula, label, mode, tableId }) {
    try {
      const url = tableId ? `/tables/${tableId}/rolls` : '/dice/roll'
      const { data } = await api.post<DiceRollApiResponse>(url, {
        formula, mode,
        ...(label ? { label } : {}),
      })
      const sides = parseInt(formula.match(/d(\d+)/i)?.[1] ?? '0', 10)
      const tableName = tableId ? get().tables.find(t => t.id === tableId)?.name : undefined
      const entry = apiRollToEntry({ ...data, tableId: tableId ?? null, tableName: tableName ?? null }, sides)
      set(s => {
        const next = [entry, ...s.history]
        if (next.length > 50) next.length = 50
        storage.setHistory(next)
        return { history: next }
      })
      return entry
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.response?.data?.message ?? 'Não foi possível rolar os dados.'
      get().showToast(msg, 'error')
      return null
    }
  },

  shortcuts: [],

  async loadShortcuts() {
    try {
      const { data } = await api.get<DiceShortcut[]>('/dice/shortcuts')
      if (Array.isArray(data)) set({ shortcuts: data })
    } catch { /* backend indisponível: mantém a lista atual */ }
  },

  async addShortcut(name, formula) {
    try {
      const { data } = await api.post<DiceShortcut>('/dice/shortcuts', { name, formula })
      set(s => ({ shortcuts: [...s.shortcuts, data] }))
      return true
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.response?.data?.message ?? 'Não foi possível salvar o atalho.'
      get().showToast(msg, 'error')
      return false
    }
  },

  async removeShortcut(id) {
    const before = get().shortcuts
    set({ shortcuts: before.filter(x => x.id !== id) })
    try {
      await api.delete(`/dice/shortcuts/${id}`)
    } catch {
      set({ shortcuts: before })
      get().showToast('Não foi possível remover o atalho.', 'error')
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

  // Table (mesa) handlers
  tables:          [],
  isLoadingTables: false,
  tableDetail:     null,

  async loadTables() {
    set({ isLoadingTables: true })
    try {
      const { data } = await api.get<TableSummary[]>('/tables')
      if (Array.isArray(data)) set({ tables: data })
    } catch {
      // Keep whatever is on screen; the list reloads on the next login or visit.
    } finally {
      set({ isLoadingTables: false })
    }
  },

  async createTable(input) {
    try {
      const { data } = await api.post<TableDetail>('/tables', {
        name:        input.name.trim(),
        gameSystem:  input.gameSystem?.trim() || undefined,
        description: input.description?.trim() || undefined,
        maxPlayers:  input.maxPlayers,
      })
      if (input.cover) storage.setTableCover(data.table.id, input.cover)
      set(s => ({ tables: [data.table, ...s.tables.filter(t => t.id !== data.table.id)] }))
      return data
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? err.response?.data?.message ?? 'Não foi possível criar a mesa.'
      get().showToast(msg, 'error')
      throw err
    }
  },

  async openTable(id) {
    set({ tableDetail: null, screen: 'mesa' })
    try {
      const { data } = await api.get<TableDetail>(`/tables/${id}`)
      set({ tableDetail: data })
    } catch {
      get().showToast('Não foi possível abrir a mesa.', 'error')
      set({ screen: 'dashboard' })
    }
  },

  // Toast notification handlers
  toast: null,
  showToast(message, type = '') {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  clearToast() { set({ toast: null }) },
}))

// Restore user session on page load
const saved = storage.getUser()
if (saved?.keepConnected && tokenStorage.getAccess()) {
  useAppStore.setState({ user: { ...saved, isLogged: true }, screen: 'dashboard' })
  useAppStore.getState().loadProfile()
  useAppStore.getState().loadCharacters()
  useAppStore.getState().loadHistory()
  useAppStore.getState().loadTables()
}

// Store selector hooks
export function useSelectedCharacter(): Character | undefined {
  return useAppStore(s => s.characters.find(c => c.id === s.selectedCharacterId))
}

export function dispatchRoll(result: RollResult, formula: string): void {
  useAppStore.getState().addHistory({ type: 'formula', formula, result })
}