import { useEffect, useState } from 'react'

const QUERY = '(min-width: 1024px)'

/** true quando a janela é larga o bastante para o layout de computador (sidebar fixa). */
export function useDesktop(): boolean {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return match
}
