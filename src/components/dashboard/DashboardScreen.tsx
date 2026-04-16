import { useAppStore } from '@/store/useAppStore'
import { formatMod, profBonus } from '@/lib/engine'
import { formatTimestamp } from '@/lib/dice'

function IconUser() {
  return (
    <svg className="dash-card-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="14" r="6" /><path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" />
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
      <polyline points="13 15 17 10 13 5" /><line x1="17" y1="10" x2="7" y2="10" />
    </svg>
  )
}

function IconProfile() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <circle cx="10" cy="7" r="3" />
      <path d="M3 18c0-4 3.134-7 7-7s7 3 7 7" />
    </svg>
  )
}

export function DashboardScreen() {
  const { navigate, logout, user, characters, history, selectCharacter } = useAppStore()

  const lastChar = characters[characters.length - 1] ?? null
  const lastRoll = history[0] ?? null

  return (
    <div className="device">
      <div className="topbar">
        <div className="topbar-info">
          <div className="top-title">RollCore</div>
          <div className="top-sub">Bem-vindo, <strong style={{ color: 'var(--primary)' }}>@{user.username}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="topbar-action" onClick={() => navigate('perfil')} title="Meu Perfil">
            <IconProfile /> Perfil
          </button>
          <button className="topbar-action topbar-logout" onClick={logout} title="Sair da conta">
            <IconLogout /> Sair
          </button>
        </div>
      </div>

      <div className="page-body">
        <h2 className="section-title">Acesso Rápido</h2>
        <div className="cards-grid">
          <div className="dash-card" onClick={() => navigate('personagens')}>
            <IconUser />
            <h3>Personagens</h3>
            <p>
              {characters.length === 0 ? 'Criar primeira ficha'
                : characters.length === 1 ? '1 personagem'
                : `${characters.length} personagens`}
            </p>
          </div>
          <div className="dash-card" onClick={() => navigate('dados')}>
            <IconDice />
            <h3>Dados</h3>
            <p>
              {lastRoll
                ? `Último: ${lastRoll.formula ?? `d${lastRoll.result.sides}`} = ${lastRoll.result.total}`
                : 'Rolar dados'}
            </p>
          </div>
        </div>

        {lastChar && (
          <>
            <h2 className="section-title" style={{ marginTop: 24 }}>Personagem Recente</h2>
            <div className="dash-recent-char" onClick={() => { selectCharacter(lastChar.id); navigate('ficha') }}>
              <div className="dash-rc-info">
                <span className="dash-rc-name">{lastChar.name}</span>
                <span className="dash-rc-sub">{lastChar.class} · {lastChar.race} · Nível {lastChar.level}</span>
                <span className="dash-rc-sub">
                  HP {lastChar.hp}/{lastChar.max_hp ?? lastChar.hp}
                  {lastChar.temp_hp > 0 ? ` +${lastChar.temp_hp} temp` : ''}
                  {' · '}CA {lastChar.ac}
                  {' · '}Prof {formatMod(profBonus(lastChar.level))}
                </span>
              </div>
              <span className="dash-rc-arrow">→</span>
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: 24 }}>Últimas Rolagens</h2>
            <div className="dash-history">
              {history.slice(0, 5).map((entry, i) => {
                const isCrit = entry.result.sides === 20 && entry.result.rolls[0] === 20
                const isFail = entry.result.sides === 20 && entry.result.rolls[0] === 1
                return (
                  <div key={i} className={`history-entry${isCrit ? ' crit' : isFail ? ' fail' : ''}`}>
                    <div className="h-left">
                      <span className="h-formula">{entry.formula ?? `d${entry.result.sides}`}</span>
                      <span className="h-time">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    <div className="h-right">
                      {isCrit && <span className="badge badge-crit">CRÍTICO</span>}
                      {isFail && <span className="badge badge-fail">FALHA</span>}
                      <span className="h-total">{entry.result.total}</span>
                    </div>
                  </div>
                )
              })}
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 6 }} onClick={() => navigate('dados')}>
                Ver histórico completo →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}