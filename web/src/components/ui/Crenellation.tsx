import { useEffect, useState } from 'react'

const TOOTH = 64   // largura do dente (Figma)
const GAP   = 64   // vão mínimo entre dentes

/** Quantos dentes cabem deixando vão em AMBAS as pontas (início e fim escuros). */
const countFor = (width: number) => Math.max(1, Math.floor((width - GAP) / (TOOTH + GAP)))

/**
 * Faixa de dentes (estandarte) na base da janela, só no layout de computador.
 * Os dentes têm sempre 64 px e a faixa distribui o espaço restante por igual
 * (`space-evenly`): começa com vão, termina com vão e todos os vãos são iguais.
 * Em 1728 px de largura são 13 dentes e vãos de exatamente 64 px, como no Figma.
 */
export function Crenellation() {
  const [n, setN] = useState(() => countFor(window.innerWidth))
  useEffect(() => {
    const onResize = () => setN(countFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return (
    <div className="crenellation" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} />)}
    </div>
  )
}
