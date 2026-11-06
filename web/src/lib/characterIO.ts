import { ATTR_KEYS } from '@/lib/engine'
import { DEFAULT_SYSTEM } from '@/lib/systems'
import type { Attributes, Character } from '@/types'

/** What an exported/imported sheet carries. The avatar is left out on purpose (it can be large). */
export type CharacterData = Omit<Character, 'id' | 'avatar_url' | 'spell_slots' | 'warlock_slots'>

const FORMAT = 'rollcore.character'
const VERSION = 1
export const MAX_IMPORT_BYTES = 100 * 1024

type Result = { ok: true; data: CharacterData } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max ? v.trim() : null
const int = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null

/** Builds the JSON string for a sheet. */
export function serializeCharacter(c: Character): string {
  const data: CharacterData = {
    name: c.name, game_system: c.game_system ?? DEFAULT_SYSTEM,
    class: c.class, subclass: c.subclass ?? '', race: c.race, level: c.level,
    attributes: c.attributes, hp: c.hp, max_hp: c.max_hp, temp_hp: c.temp_hp ?? 0, ac: c.ac,
  }
  return JSON.stringify({ format: FORMAT, version: VERSION, character: data }, null, 2)
}

/** Triggers a browser download of the sheet as `<name>.rollcore.json`. */
export function downloadCharacter(c: Character): void {
  const blob = new Blob([serializeCharacter(c)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'ficha'}.rollcore.json`
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Validates the content of an imported file. Nothing is trusted: every field is
 * checked and rebuilt from scratch, so unknown keys in the file are dropped.
 */
export function parseCharacterFile(raw: string): Result {
  let json: unknown
  try { json = JSON.parse(raw) } catch { return { ok: false, error: 'O arquivo não é um JSON válido.' } }

  if (!isObj(json) || json.format !== FORMAT) return { ok: false, error: 'Este arquivo não é uma ficha do RollCore.' }
  if (json.version !== VERSION) return { ok: false, error: 'Versão do arquivo não suportada.' }
  const c = json.character
  if (!isObj(c)) return { ok: false, error: 'Ficha ausente no arquivo.' }

  const name  = text(c.name, 100)
  const cls   = text(c.class, 50)
  const race  = text(c.race, 50)
  const level = int(c.level, 1, 20)
  if (!name)           return { ok: false, error: 'Nome inválido na ficha.' }
  if (!cls)            return { ok: false, error: 'Classe inválida na ficha.' }
  if (!race)           return { ok: false, error: 'Raça inválida na ficha.' }
  if (level === null)  return { ok: false, error: 'Nível deve ser entre 1 e 20.' }

  if (!isObj(c.attributes)) return { ok: false, error: 'Atributos ausentes na ficha.' }
  const attributes = {} as Attributes
  for (const k of ATTR_KEYS) {
    const v = int((c.attributes as Record<string, unknown>)[k], 1, 30)
    if (v === null) return { ok: false, error: `Atributo ${k} inválido (1–30).` }
    attributes[k] = v
  }

  const maxHp = int(c.max_hp, 1, 9999)
  const hp    = int(c.hp, 0, 9999)
  const tempHp = c.temp_hp === undefined ? 0 : int(c.temp_hp, 0, 9999)
  const ac    = int(c.ac, 1, 99)
  if (maxHp === null || hp === null || tempHp === null || ac === null) return { ok: false, error: 'HP ou CA inválidos na ficha.' }

  const system = c.game_system === undefined ? DEFAULT_SYSTEM : text(c.game_system, 50)
  if (!system) return { ok: false, error: 'Sistema inválido na ficha.' }
  const subclass = c.subclass === undefined || c.subclass === '' ? '' : text(c.subclass, 100)
  if (subclass === null) return { ok: false, error: 'Subclasse inválida na ficha.' }

  return { ok: true, data: {
    name, game_system: system, class: cls, subclass, race, level, attributes,
    hp: Math.min(hp, maxHp), max_hp: maxHp, temp_hp: tempHp, ac,
  } }
}
