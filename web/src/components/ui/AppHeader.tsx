import { useEffect, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Screen } from '@/types'
import { DiceLogo } from '@/components/ui/DiceLogo'
import {
  IconMenu, IconBack, IconUser, IconHome, IconBell, IconCommunity, IconCalendar,
  IconSystems, IconGrimoire, IconWand, IconPaw, IconChat, IconGear,
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
  { label: 'Configurações', icon: <IconGear /> },
]

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
  const { navigate, showToast, user } = useAppStore()
  const [open, setOpen] = useState(false)

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
