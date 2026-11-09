import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '@/store/useAppStore'

type NetState = { kind: 'offline' } | { kind: 'error'; status: number; what: string; code: string }

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * "Sem conexão" (Figma 25.14) e "Algo deu errado" (25.15): abrem quando o servidor não responde
 * ou devolve erro 5xx. Os formulários continuam abertos, então nada digitado se perde.
 * Só aparecem com o usuário logado (nas telas de acesso o erro já vai para o próprio formulário).
 */
export function NetworkModals() {
  const [state, setState] = useState<NetState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onNet = (e: Event) => {
      if (!useAppStore.getState().user.isLogged) return
      const d = (e as CustomEvent).detail as { kind: 'offline' } | { kind: 'error'; status: number; what: string }
      const now = new Date()
      setState(prev => prev ?? (d.kind === 'offline' ? d
        : { ...d, code: `RC-${d.status}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` }))
    }
    window.addEventListener('rollcore:net', onNet)
    return () => window.removeEventListener('rollcore:net', onNet)
  }, [])

  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  function close() { setState(null); setCopied(false) }

  function retry() {
    close()
    const s = useAppStore.getState()
    if (s.user.isLogged) { void s.loadTables(); void s.loadCharacters() }
  }

  async function copy() {
    if (state?.kind !== 'error') return
    try { await navigator.clipboard.writeText(state.code); setCopied(true) } catch { /* sem permissão: o código está na tela */ }
  }

  if (!state) return null

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={state.kind === 'offline' ? 'Sem conexão' : 'Algo deu errado'}
         onMouseDown={e => { if (e.target === e.currentTarget) close() }}>
      <div className="tm-modal">
        <div className="tm-head">
          <h2>{state.kind === 'offline' ? 'Sem conexão' : 'Algo deu errado'}</h2>
          <button type="button" className="tm-close" onClick={close} aria-label="Fechar">×</button>
        </div>

        {state.kind === 'offline' ? (
          <div className="net-body">
            <span className="net-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16.2a5 5 0 0 1 7 0" /><circle cx="12" cy="19.5" r=".8" fill="currentColor" /><line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            </span>
            <strong>Você está offline</strong>
            <p className="tm-text">Não conseguimos falar com o servidor. Confira sua internet e tente de novo.</p>
            <button type="button" className="btn btn-primary" onClick={retry}>Tentar de novo</button>
          </div>
        ) : (
          <>
            <div className="net-error-box">
              <span className="net-warn" aria-hidden="true">⚠</span>
              <div>
                <strong>Não foi possível {state.what}</strong>
                <small>Código do erro: {state.code}</small>
              </div>
            </div>
            <p className="tm-text">Nada foi perdido: o que você digitou continua na tela. Se o erro se repetir, envie o código ao suporte.</p>
            <div className="tm-actions">
              <button type="button" className="btn btn-outline" onClick={copy}>{copied ? 'Código copiado' : 'Copiar código'}</button>
              <button type="button" className="btn btn-primary" onClick={retry}>Tentar de novo</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
