import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api'
import { fetchCharacterSpells } from '@/lib/spells'
import { itemRollables, spellRollables, type Rollable } from '@/lib/weapons'
import { validateFormula } from '@/lib/dice'
import type { Character, DiceShortcut, InventoryApiResponse } from '@/types'

type Filter = 'all' | 'weapon' | 'spell' | 'item' | 'mine'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'weapon', label: 'Armas' }, { id: 'spell', label: 'Magias' },
  { id: 'item', label: 'Itens' }, { id: 'mine', label: 'Meus' },
]
const MAX_SHORTCUTS = 12
const fmt = (f: string) => f.replace(/([+-])/g, ' $1 ')
const groupOf = (r: Rollable): Filter => (r.kind === 'weapon' ? 'weapon' : r.kind === 'item' ? 'item' : 'spell')

interface Props {
  characters: Character[]
  shortcuts: DiceShortcut[]
  rolling: boolean
  /** Formula atual do rolador, usada como sugestão no "Novo atalho". */
  currentFormula: string
  onRoll: (formula: string, label: string) => void
  onCreate: (name: string, formula: string) => Promise<boolean>
  onRemove: (id: string) => void
}

/**
 * Atalhos de rolagem num só lugar: o que o personagem já tem no site (armas, magias, itens —
 * sempre com o bônus calculado da ficha) e as fórmulas personalizadas salvas pelo usuário.
 */
export function ShortcutsSection({ characters, shortcuts, rolling, currentFormula, onRoll, onCreate, onRemove }: Props) {
  const [charId, setCharId] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [list, setList] = useState<Rollable[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const char = characters.find(c => c.id === charId) ?? characters[0]

  useEffect(() => {
    if (!char) { setList([]); return }
    let alive = true
    setLoading(true)
    Promise.all([
      api.get<InventoryApiResponse>(`/characters/${char.id}/inventory`).then(r => itemRollables(char, r.data.items)).catch(() => [] as Rollable[]),
      fetchCharacterSpells(char.id).then(s => spellRollables(char, s)).catch(() => [] as Rollable[]),
    ]).then(([items, spells]) => { if (alive) setList([...items, ...spells]) })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [char])

  const sheet = useMemo(() => (filter === 'all' || filter === 'mine' ? (filter === 'mine' ? [] : list) : list.filter(r => groupOf(r) === filter)), [list, filter])
  const mine = filter === 'all' || filter === 'mine' ? shortcuts : []
  const nothing = !loading && sheet.length === 0 && mine.length === 0

  return (
    <section className="dice-shortcuts-section" aria-label="Atalhos">
      <h2 className="section-title">Atalhos</h2>

      {characters.length > 0 && (
        <div className="dice-chips" role="radiogroup" aria-label="Ficha">
          {characters.map(c => (
            <button key={c.id} type="button" role="radio" aria-checked={c.id === char?.id}
                    className={`dice-chip${c.id === char?.id ? ' on' : ''}`} onClick={() => setCharId(c.id)}>{c.name}</button>
          ))}
        </div>
      )}
      <div className="dice-chips dice-filter" role="tablist" aria-label="Filtro">
        {FILTERS.map(f => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id}
                  className={`dice-chip${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>

      <div className="dice-shortcuts">
        {loading && <p className="dice-char-empty">Carregando…</p>}

        {sheet.map(r => (
          <article key={`${r.kind}-${r.id}`} className="dice-shortcut sheet">
            <strong>{r.name}</strong>
            <em>{r.attack ? `Atq ${r.attack.replace('1d20', '')} · ${r.formula}` : fmt(r.formula)}</em>
            <span className="dice-shortcut-tag sheet">● da ficha · {r.detail}</span>
            <div className="dice-shortcut-acts">
              {r.attack && (
                <button type="button" className="dice-shortcut-go" disabled={rolling}
                        onClick={() => onRoll(r.attack!, `${r.name}: ataque (${char!.name})`)}>Atacar ›</button>
              )}
              <button type="button" className="dice-shortcut-go" disabled={rolling}
                      onClick={() => onRoll(r.formula, `${r.name} (${char!.name})`)}>
                {r.kind === 'item' ? 'Usar' : r.attack ? 'Dano' : 'Rolar'} ›
              </button>
            </div>
          </article>
        ))}

        {mine.map(sc => (
          <article key={sc.id} className="dice-shortcut custom">
            <button type="button" className="dice-shortcut-del" aria-label={`Remover atalho ${sc.name}`}
                    onClick={() => onRemove(sc.id)}>×</button>
            <strong>{sc.name}</strong>
            <em>{fmt(sc.formula)}</em>
            <span className="dice-shortcut-tag">◆ personalizado</span>
            <div className="dice-shortcut-acts">
              <button type="button" className="dice-shortcut-go" disabled={rolling}
                      onClick={() => onRoll(sc.formula, sc.name)}>Rolar ›</button>
            </div>
          </article>
        ))}

        {shortcuts.length < MAX_SHORTCUTS && (
          <button type="button" className="dice-shortcut dice-shortcut-add" onClick={() => setCreating(true)}>
            <strong>+ Novo atalho</strong>
            <span className="dice-shortcut-tag">Fórmula exata (ex.: 8d6)</span>
          </button>
        )}
      </div>

      {nothing && !char && <p className="dice-char-empty">Crie uma ficha para ver aqui as armas, magias e itens dela.</p>}
      <p className="dice-shortcuts-note">
        Itens “da ficha” aparecem sozinhos e usam o status atual do personagem. “Personalizado” rola a fórmula que você digitou.
      </p>

      {creating && (
        <NewShortcutModal initialFormula={validateFormula(currentFormula.replace(/\s+/g, '')) ? currentFormula.replace(/\s+/g, '') : ''}
                          onClose={() => setCreating(false)}
                          onSave={async (n, f) => { if (await onCreate(n, f)) { setCreating(false); return true } return false }} />
      )}
    </section>
  )
}

function NewShortcutModal({ initialFormula, onClose, onSave }: {
  initialFormula: string
  onClose: () => void
  onSave: (name: string, formula: string) => Promise<boolean>
}) {
  const [name, setName] = useState('')
  const [formula, setFormula] = useState(initialFormula)
  const [busy, setBusy] = useState(false)
  const clean = formula.replace(/\s+/g, '').toLowerCase()
  const ok = validateFormula(clean)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ok || !name.trim() || busy) return
    setBusy(true); await onSave(name.trim(), clean); setBusy(false)
  }

  return (
    <div className="dice-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="dice-modal" role="dialog" aria-modal="true" aria-labelledby="new-shortcut-title" onSubmit={submit}>
        <div className="dice-modal-head">
          <h3 id="new-shortcut-title">Novo atalho</h3>
          <button type="button" className="dice-modal-x" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <p className="dice-modal-hint">
          Armas, magias e itens que você já criou no site aparecem sozinhos na lista, com o bônus da ficha.
          Aqui você cria um atalho com uma fórmula exata.
        </p>
        <label className="dice-field"><span>Nome</span>
          <input className="form-input" autoFocus maxLength={40} value={name} placeholder="Bola de fogo"
                 onChange={e => setName(e.target.value)} />
        </label>
        <label className="dice-field"><span>Fórmula exata</span>
          <input className={`form-input${formula && !ok ? ' error' : ''}`} value={formula} placeholder="8d6+2"
                 aria-invalid={!!formula && !ok} onChange={e => setFormula(e.target.value)} />
        </label>
        <small className={ok ? 'dice-modal-ok' : 'error-msg'}>
          {ok ? '✓ Fórmula válida' : formula ? 'Use NdX, NdX+M ou NdX-M com d4, d6, d8, d10, d12, d20 ou d100.' : 'Digite a fórmula.'}
        </small>
        <div className="dice-modal-actions">
          <button type="button" className="btn sheet-btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn sheet-btn open" disabled={!ok || !name.trim() || busy}>Salvar atalho</button>
        </div>
      </form>
    </div>
  )
}
