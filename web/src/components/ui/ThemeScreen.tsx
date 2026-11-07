import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { THEMES, type ThemeMode } from '@/theme/themes'
import { setThemePrefs, useThemePrefs, useResolvedMode, type ModePref } from '@/theme/applyTheme'

const MODES: { id: ModePref; label: string; hint: string }[] = [
  { id: 'dark',   label: 'Escuro',  hint: 'Fundo escuro' },
  { id: 'light',  label: 'Claro',   hint: 'Fundo claro' },
  { id: 'system', label: 'Sistema', hint: 'Segue o dispositivo' },
]

/**
 * Configurações > Tema e paleta (Figma 03.2 / 17.1): escolhe o tema entre os seis
 * e o modo claro/escuro. A escolha vale na hora e fica salva neste navegador.
 */
export function ThemeScreen() {
  const navigate = useAppStore(s => s.navigate)
  const prefs = useThemePrefs()
  // A prévia das amostras acompanha o modo aplicado: no "Sistema", o do dispositivo (claro ou escuro).
  const previewMode: ThemeMode = useResolvedMode()

  return (
    <div className="device">
      <AppHeader title="Tema e paleta" onBack={() => navigate('dashboard')} />

      <div className="page-body wide theme-screen">
        <h2 className="theme-section-title">Modo de exibição</h2>
        <div className="theme-modes" role="radiogroup" aria-label="Modo de exibição">
          {MODES.map(m => (
            <button
              key={m.id}
              role="radio"
              aria-checked={prefs.mode === m.id}
              className={`theme-mode${prefs.mode === m.id ? ' active' : ''}`}
              onClick={() => setThemePrefs({ mode: m.id })}
            >
              <strong>{m.label}</strong>
              <span>{m.hint}</span>
            </button>
          ))}
        </div>

        <h2 className="theme-section-title">Tema do app</h2>
        <div className="theme-grid" role="radiogroup" aria-label="Tema do app">
          {THEMES.map(t => {
            const active = prefs.theme === t.id
            const p = t[previewMode]
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={active}
                className={`theme-card${active ? ' active' : ''}`}
                onClick={() => setThemePrefs({ theme: t.id })}
              >
                <span className="theme-swatches" aria-hidden="true">
                  {[p.body, p.accent, p.green].map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <strong style={{ fontFamily: t.fontDisplay }}>{t.label}</strong>
                <span className="theme-status">{active ? 'Em uso' : 'Usar este tema'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
