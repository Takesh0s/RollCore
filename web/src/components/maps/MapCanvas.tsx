import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { imageSrc } from '@/lib/image'
import {
  cellAt, cellCorners, cellsInBrush, mapSize, renderMap,
  type Grid, type MapKind, type Painting,
} from '@/lib/maps'

/** Carrega a imagem de fundo (a API serve `/images/{id}` com CORS, então o canvas pode ser exportado). */
export function useMapImage(url: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const src = imageSrc(url)
    if (!src) { setImg(null); return }
    let alive = true
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => { if (alive) setImg(el) }
    el.onerror = () => { if (alive) setImg(null) }
    el.src = src
    return () => { alive = false }
  }, [url])
  return img
}

export interface StrokeEvent { phase: 'start' | 'move' | 'end'; cells: number[] }

interface Props {
  grid: Grid
  kind: MapKind
  imageUrl: string | null
  paint: Painting
  /** Muda a cada alteração da pintura, para redesenhar (a pintura é mutável). */
  rev: number
  showGrid: boolean
  fogEnabled: boolean
  fogView?: 'edit' | 'play'
  /** Tamanho do pincel em células; com `onStroke` o canvas vira uma área de pintura. */
  brush?: number
  onStroke?: (e: StrokeEvent) => void
  /** 1 = cabe na largura; maiores ampliam e a área rola. */
  zoom?: number
  label: string
  maxSide?: number
}

/**
 * O mapa num canvas. Só leitura por padrão (miniaturas, visualização); com `onStroke` o arrastar do
 * ponteiro entrega as células sob o pincel, já preenchendo os saltos de movimentos rápidos.
 */
export function MapCanvas({ grid, kind, imageUrl, paint, rev, showGrid, fogEnabled, fogView = 'edit', brush = 1, onStroke, zoom = 1, label, maxSide }: Props) {
  const img = useMapImage(imageUrl)
  const main = useRef<HTMLCanvasElement>(null)
  const over = useRef<HTMLCanvasElement>(null)
  const down = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const { w, h } = mapSize(grid)

  useLayoutEffect(() => {
    if (!main.current) return
    renderMap(main.current, { grid, kind, img, paint, showGrid, fogEnabled, fogView }, maxSide)
    if (over.current) { over.current.width = main.current.width; over.current.height = main.current.height }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.type, grid.cols, grid.rows, grid.cell, kind, img, showGrid, fogEnabled, fogView, rev, maxSide])

  const toMap = (e: RPointerEvent) => {
    const r = main.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h }
  }

  /** Células sob o pincel, incluindo as do caminho desde o último ponto. */
  const cellsAlong = (to: { x: number; y: number }, from: { x: number; y: number } | null) => {
    const found = new Set<number>()
    const steps = from ? Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (grid.cell / 2))) : 1
    for (let i = 1; i <= steps; i++) {
      const p = from ? { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps } : to
      cellsInBrush(grid, cellAt(grid, p.x, p.y), brush).forEach(c => found.add(c))
    }
    return [...found]
  }

  const drawHover = (p: { x: number; y: number } | null) => {
    const c = over.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    if (!p || !onStroke) return
    const s = c.width / w
    ctx.setTransform(s, 0, 0, s, 0, 0)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = Math.max(1.5, 2 / s)
    for (const idx of cellsInBrush(grid, cellAt(grid, p.x, p.y), brush)) {
      const pts = cellCorners(grid, idx)
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  function onDown(e: RPointerEvent<HTMLDivElement>) {
    if (!onStroke || e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    down.current = true
    const p = toMap(e)
    last.current = p
    onStroke({ phase: 'start', cells: cellsAlong(p, null) })
  }
  function onMove(e: RPointerEvent<HTMLDivElement>) {
    if (!onStroke) return
    const p = toMap(e)
    drawHover(p)
    if (!down.current) return
    onStroke({ phase: 'move', cells: cellsAlong(p, last.current) })
    last.current = p
  }
  function onUp() {
    if (!down.current) return
    down.current = false
    last.current = null
    onStroke?.({ phase: 'end', cells: [] })
  }

  return (
    <div
      className={`map-canvas${onStroke ? ' paintable' : ''}`}
      style={{ width: `${Math.max(1, zoom) * 100}%`, aspectRatio: `${w} / ${h}` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => { drawHover(null); if (!down.current) last.current = null }}
    >
      <canvas ref={main} role="img" aria-label={label} />
      {onStroke && <canvas ref={over} className="map-hover" aria-hidden="true" />}
    </div>
  )
}

/** Miniatura estática de um mapa (cartões da biblioteca e da Oficina). */
export function MapThumb({ grid, kind, imageUrl, paint, fogEnabled, label }: {
  grid: Grid; kind: MapKind; imageUrl: string | null; paint: Painting; fogEnabled: boolean; label: string
}) {
  return (
    <div className="map-thumb">
      <MapCanvas grid={grid} kind={kind} imageUrl={imageUrl} paint={paint} rev={0}
                 showGrid={false} fogEnabled={fogEnabled} fogView="edit" label={label} maxSide={640} />
    </div>
  )
}
