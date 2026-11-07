import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ShortcutsSection } from './ShortcutsSection'
import { DiceStage } from './DiceStage'
import { AppHeader } from '@/components/ui/AppHeader'
import { VALID_SIDES, FORMULA_REGEX, validateFormula } from '@/lib/dice'
import type { DiceMode, HistoryEntry } from '@/types'

const MODES: { id: DiceMode; label: string }[] = [
  { id: 'normal',       label: 'Normal' },
  { id: 'advantage',    label: 'Vantagem' },
  { id: 'disadvantage', label: 'Desvantagem' },
]

const HISTORY_PREVIEW = 8

/** "1d20 + 5" → "1d20+5" (o servidor só aceita a fórmula sem espaços). */
const normalize = (f: string) => f.replace(/\s+/g, '').toLowerCase()

/** "1d20+5" → "1d20" */
const baseOf = (f?: string) => (f ?? '').replace(/[+-]\d+$/, '')

function critOf(e: HistoryEntry): 'crit' | 'fail' | null {
  const r = e.result
  if (r.sides !== 20 || r.rolls.length !== 1) return null
  return r.rolls[0] === 20 ? 'crit' : r.rolls[0] === 1 ? 'fail' : null
}

/** "hoje 00:40" para hoje; "30/04 23:33" para os outros dias. */
function whenOf(ts: number): string {
  const d = new Date(ts), now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return d.toDateString() === now.toDateString() ? `hoje ${hm}` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm}`
}

/** "15 + 5", "9 − 2" ou "[1, 6, 6]" para vários dados sem bônus. */
function breakdownOf(e: HistoryEntry): string {
  const { rolls, mod } = e.result
  let t = rolls.join(' + ')
  if (mod > 0) t += ` + ${mod}`
  if (mod < 0) t += ` − ${Math.abs(mod)}`
  return t
}

/** Tela de Dados (Figma 05.4b, computador e celular): dados, atalhos, rolador, última rolagem e histórico. */
export function DiceBody() {
  const { characters, history, tables, shortcuts, rollDice, addShortcut, removeShortcut, loadShortcuts, loadHistory, showToast } = useAppStore()

  // A sessão restaurada do localStorage não passa pelo login: busca atalhos e histórico ao abrir.
  useEffect(() => { loadShortcuts(); loadHistory() }, [loadShortcuts, loadHistory])

  const [formula,  setFormula]  = useState('1d20')
  const [mode,     setMode]     = useState<DiceMode>('normal')
  const [tableId,  setTableId]  = useState<string>('')
  const [rolling,  setRolling]  = useState(false)
  const [filter,   setFilter]   = useState<string>('')          // '' = todas
  const [showAll,  setShowAll]  = useState(false)

  const clean   = normalize(formula)
  const valid   = validateFormula(clean)
  const sides   = valid ? Number(clean.match(FORMULA_REGEX)![2]) : null
  const last    = history[0]

  const tableNames = useMemo(
    () => Array.from(new Set(history.map(h => h.tableName).filter((n): n is string => !!n))).slice(0, 4),
    [history],
  )
  const shown = history.filter(h => !filter || h.tableName === filter)
  const visible = showAll ? shown : shown.slice(0, HISTORY_PREVIEW)

  /** Troca o tipo de dado mantendo quantidade e bônus: 2d6+3 → 2d20+3. */
  function pickSides(s: number) {
    const m = valid ? clean.match(FORMULA_REGEX)! : null
    setFormula(`${m ? m[1] : 1}d${s}${m?.[3] ?? ''}`)
  }

  async function roll(f: string, label?: string) {
    if (rolling) return
    setRolling(true)
    await rollDice({ formula: normalize(f), label, mode, tableId: tableId || undefined })
    setRolling(false)
  }

  async function createShortcut(name: string, f: string) {
    const ok = await addShortcut(name, f)
    if (ok) showToast('Atalho salvo!', 'success')
    return ok
  }

  const lastCrit = last ? critOf(last) : null

  return (
    <div className="device">
      <AppHeader title="Dados" />

      <div className="page-body dice-page">
        <div className="dice-main">
          <h2 className="section-title">Dados</h2>

          <div className="dice-tiles" role="group" aria-label="Tipo de dado">
            {VALID_SIDES.map(s => (
              <button key={s} type="button" className={`dice-tile${sides === s ? ' on' : ''}`}
                      onClick={() => pickSides(s)} aria-pressed={sides === s}>
                <strong>d{s}</strong>
              </button>
            ))}
          </div>

          <ShortcutsSection characters={characters} shortcuts={shortcuts} rolling={rolling}
                            currentFormula={formula}
                            onRoll={(f, label) => { setFormula(f); roll(f, label) }}
                            onCreate={createShortcut} onRemove={removeShortcut} />

          <div className="dice-panel">
            <div className="dice-panel-top">
              <label className="dice-field">
                <span>Fórmula</span>
                <input className={`form-input${formula && !valid ? ' error' : ''}`} value={formula}
                       placeholder="1d20 + 5" aria-invalid={!!formula && !valid}
                       onChange={e => setFormula(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter' && valid) roll(formula) }} />
              </label>
              <div className="dice-field">
                <span>Modo</span>
                <div className="dice-chips" role="radiogroup" aria-label="Modo">
                  {MODES.map(m => (
                    <button key={m.id} type="button" role="radio" aria-checked={mode === m.id}
                            className={`dice-chip${mode === m.id ? ' on' : ''}`} onClick={() => setMode(m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="dice-panel-bottom">
              <div className="dice-field">
                <span>Mesa</span>
                <div className="dice-chips" role="radiogroup" aria-label="Mesa">
                  <button type="button" role="radio" aria-checked={!tableId}
                          className={`dice-chip${!tableId ? ' on' : ''}`} onClick={() => setTableId('')}>Sem mesa</button>
                  {tables.map(t => (
                    <button key={t.id} type="button" role="radio" aria-checked={tableId === t.id}
                            className={`dice-chip${tableId === t.id ? ' on' : ''}`} onClick={() => setTableId(t.id)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="btn btn-roll dice-roll-btn" disabled={!valid || rolling}
                      onClick={() => roll(formula)}>
                Rolar dados
              </button>
            </div>
            {formula && !valid && (
              <small className="error-msg">Fórmula inválida. Use NdX, NdX+M ou NdX-M (ex: 2d6+3).</small>
            )}
          </div>

          <section className="dice-last" aria-live="polite">
            <p className="dice-last-title">
              Última rolagem{last?.tableName ? ` · ${last.tableName}` : ''}
            </p>
            <DiceStage sides={sides ?? 20} rolling={rolling}
                       result={last ? { id: last.timestamp, sides: last.result.sides, rolls: last.result.rolls, total: last.result.total, tone: lastCrit ?? '' } : null} />
            {last && lastCrit && (
              <span className={`badge ${lastCrit === 'crit' ? 'badge-crit' : 'badge-fail'}`}>
                {lastCrit === 'crit' ? 'CRÍTICO' : 'FALHA'}
              </span>
            )}
            <p className="dice-last-detail">
              {last ? (
                <>
                  {baseOf(last.formula)} → {breakdownOf(last)}
                  {last.discarded && last.discarded.length > 0 && ` (descartado: ${last.discarded.join(' + ')})`}
                  {last.label && ` · ${last.label}`}
                </>
              ) : 'Nenhuma rolagem ainda.'}
            </p>
          </section>
        </div>

        <aside className="dice-side">
          <h2 className="section-title">Histórico</h2>
          <div className="dice-chips" role="radiogroup" aria-label="Filtrar histórico">
            <button type="button" role="radio" aria-checked={!filter}
                    className={`dice-chip${!filter ? ' on' : ''}`} onClick={() => setFilter('')}>Todas</button>
            {tableNames.map(n => (
              <button key={n} type="button" role="radio" aria-checked={filter === n}
                      className={`dice-chip${filter === n ? ' on' : ''}`} onClick={() => setFilter(n)}>{n}</button>
            ))}
          </div>

          <div className="dice-history">
            {visible.length === 0 && <p className="dice-history-empty">Nenhuma rolagem ainda.</p>}
            {visible.map((h, i) => {
              const c = critOf(h)
              const multi = h.result.rolls.length > 1 && h.result.mod === 0
              const meta = [h.label, h.tableName].filter(Boolean).join(' · ')
              return (
                <article key={`${h.timestamp}-${i}`} className={`dice-hist${c ? ` ${c}` : ''}`}>
                  <div>
                    <p className="dice-hist-formula">
                      {baseOf(h.formula)}{h.result.mod ? (h.result.mod > 0 ? `+${h.result.mod}` : h.result.mod) : ''} → {multi ? `[${h.result.rolls.join(', ')}]` : h.result.total}
                    </p>
                    <p className="dice-hist-meta">{whenOf(h.timestamp)}{meta && ` · ${meta}`}</p>
                  </div>
                  {c && <span className={`badge ${c === 'crit' ? 'badge-crit' : 'badge-fail'}`}>{c === 'crit' ? 'CRÍTICO' : 'FALHA'}</span>}
                  <strong className="dice-hist-total">{h.result.total}</strong>
                </article>
              )
            })}
          </div>

          {shown.length > HISTORY_PREVIEW && (
            <button type="button" className="btn dice-hist-more" onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Mostrar menos' : 'Ver histórico completo'}
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
