import type { Character, User, HistoryEntry } from '@/types'

/** localStorage key constants — centralised to avoid typos across the app. */
const KEYS = {
  user:    'rpg_user',
  chars:   'rpg_characters',
  history: 'rpg_history',
  usernames: 'rpg_usernames', // set of registered usernames for uniqueness checks
} as const

/**
 * Thin wrapper around localStorage that handles JSON serialisation and
 * parse errors, returning safe defaults instead of throwing.
 *
 * In the production backend these operations will be replaced by API calls
 * to the Spring Boot REST endpoints (UC-01, UC-02, UC-03).
 */
export const storage = {
  getUser(): User | null {
    try {
      const raw = localStorage.getItem(KEYS.user)
      return raw ? (JSON.parse(raw) as User) : null
    } catch { return null }
  },

  setUser(user: User): void {
    localStorage.setItem(KEYS.user, JSON.stringify(user))
  },

  removeUser(): void {
    localStorage.removeItem(KEYS.user)
  },

  getCharacters(): Character[] {
    try {
      const raw = localStorage.getItem(KEYS.chars)
      return raw ? (JSON.parse(raw) as Character[]) : []
    } catch { return [] }
  },

  setCharacters(chars: Character[]): void {
    localStorage.setItem(KEYS.chars, JSON.stringify(chars))
  },

  /** Retrieves persisted dice roll history — UC-03 RN-04. */
  getHistory(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(KEYS.history)
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
    } catch { return [] }
  },

  /** Persists dice roll history — UC-03 RN-04 (últimas 50 rolagens). */
  setHistory(entries: HistoryEntry[]): void {
    localStorage.setItem(KEYS.history, JSON.stringify(entries))
  },

  /** Returns the set of all registered usernames (lowercase) for uniqueness validation. */
  getUsernames(): Set<string> {
    try {
      const raw = localStorage.getItem(KEYS.usernames)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set(['testuser'])
    } catch { return new Set(['testuser']) }
  },

  /** Registers a new username into the persisted set. */
  addUsername(username: string): void {
    const set = storage.getUsernames()
    set.add(username.toLowerCase())
    localStorage.setItem(KEYS.usernames, JSON.stringify([...set]))
  },

  /** Removes a username from the set (used on profile username change). */
  removeUsername(username: string): void {
    const set = storage.getUsernames()
    set.delete(username.toLowerCase())
    localStorage.setItem(KEYS.usernames, JSON.stringify([...set]))
  },
}