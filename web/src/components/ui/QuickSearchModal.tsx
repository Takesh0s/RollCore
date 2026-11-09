import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '@/store/useAppStore'
import { IconSearch, IconSheets, IconPlus, IconCalendar, IconBell, IconScroll } from './icons'
import { StateView } from './StateView'

interface Hit { id: string; icon: ReactNode; title: string; sub: string; run: () => void }

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Busca rápida (Figma 25.11, Ctrl K): mesas, fichas e comandos num só lugar. */
export function QuickSearchModal({ onClose, onRoll }: { onClose: () => void; onRoll: () => void }) {
  const { tables, characters, navigate, openTable, selectCharacter } = useAppStore()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])

  const hits = useMemo<Hit[]>(() => {
    const go = (fn: () => void) => () => { onClose(); fn() }
    const all: Hit[] = [
      ...tables.map(t => ({
        id: `t-${t.id}`, icon: <IconSheets />, title: t.name,
        sub: `Mesa · ${t.gameSystem}`, run: go(() => openTable(t.id)),
      })),
      ...characters.map(c => ({
        id: `c-${c.id}`, icon: <IconScroll />, title: c.name,
        sub: `Ficha · ${[c.class, c.race].filter(Boolean).join(' · ')} · Nível ${c.level}`,
        run: go(() => { selectCharacter(c.id); navigate('ficha') }),
      })),
      { id: 'k-char', icon: <IconPlus />, title: 'Criar nova ficha', sub: 'Comando', run: go(() => navigate('novo-personagem')) },
      { id: 'k-table', icon: <IconPlus />, title: 'Criar nova mesa', sub: 'Comando', run: go(() => navigate('nova-mesa')) },
      { id: 'k-roll', icon: <IconPlus />, title: 'Rolar dados', sub: 'Comando', run: go(onRoll) },
      { id: 'k-cal', icon: <IconCalendar />, title: 'Abrir calendário', sub: 'Comando', run: go(() => navigate('calendario')) },
      { id: 'k-not', icon: <IconBell />, title: 'Abrir notificações', sub: 'Comando', run: go(() => navigate('notificacoes')) },
    ]
    const q = norm(query.trim())
    return (q ? all.filter(h => norm(h.title).includes(q) || norm(h.sub).includes(q)) : all).slice(0, 8)
  }, [query, tables, characters, navigate, openTable, selectCharacter, onClose, onRoll])

  useEffect(() => setIndex(0), [query])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') hits[index]?.run()
  }

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Busca rápida"
         onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} onKeyDown={onKey}>
      <div className="tm-modal qs-modal">
        <div className="tm-head">
          <h2>Busca rápida · Ctrl K</h2>
          <button type="button" className="tm-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <label className="qs-input">
          <IconSearch />
          <input ref={input} value={query} onChange={e => setQuery(e.target.value)} autoComplete="off"
                 placeholder="Buscar mesas, fichas, comandos…" aria-label="Buscar" />
        </label>
        {hits.length === 0 ? (
          <StateView kind="noresults" title="Nada encontrado" text="Tente outros termos."
                     actions={[{ label: 'Limpar busca', onClick: () => setQuery('') }]} />
        ) : (
          <ul className="qs-list" role="listbox">
            {hits.map((h, i) => (
              <li key={h.id} role="option" aria-selected={i === index}>
                <button type="button" className={`qs-hit${i === index ? ' on' : ''}`} onMouseEnter={() => setIndex(i)} onClick={h.run}>
                  <span className="qs-icon" aria-hidden="true">{h.icon}</span>
                  <span className="qs-text"><strong>{h.title}</strong><small>{h.sub}</small></span>
                  <span className="qs-go" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}
