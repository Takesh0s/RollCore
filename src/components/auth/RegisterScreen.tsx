import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { storage } from '@/lib/storage'
import { DiceLogo } from '@/components/ui/DiceLogo'

/** UC-01 RN-01: strong password requires ≥8 chars, 1 uppercase letter, 1 digit. */
function isStrong(p: string) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
}

function strengthScore(p: string): number {
  let s = 0
  if (p.length >= 8)   s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (p.length >= 12)  s++
  return s
}

const STRENGTH_COLORS = ['', '#e05555', '#e8a020', '#d4b830', '#4ade80']

/** Validates username: 3–20 chars, letters/numbers/underscores only. */
function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

export function RegisterScreen() {
  const { register, navigate, registeredEmails, showToast } = useAppStore()

  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [confirm,  setConfirm]  = useState('')

  const [usernameErr, setUsernameErr] = useState('')
  const [emailErr,    setEmailErr]    = useState('')
  const [passErr,     setPassErr]     = useState('')
  const [confirmErr,  setConfirmErr]  = useState('')

  const [usernameValid, setUsernameValid] = useState(false)
  const [emailValid,    setEmailValid]    = useState(false)
  const [passValid,     setPassValid]     = useState(false)

  const score = strengthScore(pass)

  // Username: validate uniqueness and format on blur
  const handleUsernameBlur = useCallback(() => {
    const v = username.trim()
    if (!v) return
    if (!isValidUsername(v)) {
      setUsernameErr('3–20 caracteres. Apenas letras, números e _')
      setUsernameValid(false)
    } else if (storage.getUsernames().has(v.toLowerCase())) {
      setUsernameErr('Nome de usuário já está em uso.')
      setUsernameValid(false)
    } else {
      setUsernameErr(''); setUsernameValid(true)
    }
  }, [username])

  // Email: format + uniqueness validated on blur — UC-01 RAP001
  const handleEmailBlur = useCallback(() => {
    const v = email.trim()
    if (!v) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailErr('Informe um e-mail válido')
      setEmailValid(false)
    } else if (registeredEmails.includes(v.toLowerCase())) {
      setEmailErr('E-mail já cadastrado. Utilize outro e-mail ou faça login.') // MSG001
      setEmailValid(false)
    } else {
      setEmailErr(''); setEmailValid(true)
    }
  }, [email, registeredEmails])

  // Password: real-time strength feedback — UC-01 E02 / MSG002
  const handlePassChange = useCallback((val: string) => {
    setPass(val)
    if (val && !isStrong(val)) {
      setPassErr('Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.')
      setPassValid(false)
    } else if (val) {
      setPassErr(''); setPassValid(true)
    } else {
      setPassErr(''); setPassValid(false)
    }
    if (confirm && confirm !== val) setConfirmErr('As senhas não coincidem')
    else if (confirm) setConfirmErr('')
  }, [confirm])

  const handleConfirmChange = useCallback((val: string) => {
    setConfirm(val)
    if (val && val !== pass) setConfirmErr('As senhas não coincidem')
    else setConfirmErr('')
  }, [pass])

  function handleRegister() {
    let valid = true

    const u = username.trim()
    if (!isValidUsername(u)) {
      setUsernameErr('3–20 caracteres. Apenas letras, números e _'); valid = false
    } else if (storage.getUsernames().has(u.toLowerCase())) {
      setUsernameErr('Nome de usuário já está em uso.'); valid = false
    }

    const v = email.trim()
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailErr('Informe um e-mail válido'); valid = false
    } else if (registeredEmails.includes(v.toLowerCase())) {
      setEmailErr('E-mail já cadastrado. Utilize outro e-mail ou faça login.'); valid = false
    }

    if (!isStrong(pass)) {
      setPassErr('Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.'); valid = false
    }
    if (pass !== confirm) {
      setConfirmErr('As senhas não coincidem'); valid = false
    }

    if (!valid) return
    register(email.trim(), username.trim())
    showToast('Conta criada com sucesso!', 'success')
  }

  return (
    <div className="device login-device">
      <div className="login-header">
        <div className="logo-wrap"><DiceLogo className="logo-svg" /></div>
        <h1>Criar Conta</h1>
        <p>Junte-se à aventura</p>
      </div>

      <div className="narrow">

        {/* ── Username ── */}
        <div className="form-group">
          <label className="form-label">Nome de Usuário</label>
          <input
            className={`form-input${usernameErr ? ' error' : usernameValid ? ' valid' : ''}`}
            type="text"
            placeholder="ex: guerreiro_dos_reinos"
            maxLength={20}
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameErr(''); setUsernameValid(false) }}
            onBlur={handleUsernameBlur}
            autoComplete="username"
          />
          <small className="field-hint">3–20 caracteres. Letras, números e _ apenas.</small>
          {usernameErr && <small className="error-msg">{usernameErr}</small>}
        </div>

        {/* ── Email ── */}
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input
            className={`form-input${emailErr ? ' error' : emailValid ? ' valid' : ''}`}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailErr(''); setEmailValid(false) }}
            onBlur={handleEmailBlur}
            autoComplete="email"
          />
          {emailErr && <small className="error-msg">{emailErr}</small>}
        </div>

        {/* ── Password ── */}
        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            className={`form-input${passErr ? ' error' : passValid ? ' valid' : ''}`}
            type="password"
            placeholder="Mínimo 8 chars, 1 maiúscula, 1 número"
            value={pass}
            onChange={e => handlePassChange(e.target.value)}
            autoComplete="new-password"
          />
          <div className="pass-bar">
            <div className="pass-fill" style={{ width: `${score * 25}%`, background: STRENGTH_COLORS[score] || 'transparent' }} />
          </div>
          {passErr && <small className="error-msg">{passErr}</small>}
        </div>

        {/* ── Confirm ── */}
        <div className="form-group">
          <label className="form-label">Confirmar Senha</label>
          <input
            className={`form-input${confirmErr ? ' error' : confirm && !confirmErr ? ' valid' : ''}`}
            type="password"
            placeholder="Repita a senha"
            value={confirm}
            onChange={e => handleConfirmChange(e.target.value)}
            autoComplete="new-password"
          />
          {confirmErr && <small className="error-msg">{confirmErr}</small>}
        </div>

        <button className="btn btn-primary" onClick={handleRegister}>
          Criar Conta
        </button>

        <button className="link-btn" onClick={() => navigate('login')}>
          Já tenho conta
        </button>
      </div>
    </div>
  )
}