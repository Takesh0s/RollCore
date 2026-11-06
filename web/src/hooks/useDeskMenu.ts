import { useSyncExternalStore } from 'react'

const KEY = 'rollcore_desk_menu'

function read(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

let open = read()
const subs = new Set<() => void>()

/** O CSS lê `html[data-desk-menu]` para abrir espaço para o menu (layout de computador). */
function apply() { document.documentElement.dataset.deskMenu = open ? 'open' : 'closed' }
apply()

export function setDeskMenu(value: boolean) {
  open = value
  try { localStorage.setItem(KEY, value ? '1' : '0') } catch { /* modo privado: só não lembra */ }
  apply()
  subs.forEach(fn => fn())
}

/**
 * Estado do menu lateral no computador. Fica aberto ou fechado até a pessoa
 * alternar no hambúrguer, inclusive ao trocar de tela, e é lembrado entre visitas.
 */
export function useDeskMenu() {
  const isOpen = useSyncExternalStore(
    fn => { subs.add(fn); return () => { subs.delete(fn) } },
    () => open,
  )
  return [isOpen, setDeskMenu] as const
}
