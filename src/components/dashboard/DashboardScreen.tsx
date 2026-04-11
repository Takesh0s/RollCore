import { useAppStore } from '@/store/useAppStore'

// Inline SVG icons — replace the emojis used in the Vanilla JS prototype (Sprint 4)
function IconUser() {
  return (
    <svg className="dash-card-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="14" r="6" />
      <path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" />
    </svg>
  )
}

function IconDice() {
  return (
    <svg className="dash-card-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="28" height="28" rx="5" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
      <circle cx="26" cy="14" r="2" fill="currentColor" />
      <circle cx="14" cy="26" r="2" fill="currentColor" />
      <circle cx="26" cy="26" r="2" fill="currentColor" />
      <circle cx="20" cy="20" r="2" fill="currentColor" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M7 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" />
      <polyline points="13 15 17 10 13 5" />
      <line x1="17" y1="10" x2="7" y2="10" />
    </svg>
  )
}

export function DashboardScreen() {
  const { navigate, logout, user } = useAppStore()

  return (
    <div className="device">
      <div className="topbar">
        <div className="topbar-info">
          <div className="top-title">RollCore</div>
          <div className="top-sub">Bem-vindo, {user.email.split('@')[0]}</div>
        </div>
        <button className="topbar-action topbar-logout" onClick={logout} title="Sair da conta">
          <IconLogout />
          Sair
        </button>
      </div>

      <div className="page-body">
        <h2 className="section-title">Acesso Rápido</h2>
        <div className="cards-grid">
          <div className="dash-card" onClick={() => navigate('personagens')}>
            <IconUser />
            <h3>Personagens</h3>
            <p>Gerenciar fichas</p>
          </div>
          <div className="dash-card" onClick={() => navigate('dados')}>
            <IconDice />
            <h3>Dados</h3>
            <p>Rolar dados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
