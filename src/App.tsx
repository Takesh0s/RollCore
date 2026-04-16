import { useAppStore } from '@/store/useAppStore'
import { Toast }                from '@/components/ui/Toast'
import { LoginScreen }          from '@/components/auth/LoginScreen'
import { RegisterScreen }       from '@/components/auth/RegisterScreen'
import { ForgotPasswordScreen } from '@/components/auth/ForgotPasswordScreen'
import { ProfileScreen }        from '@/components/auth/ProfileScreen'
import { DashboardScreen }      from '@/components/dashboard/DashboardScreen'
import { CharacterListScreen }  from '@/components/characters/CharacterListScreen'
import { CharacterFormScreen }  from '@/components/characters/CharacterFormScreen'
import { CharacterSheetScreen } from '@/components/characters/CharacterSheetScreen'
import { DiceRollerScreen }     from '@/components/dice/DiceRollerScreen'

/**
 * Root component. Acts as the client-side router — reads the current screen
 * from the global Zustand store and renders the matching component.
 * No routing library is needed because the app is a single-page prototype
 * without deep-linking requirements.
 */
export default function App() {
  const screen = useAppStore(s => s.screen)
  return (
    <div className="app-shell">
      {screen === 'login'             && <LoginScreen />}
      {screen === 'cadastro'          && <RegisterScreen />}
      {screen === 'esqueci-senha'     && <ForgotPasswordScreen />}
      {screen === 'perfil'            && <ProfileScreen />}
      {screen === 'dashboard'         && <DashboardScreen />}
      {screen === 'personagens'       && <CharacterListScreen />}
      {screen === 'novo-personagem'   && <CharacterFormScreen mode="new" />}
      {screen === 'editar-personagem' && <CharacterFormScreen mode="edit" />}
      {screen === 'ficha'             && <CharacterSheetScreen />}
      {screen === 'dados'             && <DiceRollerScreen />}
      <Toast />
    </div>
  )
}