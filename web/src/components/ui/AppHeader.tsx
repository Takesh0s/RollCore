import { useEffect, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Screen } from '@/types'
import { useDeskMenu } from '@/hooks/useDeskMenu'
import { useDesktop } from '@/hooks/useDesktop'
import { NavIcon } from '@/components/ui/NavIcon'
import { DiceLogo } from '@/components/ui/DiceLogo'
import { IconMenu, IconBack, IconUser, IconBell, IconSearch } from '@/components/ui/icons'

/** Itens da barra lateral do computador, na ordem do Figma. */
interface NavItem {
  label:   string
  icon:    ReactNode
  screen?: Screen
  /** Telas que mantêm este item marcado como ativo. */
  also?:   Screen[]
}

const SIDEBAR: NavItem[] = [
  { label: 'Início',      icon: <NavIcon name="home" />,      screen: 'dashboard' },
  { label: 'Fichas',      icon: <NavIcon name="sheets" />,    screen: 'personagens', also: ['ficha', 'novo-personagem', 'editar-personagem'] },
  { label: 'Dados',       icon: <DiceLogo className="nav-logo" />, screen: 'dados' },
  { label: 'Mesas',       icon: <NavIcon name="tables" />, screen: 'mesas', also: ['nova-mesa', 'editar-mesa', 'mesa', 'mapas'] },
  { label: 'Calendário',  icon: <NavIcon name="calendar" />, screen: 'calendario', also: ['novo-evento'] },
  { label: 'Comunidade',  icon: <NavIcon name="community" /> },
  { label: 'Sistemas',    icon: <NavIcon name="systems" /> },
  { label: 'Bestiário',   icon: <NavIcon name="bestiary" /> },
  { label: 'GM Tools',    icon: <NavIcon name="tools" /> },
  { label: 'Livraria',    icon: <NavIcon name="store" /> },
  { label: 'Tutoriais',   icon: <NavIcon name="tutorials" /> },
]
/** No celular não há sino no cabeçalho; as notificações ficam no topo do menu. */
const NOTIF_ITEM: NavItem = { label: 'Notificações', icon: <IconBell />, screen: 'notificacoes' }
const SIDEBAR_FOOT: NavItem = { label: 'Configurações', icon: <NavIcon name="settings" />, screen: 'tema' }

interface AppHeaderProps {
  title: string
  /** Com `onBack`, o botão de menu vira seta de voltar (como na tela de Perfil do Figma). */
  onBack?: () => void
  /** Esconde o ícone de perfil (usado na própria tela de Perfil). */
  hideProfile?: boolean
}

/**
 * Cabeçalho das telas logadas: menu à esquerda, título em verde-água no centro
 * e atalho do perfil à direita. O menu lateral abre sobre o conteúdo.
 */
export function AppHeader({ title, onBack, hideProfile }: AppHeaderProps) {
  const { navigate, showToast, user, screen, askLogout, unreadCount } = useAppStore()
  const [open, setOpen] = useState(false)
  const desktop = useDesktop()
  const [deskMenuOpen, setDeskMenu] = useDeskMenu()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function go(item: NavItem) {
    setOpen(false)
    if (item.screen) navigate(item.screen)
    else showToast(`${item.label} chega em breve.`)
  }
  const isActiveItem = (it: NavItem) => !!it.screen && (it.screen === screen || !!it.also?.includes(screen))
  const renderSheetItem = (it: NavItem) => (
    <li key={it.label}>
      <button
        className={`side-menu-item${isActiveItem(it) ? ' active' : ''}${it.screen ? '' : ' soon'}`}
        aria-current={isActiveItem(it) ? 'page' : undefined}
        onClick={() => go(it)}
      >
        <span className="side-menu-icon">{it.icon}</span>
        {it.label}
        {it.screen === 'notificacoes' && unreadCount > 0 && <span className="menu-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
    </li>
  )

  if (desktop) {
    const isActive = (it: NavItem) => !!it.screen && (it.screen === screen || !!it.also?.includes(screen))
    const renderItem = (it: NavItem) => (
      <li key={it.label}>
        <button
          className={`side-menu-item${isActive(it) ? ' active' : ''}${it.screen ? '' : ' soon'}`}
          aria-current={isActive(it) ? 'page' : undefined}
          onClick={() => (it.screen ? navigate(it.screen) : showToast(`${it.label} chega em breve.`))}
        >
          <span className="side-menu-icon">{it.icon}</span>
          {it.label}
        </button>
      </li>
    )
    return (
      <>
        {/* No PC o hambúrguer abre/fecha a barra lateral, que ocupa o próprio espaço (a tela se ajusta)
            e continua aberta enquanto você navega, até alternar de novo. */}
        {deskMenuOpen && (
          <nav className="side-menu docked" aria-label="Menu principal">
            <div className="side-brand">
              <span className="side-brand-name">RollCore</span>
              <span className="side-brand-sub">Painel do jogador</span>
            </div>
            <ul className="side-list">{SIDEBAR.map(renderItem)}</ul>
            <ul className="side-foot">{renderItem(SIDEBAR_FOOT)}</ul>
          </nav>
        )}

        <header className="app-header desk">
          <button className="app-header-btn" onClick={() => setDeskMenu(!deskMenuOpen)} aria-label="Menu" aria-expanded={deskMenuOpen}>
            <IconMenu />
          </button>
          {onBack && (
            <button className="app-header-btn" onClick={onBack} aria-label="Voltar">
              <IconBack />
            </button>
          )}
          <h1 className="app-header-title">{title}</h1>
          <label className="desk-search">
            <IconSearch />
            <input type="search" placeholder="Buscar mesas, fichas, sistemas…" aria-label="Buscar" />
          </label>
          <button className="app-header-btn has-badge" onClick={() => navigate('notificacoes')}
                  aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não lidas)` : 'Notificações'}>
            <IconBell />
            {unreadCount > 0 && <span className="bell-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {!hideProfile && (
            <button className="desk-profile" onClick={() => navigate('perfil')} aria-label="Meu perfil">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="app-header-avatar" />
                : <IconUser />}
              <span>{user.username || 'Perfil'}</span>
            </button>
          )}
        </header>
      </>
    )
  }

  return (
    <header className="app-header">
      {onBack ? (
        <button className="app-header-btn" onClick={onBack} aria-label="Voltar">
          <IconBack />
        </button>
      ) : (
        <button
          className="app-header-btn"
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <IconMenu />
        </button>
      )}

      <h1 className="app-header-title">{title}</h1>

      {hideProfile ? (
        <span className="app-header-btn app-header-spacer" aria-hidden="true" />
      ) : (
        <button className="app-header-btn app-header-profile" onClick={() => navigate('perfil')} aria-label="Meu perfil">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="app-header-avatar" />
            : <IconUser />}
        </button>
      )}

      {open && (
        <>
          <div className="side-menu-backdrop" onClick={() => setOpen(false)} />
          <nav className="side-menu sheet" aria-label="Menu principal">
            <button className="side-profile" onClick={() => { setOpen(false); navigate('perfil') }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="side-avatar" />
                : <span className="side-avatar"><IconUser /></span>}
              <span className="side-profile-text">
                <strong>{user.username || 'Perfil'}</strong>
                <small>@{(user.username || 'perfil').toLowerCase().replace(/\s+/g, '')}</small>
              </span>
            </button>
            <ul className="side-list">{[NOTIF_ITEM, ...SIDEBAR].map(renderSheetItem)}</ul>
            <ul className="side-foot">
              {renderSheetItem(SIDEBAR_FOOT)}
              <li>
                <button className="side-logout" onClick={() => { setOpen(false); askLogout() }}>Sair da conta</button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  )
}
