import { CLASSES, RACES, SUBCLASSES } from '@/lib/engine'

/**
 * Game systems a character sheet can belong to.
 *
 * Each system decides which classes, races and subclasses the sheet form offers.
 * Only D&D 5e has rules data today; the others are listed so they show up in the
 * selector ("em breve") and can be filled in later without touching the form.
 * "Personalizado" exposes everything known to every system and also accepts
 * free text, for homebrew classes, races and subclasses.
 */
export interface GameSystem {
  id:        string
  /** false = shown disabled in the selector until its data exists */
  available: boolean
  /** Free-text allowed and no level gating — everything of every system is offered */
  custom?:   boolean
  classes:   string[]
  races:     string[]
  /** class → subclass options and the level they are chosen */
  subclasses: Record<string, { options: string[]; choiceLevel: number }>
}

export const DEFAULT_SYSTEM = 'D&D 5e'
export const CUSTOM_SYSTEM  = 'Personalizado'

const DND: GameSystem = {
  id: DEFAULT_SYSTEM, available: true,
  classes: CLASSES, races: RACES, subclasses: SUBCLASSES,
}

const SOON = (id: string): GameSystem => ({ id, available: false, classes: [], races: [], subclasses: {} })

const uniq = (xs: string[]) => Array.from(new Set(xs))

/** Everything known by every available system, merged. */
function mergeAll(systems: GameSystem[]): GameSystem {
  const subclasses: GameSystem['subclasses'] = {}
  systems.forEach(s => Object.entries(s.subclasses).forEach(([cls, info]) => {
    const prev = subclasses[cls]
    subclasses[cls] = { choiceLevel: prev ? Math.min(prev.choiceLevel, info.choiceLevel) : info.choiceLevel,
                        options: uniq([...(prev?.options ?? []), ...info.options]) }
  }))
  return {
    id: CUSTOM_SYSTEM, available: true, custom: true,
    classes: uniq(systems.flatMap(s => s.classes)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    races:   uniq(systems.flatMap(s => s.races)).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    subclasses,
  }
}

const REAL = [DND]

export const SYSTEMS: GameSystem[] = [
  DND,
  SOON('Tormenta20'),
  SOON('Pathfinder 2e'),
  SOON('Call of Cthulhu'),
  mergeAll(REAL),
]

export function getSystem(id: string | undefined): GameSystem {
  return SYSTEMS.find(s => s.id === id) ?? DND
}

/** Every subclass option of every system, for the "Personalizado" suggestions. */
export function allSubclassOptions(): string[] {
  return uniq(Object.values(getSystem(CUSTOM_SYSTEM).subclasses).flatMap(i => i.options))
}
