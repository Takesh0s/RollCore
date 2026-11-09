import { useState, type FormEvent } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Shell } from '@/components/tables/TableModals'
import { PasswordInput } from '@/components/ui/PasswordInput'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/

/** Texto de erro de uma chamada de conta, a partir do status que a API devolveu. */
function apiError(err: any, fallback: string, byStatus: Record<number, string>): string {
  const status = err?.response?.status as number | undefined
  if (status && byStatus[status]) return byStatus[status]
  return fallback
}

/** Alterar e-mail (Figma 17.3): novo e-mail e a senha atual. */
export function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const { changeEmail, showToast } = useAppStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) { setError('Digite um e-mail válido.'); return }
    if (!password) { setError('Digite sua senha atual.'); return }
    setBusy(true)
    try {
      await changeEmail(email.trim(), password)
      showToast('E-mail atualizado!', 'success')
      onClose()
    } catch (err: any) {
      setError(apiError(err, 'Não foi possível alterar o e-mail.', {
        403: 'Senha atual incorreta.',
        409: 'Este e-mail já está em uso.',
        400: 'Confira o e-mail digitado.',
        429: 'Muitas tentativas. Aguarde um minuto.',
      }))
      setBusy(false)
    }
  }

  return (
    <Shell title="Alterar e-mail" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label className="tm-label" htmlFor="acc-new-email">Novo e-mail</label>
        <input id="acc-new-email" className={`form-input${error ? ' error' : ''}`} type="email" autoComplete="email"
               value={email} placeholder="novo@email.com" onChange={e => { setEmail(e.target.value); setError('') }} />
        <label className="tm-label" htmlFor="acc-email-pass">Senha atual</label>
        <PasswordInput id="acc-email-pass" className="form-input" autoComplete="current-password"
                       value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
        {error && <small className="error-msg" role="alert">{error}</small>}
        <div className="tm-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '…' : 'Salvar'}</button>
        </div>
      </form>
    </Shell>
  )
}

/** Alterar senha (Figma 03.3): senha antiga, nova e confirmação. */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword, showToast } = useAppStore()
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [again, setAgain]     = useState('')
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!current) { setError('Digite sua senha atual.'); return }
    if (!PASSWORD_RE.test(next)) { setError('A nova senha precisa de 8 caracteres, uma maiúscula e um número.'); return }
    if (next === current) { setError('A nova senha deve ser diferente da atual.'); return }
    if (next !== again) { setError('A confirmação não confere com a nova senha.'); return }
    setBusy(true)
    try {
      await changePassword(current, next)
      showToast('Senha alterada! Os outros aparelhos foram desconectados.', 'success')
      onClose()
    } catch (err: any) {
      setError(apiError(err, 'Não foi possível alterar a senha.', {
        403: 'Senha atual incorreta.',
        400: 'A nova senha não atende às regras.',
        429: 'Muitas tentativas. Aguarde um minuto.',
      }))
      setBusy(false)
    }
  }

  return (
    <Shell title="Alterar senha" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label className="tm-label" htmlFor="acc-pass-old">Senha antiga</label>
        <PasswordInput id="acc-pass-old" className="form-input" autoComplete="current-password"
                       value={current} onChange={e => { setCurrent(e.target.value); setError('') }} />
        <label className="tm-label" htmlFor="acc-pass-new">Nova senha</label>
        <PasswordInput id="acc-pass-new" className="form-input" autoComplete="new-password"
                       value={next} onChange={e => { setNext(e.target.value); setError('') }} />
        <label className="tm-label" htmlFor="acc-pass-again">Confirmar nova senha</label>
        <PasswordInput id="acc-pass-again" className="form-input" autoComplete="new-password"
                       value={again} onChange={e => { setAgain(e.target.value); setError('') }} />
        <small className="field-hint">Mínimo de 8 caracteres, com uma letra maiúscula e um número.</small>
        {error && <small className="error-msg" role="alert">{error}</small>}
        <div className="tm-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '…' : 'Salvar alterações'}</button>
        </div>
      </form>
    </Shell>
  )
}

/** Excluir conta (Figma 17.5): só libera o botão depois de digitar EXCLUIR. */
export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { deleteAccount, showToast } = useAppStore()
  const [typed, setTyped] = useState('')
  const [busy, setBusy]   = useState(false)
  const ok = typed.trim() === 'EXCLUIR'

  async function run() {
    setBusy(true)
    try {
      await deleteAccount()
      showToast('Conta excluída.', 'success')
    } catch {
      showToast('Não foi possível excluir a conta.', 'error')
      setBusy(false)
    }
  }

  return (
    <Shell title="Excluir conta?" onClose={onClose}>
      <p className="tm-text">
        Essa ação é permanente: fichas, mesas e imagens da sua conta serão apagadas.
        Digite EXCLUIR para confirmar.
      </p>
      <label className="tm-label" htmlFor="acc-del">Confirmação</label>
      <input id="acc-del" className="form-input" value={typed} autoComplete="off" placeholder="EXCLUIR"
             onChange={e => setTyped(e.target.value)} />
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn tm-danger" disabled={!ok || busy} onClick={run}>Excluir conta</button>
      </div>
    </Shell>
  )
}
