import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { QuickSearchModal } from './QuickSearchModal'
import { QuickRollModal } from './QuickRollModal'

/** Abre a busca rápida (Ctrl K ou o campo do cabeçalho) e a rolagem rápida; só para quem está logado. */
export function QuickActions() {
  const logged = useAppStore(s => s.user.isLogged)
  const [mode, setMode] = useState<'none' | 'search' | 'roll'>('none')

  useEffect(() => {
    if (!logged) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setMode(m => (m === 'search' ? 'none' : 'search')) }
    }
    const onOpen = () => setMode('search')
    window.addEventListener('keydown', onKey)
    window.addEventListener('rollcore:quick-search', onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('rollcore:quick-search', onOpen) }
  }, [logged])

  if (!logged) return null
  return (
    <>
      {mode === 'search' && <QuickSearchModal onClose={() => setMode('none')} onRoll={() => setMode('roll')} />}
      {mode === 'roll' && <QuickRollModal onClose={() => setMode('none')} />}
    </>
  )
}
