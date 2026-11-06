import { useSyncExternalStore } from 'react'
import { DEFAULT_THEME, getTheme, type ThemeId, type ThemeMode, type Palette } from './themes'

/** `system` segue a preferência do sistema operacional. */
export type ModePref = ThemeMode | 'system'

export interface ThemePrefs {
  theme: ThemeId
  mode:  ModePref
}

const KEY = 'rollcore_theme'
const DEFAULTS: ThemePrefs = { theme: DEFAULT_THEME, mode: 'dark' }

/** Soma de variáveis CSS que o tema controla; usada para limpar ao voltar ao padrão. */
const VARS = [
  '--canvas', '--bg', '--card', '--card-raised', '--card-high', '--card-hover', '--card-border', '--border',
  '--field', '--input-bg', '--field-text', '--text', '--text-bright', '--text-muted', '--text-faint',
  '--primary', '--primary-dark', '--mint', '--gold', '--gold-dim', '--emerald', '--gold-glow', '--gold-subtle',
  '--border-gold', '--border-glow', '--success', '--fail', '--crimson', '--crit', '--danger', '--blood',
  '--btn-dark', '--btn-text', '--font-display',
]

function read(): ThemePrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<ThemePrefs>
    const theme = getTheme((p.theme ?? DEFAULT_THEME) as ThemeId).id
    const mode: ModePref = p.mode === 'light' || p.mode === 'system' ? p.mode : 'dark'
    return { theme, mode }
  } catch {
    return DEFAULTS
  }
}

function resolveMode(pref: ModePref): ThemeMode {
  if (pref !== 'system') return pref
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function cssVars(p: Palette, fontDisplay: string): Record<string, string> {
  return {
    '--canvas': p.canvas, '--bg': p.canvas,
    '--card': p.body, '--card-raised': p.card, '--card-high': p.card2, '--card-hover': p.card2,
    '--card-border': p.line, '--border': p.line,
    '--field': p.field, '--input-bg': p.field, '--field-text': p.fieldText,
    '--text': p.text, '--text-bright': p.text2, '--text-muted': p.text, '--text-faint': p.dim,
    '--primary': p.accentTx, '--mint': p.accentTx, '--gold': p.accentTx, '--emerald': p.accentTx,
    '--primary-dark': p.accent, '--gold-dim': p.accent,
    '--gold-glow':   `color-mix(in srgb, ${p.accent} 25%, transparent)`,
    '--gold-subtle': `color-mix(in srgb, ${p.accent} 12%, transparent)`,
    '--border-gold': `color-mix(in srgb, ${p.accent} 55%, transparent)`,
    '--border-glow': `color-mix(in srgb, ${p.accent} 80%, transparent)`,
    '--success': p.green, '--fail': p.red, '--crimson': p.red, '--crit': p.warn,
    '--danger': p.danger, '--blood': p.danger,
    '--btn-dark': p.btn, '--btn-text': p.btnText,
    '--font-display': fontDisplay,
  }
}

/** Aplica o tema no <html>: variáveis CSS + atributos para regras específicas (ex.: sangue do Terror). */
export function applyTheme(prefs: ThemePrefs): void {
  const root = document.documentElement
  const def  = getTheme(prefs.theme)
  const mode = resolveMode(prefs.mode)
  root.dataset.theme = def.id
  root.dataset.mode  = mode
  root.style.colorScheme = mode

  // O Medieval escuro é o padrão do index.css: remove sobrescritas em vez de repeti-las.
  if (def.id === 'medieval' && mode === 'dark') {
    VARS.forEach(v => root.style.removeProperty(v))
    return
  }
  const vars = cssVars(def[mode], def.fontDisplay)
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

// ── Store mínimo (sem dependência de zustand) ────────────────────────────────

let current: ThemePrefs = DEFAULTS
const listeners = new Set<() => void>()

export function getThemePrefs(): ThemePrefs { return current }

export function setThemePrefs(next: Partial<ThemePrefs>): void {
  current = { ...current, ...next }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* modo privado: segue sem salvar */ }
  applyTheme(current)
  listeners.forEach(l => l())
}

/** Chamar uma vez antes de renderizar o app. */
export function initTheme(): void {
  current = read()
  applyTheme(current)
  // Com "Sistema", acompanha a troca de claro/escuro do sistema em tempo real.
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (current.mode === 'system') applyTheme(current)
  })
}

export function useThemePrefs(): ThemePrefs {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb) } },
    getThemePrefs,
  )
}
