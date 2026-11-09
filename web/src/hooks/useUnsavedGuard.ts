import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

/**
 * Avisa antes de sair de um formulário com alterações não salvas (Figma 25.5).
 * Enquanto `dirty` for verdadeiro, qualquer `navigate` abre "Descartar alterações?" em vez de trocar de tela.
 * Ao salvar, chame `useAppStore.getState().setDirty(null)` antes de navegar.
 */
export function useUnsavedGuard(dirty: boolean, message: string) {
  const setDirty = useAppStore(s => s.setDirty)
  useEffect(() => { setDirty(dirty ? message : null) }, [dirty, message, setDirty])
  useEffect(() => () => setDirty(null), [setDirty])
}
