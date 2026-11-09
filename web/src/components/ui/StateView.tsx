import type { ReactNode } from 'react'
import { IconHelp, IconSearch, IconSheets } from './icons'

export type StateKind = 'empty' | 'notfound' | 'noresults'

const ICONS: Record<StateKind, ReactNode> = {
  empty:     <IconSheets />,
  notfound:  <IconHelp />,
  noresults: <IconSearch />,
}

interface StateAction { label: string; onClick: () => void; primary?: boolean }

/**
 * Tela de estado (Figma 18.x): ícone num círculo, título, texto curto e até dois botões.
 * `empty` = nada criado ainda, `noresults` = busca/filtro sem resposta, `notfound` = página ou mesa que não existe.
 */
export function StateView({ kind, title, text, actions = [] }: {
  kind: StateKind; title: string; text?: string; actions?: StateAction[]
}) {
  return (
    <div className={`state-view ${kind}`} role="status">
      <span className="state-icon" aria-hidden="true">{ICONS[kind]}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {actions.length > 0 && (
        <div className="state-actions">
          {actions.map(a => (
            <button key={a.label} type="button" className={`btn btn-pill ${a.primary ? 'btn-primary' : 'btn-outline'}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
