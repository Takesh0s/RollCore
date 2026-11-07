import { useEffect, useRef, useState } from 'react'
import { DiceLogo } from '@/components/ui/DiceLogo'
import type { DiceScene, Colors } from './dice3d/scene'

interface Props {
  /** Tipo de dado exibido quando não há rolagem em curso. */
  sides: number
  /** true enquanto espera o servidor responder: o dado gira sem parar. */
  rolling: boolean
  /** Última rolagem (vem do servidor). `id` muda a cada rolagem nova. */
  result: { id: number; sides: number; rolls: number[]; total: number; tone: 'crit' | 'fail' | '' } | null
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Cores do dado a partir do tema ativo (variáveis CSS), para acompanhar a paleta do usuário. */
function themeColors(el: HTMLElement): Colors {
  const css = getComputedStyle(el)
  const get = (v: string, fb: string) => css.getPropertyValue(v).trim() || fb
  return { body: get('--card', '#2c3438'), edge: get('--sapphire', '#8fb4d4'), label: get('--sapphire', '#8fb4d4') }
}

/**
 * Dado 3D da última rolagem. O número vem do servidor: o dado gira enquanto a resposta não
 * chega e depois pousa com a face sorteada para cima; o total aparece por cima do dado.
 * Sem WebGL (ou se o carregamento falhar), mostra o logo estático e só o número.
 */
export function DiceStage({ sides, rolling, result }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<DiceScene | null>(null)
  const seen = useRef<number | null>(null)     // id da rolagem já mostrada
  const started = useRef(false)                // primeira vez que o dado ficou pronto
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [settled, setSettled] = useState(true) // número visível (dado já pousou)

  // Carrega o three.js só quando a tela de Dados abre (chunk separado).
  useEffect(() => {
    let alive = true
    import('./dice3d/scene').then(({ DiceScene }) => {
      if (!alive || !canvas.current || !box.current) return
      try {
        const s = new DiceScene(canvas.current, themeColors(box.current), prefersReduced())
        const fit = () => { const r = box.current!.getBoundingClientRect(); s.resize(Math.max(1, r.width), Math.max(1, r.height)) }
        scene.current = s; fit(); setReady(true)
        const ro = new ResizeObserver(fit); ro.observe(box.current)
        ;(s as unknown as { _ro: ResizeObserver })._ro = ro
      } catch { setFailed(true) }
    }).catch(() => setFailed(true))
    return () => {
      alive = false
      const s = scene.current as (DiceScene & { _ro?: ResizeObserver }) | null
      s?._ro?.disconnect(); s?.dispose(); scene.current = null
    }
  }, [])

  // Atualiza as cores quando o tema muda.
  useEffect(() => {
    if (!ready || !box.current) return
    const root = document.documentElement
    const mo = new MutationObserver(() => scene.current?.setColors(themeColors(box.current!)))
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-mode', 'style'] })
    return () => mo.disconnect()
  }, [ready])

  // Dado parado conforme o tipo escolhido; ao abrir a tela já mostra a última rolagem (sem animar).
  useEffect(() => {
    if (!ready || rolling) return
    const s = scene.current!
    if (!started.current) {
      started.current = true
      if (result) { s.setSides(result.sides); s.showValue(result.rolls[result.rolls.length - 1]); seen.current = result.id; return }
    }
    if (result && seen.current === result.id) return
    if (!result || seen.current === null || seen.current === result.id) s.setSides(sides)
  }, [ready, sides, rolling, result])

  // Gira enquanto o servidor responde.
  useEffect(() => {
    if (!ready || !rolling) return
    setSettled(false)
    const s = scene.current!
    s.setSides(sides, true); s.startTumble()
  }, [ready, rolling, sides])

  // Resultado chegou: pousa na face sorteada.
  useEffect(() => {
    if (!ready || rolling || !result || seen.current === result.id) return
    const s = scene.current!
    seen.current = result.id
    s.setSides(result.sides)
    const rolls = result.rolls
    const per = rolls.length <= 1 ? 900 : rolls.length <= 4 ? 600 : 320
    setSettled(false)
    let i = 0
    const next = () => {
      s.landOn(rolls[i], per, () => {
        i += 1
        if (i < rolls.length) setTimeout(next, 120); else setSettled(true)
      })
    }
    next()
  }, [ready, rolling, result])

  // Os números ficam nas faces do dado. O total só aparece à parte quando difere da face
  // (bônus, vários dados ou d100, que usa dois dados).
  const showTotal = !!result && (settled || failed || !ready) &&
    (result.sides === 100 || result.rolls.length > 1 || result.total !== result.rolls[0])
  return (
    <>
      <div className="dice-stage" ref={box}>
        {!failed && <canvas ref={canvas} className={`dice-stage-canvas${ready ? ' on' : ''}`} aria-hidden="true" />}
        {(!ready || failed) && <DiceLogo className="dice-stage-die" />}
        {failed && result && <div className={`dice-last-num ${result.tone}`}>{result.total}</div>}
      </div>
      {showTotal && result && (
        <p key={result.id} className={`dice-stage-total roll-anim ${result.tone}`} aria-label={`Total ${result.total}`}>
          <span>Total</span> {result.total}
        </p>
      )}
    </>
  )
}
