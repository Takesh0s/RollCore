import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { DiceLogo } from '@/components/ui/DiceLogo'

export function LoginScreen() {
  const { login, navigate, registeredEmails, showToast } = useAppStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({})

  // UC-01 I02 Cmd 1: habilitado somente com ambos os campos preenchidos
  const canSubmit = email.trim().length > 0 && password.trim().length > 0

  function handleLogin() {
    setErrors({})

    // UC-01 E01 / RN-03: mensagem genérica — protege contra enumeração (OWASP)
    if (email === 'errado@teste.com' || !registeredEmails.includes(email.toLowerCase())) {
      // Para o protótipo aceitamos qualquer e-mail exceto o mock de falha
      if (email === 'errado@teste.com') {
        setErrors({ password: 'E-mail ou senha incorretos.' }) // MSG003
        return
      }
    }

    login(email.trim(), remember)
    showToast(`Bem-vindo, ${email.split('@')[0]}!`, 'success')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canSubmit) handleLogin()
  }

  return (
    <div className="device login-device">
      <div className="login-header">
        <div className="logo-wrap">
          <DiceLogo className="logo-svg" />
        </div>
        <h1>RollCore</h1>
        <p>Acesse sua conta</p>
      </div>

      <div className="narrow">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input
            className={`form-input${errors.email ? ' error' : ''}`}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />
          {errors.email && <small className="error-msg">{errors.email}</small>}
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <input
            className={`form-input${errors.password ? ' error' : ''}`}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
          {errors.password && <small className="error-msg">{errors.password}</small>}
        </div>

        <div className="form-group">
          <label className="form-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Manter conectado
          </label>
        </div>

        {/* UC-01 I02 Cmd 1: desabilitado até e-mail + senha preenchidos */}
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={!canSubmit}
        >
          Entrar
        </button>

        <button className="link-btn" onClick={() => navigate('cadastro')}>
          Criar conta
        </button>

        {/* UC-01 I02 Cmd 3: sempre visível, desabilitado na Fase 1 (NR-06) */}
        <span className="link-muted">Esqueci minha senha</span>
      </div>
    </div>
  )
}
