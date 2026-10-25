import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { storage } from '@/lib/storage'
import { AvatarUpload } from '@/components/ui/AvatarUpload'

function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

/**
 * Profile screen — username editing and avatar upload.
 * Accessible from the dashboard topbar mini-profile.
 * Avatar is stored as base64 locally in Fase 1; backend endpoint in Fase 2.
 */
export function ProfileScreen() {
  const { navigate, user, updateProfile, showToast } = useAppStore()

  const [username,    setUsername]    = useState(user.username)
  const [usernameErr, setUsernameErr] = useState('')
  const [avatarUrl,   setAvatarUrl]   = useState<string | undefined>(user.avatar_url)
  const [saved,       setSaved]       = useState(false)
  const [loading,     setLoading]     = useState(false)

  async function handleSave() {
    const trimmed = username.trim()

    if (!isValidUsername(trimmed)) {
      setUsernameErr('3–20 caracteres. Apenas letras, números e _')
      return
    }

    if (trimmed.toLowerCase() !== user.username.toLowerCase()) {
      if (storage.getUsernames().has(trimmed.toLowerCase())) {
        setUsernameErr('Nome de usuário já está em uso.')
        return
      }
    }

    setUsernameErr('')
    setLoading(true)

    try {
      await updateProfile({ username: trimmed, avatar_url: avatarUrl })
      setSaved(true)
      showToast('Perfil atualizado!', 'success')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      showToast('Erro ao salvar perfil.', 'error')
    } finally {
      setLoading(false)
    }
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

        {/* ── Avatar ── */}
        <div className="profile-avatar-wrap">
          <AvatarUpload
            value={avatarUrl}
            initials={user.username.charAt(0)}
            onChange={setAvatarUrl}
            size={80}
          />
          <span className="profile-display-name">@{user.username}</span>
          <small className="field-hint" style={{ marginTop: 4 }}>
            Toque na foto para alterar · Máx. 2 MB
          </small>
        </div>

        {/* ── Username ── */}
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
            disabled={loading}
          >
            {loading ? '…' : saved ? '✓ Salvo' : 'Salvar Alterações'}
          </button>
        </div>

      </div>
    </div>
  )
}
