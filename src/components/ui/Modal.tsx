interface ModalProps {
  title: string
  body: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}

/**
 * Generic confirmation modal.
 * Clicking the overlay (outside the card) triggers onCancel,
 * matching standard UX expectations.
 */
export function Modal({ title, body, onConfirm, onCancel, confirmLabel = 'Confirmar' }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <p className="modal-title">{title}</p>
        <p className="modal-body">{body}</p>
        <div className="form-actions form-actions-end">
          <button className="btn btn-outline btn-auto" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger btn-auto" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
