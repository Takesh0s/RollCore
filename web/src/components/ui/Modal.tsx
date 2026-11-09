import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  title: string
  /** Accepts both `message` (CharacterFormScreen) and `body` (legacy) */
  message?: string
  body?: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

/**
 * Janela de confirmação, no visual do Figma (25.x): título em serifa com ×, texto curto,
 * "Cancelar" em contorno e a ação principal (vinho quando destrói algo).
 * Aparece só com `open`; Esc, o × e um clique fora chamam onCancel.
 * Vai para o <body> (portal) para não ficar presa sob o cabeçalho do app.
 */
export function Modal({
  open,
  title,
  message,
  body,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger       = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const text = message ?? body ?? ''

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}
         onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="tm-modal">
        <div className="tm-head">
          <h2>{title}</h2>
          <button type="button" className="tm-close" onClick={onCancel} aria-label="Fechar">×</button>
        </div>
        {text && <p className="tm-text">{text}</p>}
        <div className="tm-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={danger ? 'btn tm-danger' : 'btn btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
