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
 * Generic confirmation modal.
 * Rendered only when `open` is true.
 * Clicking the overlay (outside the card) triggers onCancel.
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
  if (!open) return null

  const text = message ?? body ?? ''

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <p className="modal-title">{title}</p>
        <p className="modal-body">{text}</p>
        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-auto" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`btn btn-auto ${danger ? 'btn-danger' : 'btn-primary'}`}
            style={{ marginTop: 0 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}