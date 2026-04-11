import { useAppStore } from '@/store/useAppStore'
import { Toast } from '@/components/ui/Toast'
import { LoginScreen }         from '@/components/auth/LoginScreen'
import { RegisterScreen }      from '@/components/auth/RegisterScreen'
import { DashboardScreen }     from '@/components/dashboard/DashboardScreen'
import { CharacterListScreen } from '@/components/characters/CharacterListScreen'
import { CharacterFormScreen } from '@/components/characters/CharacterFormScreen'
import { CharacterSheetScreen }from '@/components/characters/CharacterSheetScreen'
import { DiceRollerScreen }    from '@/components/dice/DiceRollerScreen'

export default function App() {
  const screen = useAppStore(s => s.screen)

  return (
    <div className="app-shell">
      {screen === 'login'              && <LoginScreen />}
      {screen === 'cadastro'           && <RegisterScreen />}
      {screen === 'dashboard'          && <DashboardScreen />}
      {screen === 'personagens'        && <CharacterListScreen />}
      {screen === 'novo-personagem'    && <CharacterFormScreen mode="new" />}
      {screen === 'editar-personagem'  && <CharacterFormScreen mode="edit" />}
      {screen === 'ficha'              && <CharacterSheetScreen />}
      {screen === 'dados'              && <DiceRollerScreen />}
      <Toast />
    </div>
  )
}
