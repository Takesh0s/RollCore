import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  VALID_SIDES, validateFormula, rollFormulaString, quickRoll,
  buildBreakdown, formatTimestamp,
} from '@/lib/dice'
import type { RollResult } from '@/types'

type DiceState = 'neutral' | 'crit' | 'fail'

export function DiceRollerScreen() {
  const { navigate, history, addHistory, showToast } = useAppStore()

  const [formula,    setFormula]    = useState('')
  const [formulaErr, setFormulaErr] = useState('')
  const [formulaOk,  setFormulaOk]  = useState(false)

  const [result,    setResult]    = useState<RollResult | null>(null)
  const [diceState, setDiceState] = useState<DiceState>('neutral')
  // Incrementing this key forces React to re-mount the result element,
  // restarting the CSS roll animation on every new roll.
  const [animKey,   setAnimKey]   = useState(0)

  const resultRef = useRef<HTMLDivElement>(null)

  // Real-time formula validation with MSG006 — UC-03 E01
  const handleFormulaChange = useCallback((val: string) => {
    setFormula(val)
    if (!val) {
      setFormulaErr(''); setFormulaOk(false); return
    }
    if (!validateFormula(val)) {
      setFormulaErr('Fórmula inválida. Use o formato NdX, NdX+M ou NdX-M (ex: 2d6+3).') // MSG006
      setFormulaOk(false)
    } else {
      setFormulaErr(''); setFormulaOk(true)
    }
  }, [])

  /**
   * Applies a roll result to the UI:
   * - detects critical hit (d20=20) and critical fail (d20=1) — UC-03 A01
   * - increments animKey to retrigger the roll animation
   * - stores the entry in history
   */
  function applyResult(r: RollResult, label: string) {
    const state: DiceState =
      r.sides === 20 && r.rolls[0] === 20 ? 'crit' :
      r.sides === 20 && r.rolls[0] === 1  ? 'fail' : 'neutral'

    setResult(r)
    setDiceState(state)
    setAnimKey(k => k + 1)
    addHistory({ type: 'formula', formula: label, result: r })
  }

  function handleRoll() {
    if (!validateFormula(formula)) return
    const r = rollFormulaString(formula)
    applyResult(r, formula)
    showToast('Rolagem realizada!')
    setFormula(''); setFormulaOk(false); setFormulaErr('')
  }

  // Quick-roll a single die without typing a formula — UC-03 S01
  function handleQuickRoll(sides: number) {
    const r = { ...quickRoll(sides), formula: `1d${sides}` }
    applyResult(r, `1d${sides}`)
    showToast(`Rolado d${sides}!`)
  }

  const breakdown = result ? buildBreakdown(result) : ''

  return (
    <div className="device">
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('dashboard')}>←</button>
        <div className="topbar-info">
          <div className="top-title">Rolagem de Dados</div>
        </div>
      </div>

      <div className="page-body">

        {/* ── Formula input ── */}
        <h2 className="section-title">Fórmula</h2>
        <div className="formula-row">
          <input
            className={`form-input${formulaErr ? ' error' : formulaOk ? ' valid' : ''}`}
            placeholder="Ex: 2d6+3, 1d20-1"
            value={formula}
            onChange={e => handleFormulaChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && formulaOk) handleRoll() }}
          />
          {/* Roll button stays disabled while the formula is invalid — UC-03 E01 */}
          <button
            className="btn btn-roll"
            onClick={handleRoll}
            disabled={!formulaOk}
          >
            Rolar
          </button>
        </div>
        {formulaErr && <small className="error-msg">{formulaErr}</small>}

        {/* ── Result area ── */}
        <div className="dice-area">
          {result ? (
            <>
              <div
                key={animKey}
                ref={resultRef}
                className={`dice-result-num ${diceState} roll-anim`}
              >
                {result.total}
              </div>
              {breakdown && (
                <div className="dice-breakdown">{breakdown}</div>
              )}
              {/* Golden highlight + label on critical hit — UC-03 A01 / RAP002 */}
              {diceState === 'crit' && (
                <div className="crit-badge">Crítico!</div>
              )}
            </>
          ) : (
            <div className="dice-result-num neutral" style={{ opacity: 0.3 }}>—</div>
          )}
        </div>

        {/* ── Quick-roll shortcuts d4–d100 — UC-03 S01 ── */}
        <div className="dice-buttons">
          {VALID_SIDES.map(s => (
            <button
              key={s}
              className="dice-btn"
              onClick={() => handleQuickRoll(s)}
            >
              d{s}
            </button>
          ))}
        </div>

        {/* ── Roll history — UC-03 S02 ── */}
        <h2 className="section-title">
          Histórico{' '}
          <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>
            (últimas 50)
          </span>
        </h2>

        <div className="history-list">
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0' }}>
              Nenhuma rolagem ainda.
            </div>
          ) : (
            history.map((entry, i) => {
              const r      = entry.result
              const isCrit = r.sides === 20 && r.rolls[0] === 20
              const isFail = r.sides === 20 && r.rolls[0] === 1

              let bd = `[${r.rolls.join(', ')}]`
              if (r.mod > 0) bd += ` +${r.mod}`
              if (r.mod < 0) bd += ` ${r.mod}`

              const label = entry.formula ?? entry.skill ?? `d${entry.sides}`

              return (
                <div
                  key={i}
                  className={`history-entry${isCrit ? ' crit' : isFail ? ' fail' : ''}`}
                >
                  <div className="h-left">
                    <span className="h-formula">{label} → {bd}</span>
                    {/* Timestamp displayed per UC-03 S02 step 18 */}
                    <span className="h-time">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <div className="h-right">
                    {isCrit && <span className="badge badge-crit">CRÍTICO</span>}
                    {isFail && <span className="badge badge-fail">FALHA</span>}
                    <span className="h-total">{r.total}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
