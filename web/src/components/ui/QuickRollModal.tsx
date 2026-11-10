import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Shell } from '@/components/tables/TableModals'
import { VALID_SIDES } from '@/lib/dice'
import type { HistoryEntry } from '@/types'

/** Rolagem rápida (Figma 25.10): escolhe o dado, soma um modificador e rola sem sair da tela atual. */
export function QuickRollModal({ onClose }: { onClose: () => void }) {
  const { rollDice, navigate } = useAppStore()
  const [sides, setSides] = useState<number>(20)
  const [mod, setMod] = useState('0')
  const [last, setLast] = useState<HistoryEntry | null>(null)
  const [busy, setBusy] = useState(false)

  const modifier = Number.parseInt(mod, 10) || 0

  async function roll() {
    setBusy(true)
    const formula = `1d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`
    const entry = await rollDice({ formula })
    if (entry) setLast(entry)
    setBusy(false)
  }

  const r = last?.result
  return (
    <Shell title="Rolar dados" onClose={onClose}>
      <div className="qr-dice" role="group" aria-label="Tipo de dado">
        {VALID_SIDES.map(s => (
          <button key={s} type="button" aria-pressed={sides === s} className={`qr-die${sides === s ? ' on' : ''}`}
                  onClick={() => setSides(s)}>d{s}</button>
        ))}
      </div>
      <label className="tm-label" htmlFor="qr-mod">Modificador</label>
      <input id="qr-mod" className="form-input" type="number" inputMode="numeric" value={mod}
             onChange={e => setMod(e.target.value)} />
      {r && (
        <div className="qr-result" aria-live="polite">
          <strong>{r.total}</strong>
          <span>d{sides} ({r.rolls.join(', ')}){r.mod ? ` ${r.mod > 0 ? '+' : '−'} ${Math.abs(r.mod)}` : ''}</span>
        </div>
      )}
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={() => { onClose(); navigate('dados') }}>Histórico</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={roll}>{r ? 'Rolar de novo' : 'Rolar'}</button>
      </div>
    </Shell>
  )
}
