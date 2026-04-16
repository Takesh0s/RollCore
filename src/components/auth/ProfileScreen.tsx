import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { storage } from '@/lib/storage'

/** Validates username: 3–20 chars, letters/numbers/underscores only. */
function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

/**
 * Profile / Settings screen — allows the authenticated user to update
 * their display username. Accessible from the dashboard topbar.
 */
export function ProfileScreen() {
  const { navigate, user, updateProfile, showToast } = useAppStore()

  const [username,    setUsername]    = useState(user.username)
  const [usernameErr, setUsernameErr] = useState('')
  const [saved,       setSaved]       = useState(false)

  function handleSave() {
    const trimmed = username.trim()

    if (!isValidUsername(trimmed)) {
      setUsernameErr('3–20 caracteres. Apenas letras, números e _')
      return
    }

    // Allow keeping the same username; only block if another user owns it
    if (trimmed.toLowerCase() !== user.username.toLowerCase()) {
      if (storage.getUsernames().has(trimmed.toLowerCase())) {
        setUsernameErr('Nome de usuário já está em uso.')
        return
      }
    }

    setUsernameErr('')
    updateProfile({ username: trimmed })
    setSaved(true)
    showToast('Perfil atualizado!', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="device">
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('dashboard')}>←</button>
        <div className="topbar-info">
          <div className="top-title">Meu Perfil</div>
          <div className="top-sub">{user.email}</div>
        </div>
      </div>

      <div className="page-body">

        {/* ── Avatar placeholder ── */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="profile-display-name">@{user.username}</span>
        </div>

        {/* ── Edit username ── */}
        <h2 className="section-title" style={{ marginTop: 28 }}>Informações</h2>
        <div className="form-group">
          <label className="form-label">Nome de Usuário</label>
          <input
            className={`form-input${usernameErr ? ' error' : ''}`}
            type="text"
            maxLength={20}
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameErr(''); setSaved(false) }}
          />
          <small className="field-hint">3–20 caracteres. Letras, números e _ apenas.</small>
          {usernameErr && <small className="error-msg">{usernameErr}</small>}
        </div>

        <div className="form-group">
          <label className="form-label">E-mail</label>
          {/* Email is read-only in Phase 1 — change requires backend verification */}
          <input
            className="form-input"
            type="email"
            value={user.email}
            readOnly
            style={{ opacity: 0.55, cursor: 'not-allowed' }}
          />
          <small className="field-hint">A alteração de e-mail estará disponível na Fase 2.</small>
        </div>

        <div className="form-actions">
          <button className="btn btn-outline btn-auto" onClick={() => navigate('dashboard')}>
            Cancelar
          </button>
          <button
            className={`btn btn-primary btn-auto${saved ? ' btn-saved' : ''}`}
            style={{ marginTop: 0 }}
            onClick={handleSave}
          >
            {saved ? '✓ Salvo' : 'Salvar Alterações'}
          </button>
        </div>

      </div>
    </div>
  )
}