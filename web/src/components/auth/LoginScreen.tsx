import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { DiceLogo } from '@/components/ui/DiceLogo'

export function LoginScreen() {
  const { navigate, login } = useAppStore()

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [emailErr,      setEmailErr]      = useState('')
  const [passErr,       setPassErr]       = useState('')
  const [keepConnected, setKeepConnected] = useState(false)
  const [loading,       setLoading]       = useState(false)

  function validateEmail(v: string) {
    if (!v.trim()) { setEmailErr('E-mail é obrigatório.'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setEmailErr('Formato de e-mail inválido.'); return false }
    setEmailErr(''); return true
  }

  async function handleLogin() {
    const emailOk = validateEmail(email)
    if (!password.trim()) { setPassErr('Senha é obrigatória.'); return }
    setPassErr('')
    if (!emailOk) return

    setLoading(true)
    try {
      await login(email.trim(), password, keepConnected)
    } catch {
      setPassErr('E-mail ou senha incorretos.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() && password.trim() && !loading

  return (
    <div className="login-device">

      <div className="logo-wrap">
        <DiceLogo className="logo-svg" />
      </div>

      <div className="login-header">
        <h1>RollCore</h1>
        <p>Acesse sua conta</p>
      </div>

      <div className="form-group">
        <label className="form-label">E-mail</label>
        <input
          className={`form-input${emailErr ? ' error' : email && !emailErr ? ' valid' : ''}`}
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value) }}
          onBlur={() => validateEmail(email)}
        />
        {emailErr && <small className="error-msg">{emailErr}</small>}
      </div>

      <div className="form-group">
        <label className="form-label">Senha</label>
        <input
          className={`form-input${passErr ? ' error' : ''}`}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={e => { setPassword(e.target.value); setPassErr('') }}
          onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleLogin() }}
        />
        {passErr && <small className="error-msg">{passErr}</small>}
      </div>

      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          id="keep"
          checked={keepConnected}
          onChange={e => setKeepConnected(e.target.checked)}
        />
        <label htmlFor="keep" style={{ fontSize: 13, cursor: 'pointer' }}>Manter conectado</label>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleLogin}
        disabled={!canSubmit}
      >
        {loading ? '…' : 'Entrar'}
      </button>

      <button className="link-btn" onClick={() => navigate('cadastro')}>
        Criar conta
      </button>

      <button className="link-btn link-btn-muted" onClick={() => navigate('esqueci-senha')}>
        Esqueci minha senha
      </button>

    </div>
  )
}