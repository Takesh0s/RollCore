import type { Character, User } from '@/types'

/** localStorage key constants — centralised to avoid typos across the app. */
const KEYS = {
  user:  'rpg_user',
  chars: 'rpg_characters',
} as const

/**
 * Thin wrapper around localStorage that handles JSON serialisation and
 * parse errors, returning safe defaults instead of throwing.
 *
 * In the production backend these operations will be replaced by API calls
 * to the Spring Boot REST endpoints (UC-01, UC-02).
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
}
