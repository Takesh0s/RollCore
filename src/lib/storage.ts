import type { Character, User, HistoryEntry } from '@/types'

/**
 * localStorage helpers — Fase 1 fallback and local-only data.
 *
 * After backend integration, this module is responsible ONLY for:
 *  - User session info (restored on page reload while token is valid)
 *  - Local roll history cache (replaced by GET /dice/history on mount)
 *  - Username registry (replaced by 409 responses from POST /auth/register)
 *
 * Character data is now fetched from and written to the API.
 * The character helpers are kept for the offline / no-token fallback only.
 */

const KEYS = {
  user:      'rpg_user',
  chars:     'rpg_characters',   // local cache — synced from API on login
  history:   'rpg_history',      // local cache — synced from GET /dice/history
  usernames: 'rpg_usernames',    // superseded by backend 409; kept for offline guard
} as const

export const storage = {
  // ── User session ───────────────────────────────────────────────────────────

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

  // ── Character cache ────────────────────────────────────────────────────────

  getCharacters(): Character[] {
    try {
      const raw = localStorage.getItem(KEYS.chars)
      return raw ? (JSON.parse(raw) as Character[]) : []
    } catch { return [] }
  },

  setCharacters(chars: Character[]): void {
    localStorage.setItem(KEYS.chars, JSON.stringify(chars))
  },

  // ── Roll history cache ─────────────────────────────────────────────────────

  getHistory(): HistoryEntry[] {
    try {
      const raw = localStorage.getItem(KEYS.history)
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
    } catch { return [] }
  },

  setHistory(entries: HistoryEntry[]): void {
    localStorage.setItem(KEYS.history, JSON.stringify(entries))
  },

  // ── Username uniqueness guard (offline) ───────────────────────────────────

  getUsernames(): Set<string> {
    try {
      const raw = localStorage.getItem(KEYS.usernames)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set(['testuser'])
    } catch { return new Set(['testuser']) }
  },

  addUsername(username: string): void {
    const set = storage.getUsernames()
    set.add(username.toLowerCase())
    localStorage.setItem(KEYS.usernames, JSON.stringify([...set]))
  },

  removeUsername(username: string): void {
    const set = storage.getUsernames()
    set.delete(username.toLowerCase())
    localStorage.setItem(KEYS.usernames, JSON.stringify([...set]))
  },
}
