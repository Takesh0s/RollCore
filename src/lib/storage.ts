import type { Character, User, HistoryEntry } from '@/types'

/** localStorage key constants — centralised to avoid typos across the app. */
const KEYS = {
  user:    'rpg_user',
  chars:   'rpg_characters',
  history: 'rpg_history',   // UC-03 RN-04 — persists last 50 entries across sessions
} as const

/**
 * Thin wrapper around localStorage that handles JSON serialisation and
 * parse errors, returning safe defaults instead of throwing.
 *
 * In the production backend these operations will be replaced by API calls
 * to the Spring Boot REST endpoints (UC-01, UC-02, UC-03 — table dice_rolls).
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

  /**
   * Retrieves persisted dice roll history — UC-03 RN-04.
   * Mirrors GET /dice/history (WHERE user_id = JWT.sub ORDER BY rolled_at DESC LIMIT 50).
   */
  getHistory(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(KEYS.history)
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
    } catch { return [] }
  },

  /**
   * Persists dice roll history — UC-03 RN-04 (últimas 50 rolagens).
   * Mirrors the dice_rolls table insert (Doc. de Visão §9.2).
   */
  setHistory(entries: HistoryEntry[]): void {
    localStorage.setItem(KEYS.history, JSON.stringify(entries))
  },
}
