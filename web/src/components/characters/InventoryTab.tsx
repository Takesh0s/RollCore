import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import type { Character, Coins, InventoryApiResponse, InventoryItem } from '@/types'

const CATEGORIES: { id: InventoryItem['category']; label: string }[] = [
  { id: 'weapon',     label: 'Arma' },
  { id: 'armor',      label: 'Armadura' },
  { id: 'consumable', label: 'Consumível' },
  { id: 'other',      label: 'Outro' },
]

const COIN_ROWS: { key: keyof Coins; label: string; color: string }[] = [
  { key: 'pp', label: 'Platina', color: '#e8e8ee' },
  { key: 'gp', label: 'Ouro',    color: '#e8b84a' },
  { key: 'sp', label: 'Prata',   color: '#b9b9bd' },
  { key: 'cp', label: 'Cobre',   color: '#cf8a5a' },
]

const MAX_COIN = 999_999
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

interface Draft {
  id?:         string
  name:        string
  category:    InventoryItem['category']
  quantity:    string
  weight:      string
  damage:      string
  description: string
}

const EMPTY: Draft = { name: '', category: 'other', quantity: '1', weight: '0', damage: '', description: '' }

const toDraft = (i: InventoryItem): Draft => ({
  id: i.id, name: i.name, category: i.category, quantity: String(i.quantity),
  weight: String(i.weight), damage: i.damage ?? '', description: i.description ?? '',
})

function apiMessage(err: any, fallback: string): string {
  return err?.response?.data?.detail ?? err?.response?.data?.message ?? fallback
}

interface Props { char: Character; hp: number; maxHp: number }

/** Aba Inventário da ficha (Figma 05.5): itens, moedas e resumo de peso. */
export function InventoryTab({ char, hp, maxHp }: Props) {
  const { showToast } = useAppStore()
  const base = `/characters/${char.id}`

  const [items,    setItems]    = useState<InventoryItem[]>([])
  const [coins,    setCoins]    = useState<Coins>({ pp: 0, gp: 0, sp: 0, cp: 0 })
  const [coinText, setCoinText] = useState<Record<keyof Coins, string>>({ pp: '0', gp: '0', sp: '0', cp: '0' })
  const [loading,  setLoading]  = useState(true)
  const [failed,   setFailed]   = useState(false)
  const [draft,    setDraft]    = useState<Draft | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [removing, setRemoving] = useState<InventoryItem | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setFailed(false)
    api.get<InventoryApiResponse>(`${base}/inventory`)
      .then(({ data }) => {
        if (!alive) return
        setItems(data.items); setCoins(data.coins)
        setCoinText({ pp: String(data.coins.pp), gp: String(data.coins.gp), sp: String(data.coins.sp), cp: String(data.coins.cp) })
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [base])

  const total = items.reduce((sum, i) => sum + i.weight * i.quantity, 0)
  const capacity = Math.round((char.attributes.STR ?? 10) * 6.8)

  // ── Quantidade: otimista, desfaz se o servidor recusar ──
  async function step(item: InventoryItem, delta: number) {
    const quantity = Math.max(0, Math.min(9999, item.quantity + delta))
    if (quantity === item.quantity) return
    setItems(list => list.map(i => i.id === item.id ? { ...i, quantity } : i))
    try {
      await api.put(`${base}/items/${item.id}`, itemBody({ ...item, quantity }))
    } catch (err) {
      setItems(list => list.map(i => i.id === item.id ? item : i))
      showToast(apiMessage(err, 'Não foi possível alterar a quantidade.'), 'error')
    }
  }

  function itemBody(i: Pick<InventoryItem, 'name' | 'category' | 'quantity' | 'weight' | 'damage' | 'description'>) {
    return { name: i.name, category: i.category, quantity: i.quantity, weight: i.weight,
             damage: i.damage ?? '', description: i.description ?? '' }
  }

  async function saveDraft() {
    if (!draft) return
    const quantity = Number(draft.quantity), weight = Number(draft.weight.replace(',', '.'))
    if (!draft.name.trim())                                     return showToast('Informe o nome do item.', 'error')
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 9999) return showToast('Quantidade entre 0 e 9999.', 'error')
    if (!Number.isFinite(weight) || weight < 0 || weight > 99999)       return showToast('Peso inválido.', 'error')
    setSaving(true)
    try {
      const body = { name: draft.name.trim(), category: draft.category, quantity, weight,
                     damage: draft.damage, description: draft.description }
      if (draft.id) {
        const { data } = await api.put<InventoryItem>(`${base}/items/${draft.id}`, body)
        setItems(list => list.map(i => i.id === data.id ? data : i))
      } else {
        const { data } = await api.post<InventoryItem>(`${base}/items`, body)
        setItems(list => [...list, data])
      }
      setDraft(null)
    } catch (err) {
      showToast(apiMessage(err, 'Não foi possível salvar o item.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function confirmRemove() {
    const item = removing
    if (!item) return
    setRemoving(null)
    try {
      await api.delete(`${base}/items/${item.id}`)
      setItems(list => list.filter(i => i.id !== item.id))
      setDraft(d => (d?.id === item.id ? null : d))
    } catch (err) {
      showToast(apiMessage(err, 'Não foi possível remover o item.'), 'error')
    }
  }

  // ── Moedas: salva ao sair do campo ──
  async function commitCoin(key: keyof Coins) {
    const n = Math.max(0, Math.min(MAX_COIN, Math.floor(Number(coinText[key]) || 0)))
    setCoinText(t => ({ ...t, [key]: String(n) }))
    if (n === coins[key]) return
    const next = { ...coins, [key]: n }
    setCoins(next)
    try {
      await api.put(`${base}/coins`, next)
    } catch (err) {
      setCoins(coins); setCoinText(t => ({ ...t, [key]: String(coins[key]) }))
      showToast(apiMessage(err, 'Não foi possível salvar as moedas.'), 'error')
    }
  }

  if (loading) return <p className="inv-status">Carregando inventário…</p>
  if (failed)  return <p className="inv-status">Não foi possível carregar o inventário. Tente novamente mais tarde.</p>

  return (
    <div className="inv-layout">
      <section className="inv-card inv-items">
        <header className="inv-card-head">
          <h2 className="inv-card-title">Itens</h2>
          <button type="button" className="btn btn-roll inv-add" onClick={() => setDraft({ ...EMPTY })}>
            + Adicionar item
          </button>
        </header>

        <div className="inv-cols" aria-hidden="true">
          <span>Nome</span><span>Quant.</span><span>Dano \ CA</span><span />
        </div>

        {items.length === 0 && <p className="inv-empty">Nenhum item ainda. Adicione o primeiro.</p>}

        <ul className="inv-list">
          {items.map(item => (
            <li key={item.id} className="inv-row">
              <button type="button" className="inv-name" onClick={() => setDraft(toDraft(item))}
                      title="Editar item">{item.name}</button>
              <div className="inv-qty">
                <button type="button" className="inv-step" aria-label={`Diminuir ${item.name}`}
                        onClick={() => step(item, -1)} disabled={item.quantity <= 0}>−</button>
                <strong>{item.quantity}</strong>
                <button type="button" className="inv-step" aria-label={`Aumentar ${item.name}`}
                        onClick={() => step(item, 1)}>+</button>
              </div>
              <span className="inv-dmg">{item.damage || '—'}</span>
              <button type="button" className="inv-del" aria-label={`Remover ${item.name}`}
                      onClick={() => setRemoving(item)}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="inv-side">
        <section className="inv-card">
          <h2 className="inv-card-title center">Moedas</h2>
          <ul className="inv-coins">
            {COIN_ROWS.map(c => (
              <li key={c.key}>
                <span className="inv-coin-dot" style={{ background: c.color }} aria-hidden="true" />
                <label htmlFor={`coin-${c.key}`}>{c.label}</label>
                <input id={`coin-${c.key}`} className="inv-coin-input" inputMode="numeric"
                       value={coinText[c.key]}
                       onChange={e => setCoinText(t => ({ ...t, [c.key]: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                       onBlur={() => commitCoin(c.key)}
                       onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
              </li>
            ))}
          </ul>
        </section>

        <section className="inv-card">
          <h2 className="inv-card-title center">Resumo</h2>
          <dl className="inv-summary">
            <div><dt>Pontos de vida</dt><dd>{hp} / {maxHp}</dd></div>
            <div><dt>Classe de armadura</dt><dd>{char.ac}</dd></div>
            <div><dt>Peso carregado</dt><dd className={total > capacity ? 'over' : ''}>{num(total)} / {capacity} kg</dd></div>
          </dl>
        </section>
      </aside>

      {draft && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !saving) setDraft(null) }}>
          <form className="modal inv-modal" onSubmit={e => { e.preventDefault(); saveDraft() }}>
            <p className="modal-title">{draft.id ? 'Editar item' : 'Novo item'}</p>

            <label className="inv-field"><span>Nome</span>
              <input className="form-input" autoFocus maxLength={80} value={draft.name}
                     onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>

            <label className="inv-field"><span>Categoria</span>
              <select className="form-input" value={draft.category}
                      onChange={e => setDraft({ ...draft, category: e.target.value as Draft['category'] })}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select></label>

            <div className="inv-field-row">
              <label className="inv-field"><span>Quantidade</span>
                <input className="form-input" type="number" min={0} max={9999} value={draft.quantity}
                       onChange={e => setDraft({ ...draft, quantity: e.target.value })} /></label>
              <label className="inv-field"><span>Peso por unidade (kg)</span>
                <input className="form-input" inputMode="decimal" value={draft.weight}
                       onChange={e => setDraft({ ...draft, weight: e.target.value })} /></label>
            </div>

            <label className="inv-field"><span>Dano ou CA</span>
              <input className="form-input" maxLength={40} placeholder="1D8 Cort. · 11 + Dex CA" value={draft.damage}
                     onChange={e => setDraft({ ...draft, damage: e.target.value })} /></label>

            <label className="inv-field"><span>Descrição</span>
              <textarea className="form-input" rows={3} maxLength={500} placeholder="Notas, efeitos, dano…"
                        value={draft.description}
                        onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>

            <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-roll btn-auto" disabled={saving}>Salvar item</button>
              {draft.id && (
                <button type="button" className="btn btn-danger btn-auto" style={{ marginTop: 0 }}
                        onClick={() => setRemoving(items.find(i => i.id === draft.id) ?? null)}>Excluir item</button>
              )}
              <button type="button" className="btn btn-outline btn-auto" disabled={saving}
                      onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <Modal open={!!removing} danger title="Remover item"
             message={removing ? `Remover "${removing.name}" do inventário?` : ''}
             confirmLabel="Remover" onConfirm={confirmRemove} onCancel={() => setRemoving(null)} />
    </div>
  )
}
