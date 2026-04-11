import { useAppStore } from '@/store/useAppStore'

// SVG icons replacing emojis (Sprint 4)
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

export function DashboardScreen() {
  const { navigate, user } = useAppStore()

  return (
    <div className="device">
      <div className="topbar">
        <div className="topbar-info">
          <div className="top-title">RollCore</div>
          <div className="top-sub">Bem-vindo, {user.email.split('@')[0]}</div>
        </div>
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
