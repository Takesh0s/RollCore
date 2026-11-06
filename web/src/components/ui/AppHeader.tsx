import { useEffect, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Screen } from '@/types'
import { DiceLogo } from '@/components/ui/DiceLogo'
import { useDesktop } from '@/hooks/useDesktop'
import { NavIcon } from '@/components/ui/NavIcon'
import {
  IconMenu, IconBack, IconUser, IconHome, IconBell, IconCommunity, IconCalendar,
  IconSystems, IconGrimoire, IconWand, IconPaw, IconChat, IconGear, IconSearch,
} from '@/components/ui/icons'

interface MenuItem {
  label: string
  icon:  ReactNode
  /** Tela de destino. Sem `screen`, o item ainda não existe no app. */
  screen?: Screen
}

/** Itens do menu na ordem do Figma. Só "Home Page" existe por enquanto. */
const MENU: MenuItem[] = [
  { label: 'Home Page',     icon: <IconHome />,      screen: 'dashboard' },
  { label: 'Notificações',  icon: <IconBell /> },
  { label: 'Comunidade',    icon: <IconCommunity /> },
  { label: 'Calendário',    icon: <IconCalendar /> },
  { label: 'Sistemas',      icon: <IconSystems /> },
  { label: 'Grimório',      icon: <IconGrimoire /> },
  { label: 'GM Tools',      icon: <IconWand /> },
  { label: 'Bestiário',     icon: <IconPaw /> },
  { label: 'Tutoriais',     icon: <IconChat /> },
  { label: 'Créditos',      icon: <DiceLogo className="menu-logo" /> },
  { label: 'Configurações', icon: <IconGear />, screen: 'tema' },
]

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
  { label: 'Dados',       icon: <NavIcon name="dice" />, screen: 'dados' },
  { label: 'Mesas',       icon: <NavIcon name="tables" />, screen: 'mesas', also: ['nova-mesa', 'mesa', 'mapas'] },
  { label: 'Calendário',  icon: <NavIcon name="calendar" /> },
  { label: 'Comunidade',  icon: <NavIcon name="community" /> },
  { label: 'Sistemas',    icon: <NavIcon name="systems" /> },
  { label: 'Bestiário',   icon: <NavIcon name="bestiary" /> },
  { label: 'GM Tools',    icon: <NavIcon name="tools" /> },
  { label: 'Livraria',    icon: <NavIcon name="store" /> },
  { label: 'Tutoriais',   icon: <NavIcon name="tutorials" /> },
]
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
  const { navigate, showToast, user, screen } = useAppStore()
  const [open, setOpen] = useState(false)
  const desktop = useDesktop()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function go(item: MenuItem) {
    setOpen(false)
    if (item.screen) navigate(item.screen)
    else showToast(`${item.label} chega em breve.`)
  }

  if (desktop) {
    const isActive = (it: NavItem) => !!it.screen && (it.screen === screen || !!it.also?.includes(screen))
    const renderItem = (it: NavItem) => (
      <li key={it.label}>
        <button
          className={`side-menu-item${isActive(it) ? ' active' : ''}${it.screen ? '' : ' soon'}`}
          aria-current={isActive(it) ? 'page' : undefined}
          onClick={() => { setOpen(false); if (it.screen) navigate(it.screen); else showToast(`${it.label} chega em breve.`) }}
        >
          <span className="side-menu-icon">{it.icon}</span>
          {it.label}
        </button>
      </li>
    )
    return (
      <>
        {/* No PC o menu também abre pelo hambúrguer: uma gaveta sobre a tela, fora da moldura prateada */}
        {open && (
          <>
            <div className="side-menu-backdrop desk-backdrop" onClick={() => setOpen(false)} />
            <nav className="side-menu docked" aria-label="Menu principal">
              <div className="side-brand">
                <span className="side-brand-name">RollCore</span>
                <span className="side-brand-sub">Painel do jogador</span>
              </div>
              <ul className="side-list">{SIDEBAR.map(renderItem)}</ul>
              <ul className="side-foot">{renderItem(SIDEBAR_FOOT)}</ul>
            </nav>
          </>
        )}

        <header className="app-header desk">
          <button className="app-header-btn" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>
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
          <button className="app-header-btn" onClick={() => showToast('Notificações chega em breve.')} aria-label="Notificações">
            <IconBell />
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
          <nav className="side-menu" aria-label="Menu principal">
            <button className="app-header-btn side-menu-close" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <IconMenu />
            </button>
            <ul>
              {MENU.map(item => (
                <li key={item.label}>
                  <button
                    className={`side-menu-item${item.screen ? '' : ' soon'}${item.label === 'Créditos' ? ' accent' : ''}`}
                    onClick={() => go(item)}
                  >
                    <span className="side-menu-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </header>
  )
}
