import { useEffect, useRef, useState } from 'react'
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
    default:                  return null
  }
}

/**
 * Root component — wraps every screen transition in a CSS fade so
 * navigating between screens feels fluid rather than a hard cut.
 *
 * Technique: keep the PREVIOUS screen visible while fading it out,
 * then swap in the new screen fading in. Total animation: 200ms each.
 * No routing library needed — the screen key from Zustand drives everything.
 */
export default function App() {
  const screen = useAppStore(s => s.screen)

  // Which screen is currently rendered in the DOM
  const [displayed, setDisplayed] = useState<Screen>(screen)
  // Controls the opacity class
  const [fading, setFading]       = useState(false)
  const pendingRef = useRef<Screen>(screen)

  useEffect(() => {
    if (screen === displayed) return

    pendingRef.current = screen

    // 1. Fade out the current screen
    setFading(true)

    const timer = setTimeout(() => {
      // 2. Swap content while invisible
      setDisplayed(pendingRef.current)
      // 3. Fade back in (removing the class triggers the in-transition)
      setFading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [screen, displayed])

  return (
    <div className="app-shell">
      <div className={`screen-wrap${fading ? ' screen-out' : ''}`}>
        <ScreenContent screen={displayed} />
      </div>
      <Toast />
    </div>
  )
}
