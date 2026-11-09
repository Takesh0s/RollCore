import { useAppStore } from '@/store/useAppStore'
import { Toast }                from '@/components/ui/Toast'
import { Modal }                from '@/components/ui/Modal'
import { NetworkModals }        from '@/components/ui/NetworkModals'
import { Crenellation }         from '@/components/ui/Crenellation'
import { LoginScreen }          from '@/components/auth/LoginScreen'
import { RegisterScreen }       from '@/components/auth/RegisterScreen'
import { ForgotPasswordScreen } from '@/components/auth/ForgotPasswordScreen'
import { ProfileScreen }        from '@/components/auth/ProfileScreen'
import { DashboardScreen }      from '@/components/dashboard/DashboardScreen'
import { CharacterListScreen }  from '@/components/characters/CharacterListScreen'
import { CharacterFormScreen }  from '@/components/characters/CharacterFormScreen'
import { CharacterSheetScreen } from '@/components/characters/CharacterSheetScreen'
import { DiceRollerScreen }     from '@/components/dice/DiceRollerScreen'
import { TableListScreen }      from '@/components/tables/TableListScreen'
import { TableFormScreen }      from '@/components/tables/TableFormScreen'
import { TableScreen }          from '@/components/tables/TableScreen'
import { MapLibraryScreen }     from '@/components/maps/MapLibraryScreen'
import { CalendarScreen }        from '@/components/calendar/CalendarScreen'
import { EventFormScreen }       from '@/components/calendar/EventFormScreen'
import { ThemeScreen }          from '@/components/ui/ThemeScreen'
import type { Screen } from '@/types'

/**
 * Renders the correct screen for a given route value.
 * Extracted so the transition wrapper can key on it independently.
 */
function ScreenContent({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'login':             return <LoginScreen />
    case 'cadastro':          return <RegisterScreen />
    case 'esqueci-senha':     return <ForgotPasswordScreen />
    case 'perfil':            return <ProfileScreen />
    case 'dashboard':         return <DashboardScreen />
    case 'personagens':       return <CharacterListScreen />
    case 'novo-personagem':   return <CharacterFormScreen mode="new" />
    case 'editar-personagem': return <CharacterFormScreen mode="edit" />
    case 'ficha':             return <CharacterSheetScreen />
    case 'dados':             return <DiceRollerScreen />
    case 'mesas':             return <TableListScreen />
    case 'nova-mesa':         return <TableFormScreen />
    case 'editar-mesa':       return <TableFormScreen edit />
    case 'mesa':              return <TableScreen />
    case 'mapas':             return <MapLibraryScreen />
    case 'calendario':        return <CalendarScreen />
    case 'novo-evento':       return <EventFormScreen />
    case 'tema':              return <ThemeScreen />
    default:                  return null
  }
}

/**
 * Root component. A tela nova entra direto (a animação de entrada fica no CSS de `.device`),
 * sem etapa de fade-out: antes a tela antiga sumia por ~150 ms e só restavam o fundo e as ameias.
 */
export default function App() {
  const screen = useAppStore(s => s.screen)
  const { logoutPrompt, cancelLogout, logout, dirtyMessage, pendingScreen, confirmDiscard, cancelDiscard } = useAppStore()

  return (
    <div className="app-shell">
      <div className="screen-wrap">
        <ScreenContent screen={screen} />
      </div>
      <Crenellation />
      <Toast />
      <NetworkModals />
      <Modal
        open={logoutPrompt} danger title="Sair da conta?"
        message="Você precisará entrar de novo para acessar suas mesas e fichas neste dispositivo."
        confirmLabel="Sair da conta" onConfirm={logout} onCancel={cancelLogout}
      />
      <Modal
        open={!!pendingScreen} danger title="Descartar alterações?"
        message={`${dirtyMessage ?? 'Você ainda não salvou.'} Se sair agora, as mudanças serão perdidas.`}
        cancelLabel="Continuar editando" confirmLabel="Descartar"
        onConfirm={confirmDiscard} onCancel={cancelDiscard}
      />
    </div>
  )
}
