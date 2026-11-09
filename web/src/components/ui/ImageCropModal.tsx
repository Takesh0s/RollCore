import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cropToDataUrl, type CropRegion } from '@/lib/image'

/** One place where the cropped image will show up; rendered exactly like the app does (cover, centered). */
export interface CropPreview {
  label: string
  /** width / height of the box where the image is shown */
  aspect: number
  circle?: boolean
  /** preview width in px (height follows the aspect) */
  width: number
}

interface Props {
  src: string
  title: string
  /** width / height of the crop frame (1 for round photos) */
  aspect: number
  circle?: boolean
  /** every format the image appears in */
  previews: CropPreview[]
  /** width in px of the saved image */
  outWidth: number
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

const MAX_ZOOM = 4

/**
 * Crop dialog: drag the photo, zoom with the slider (or mouse wheel) and see, live, how the result looks in
 * each place it is used. Saves a JPEG of just the chosen area.
 */
export function ImageCropModal({ src, title, aspect, circle, previews, outWidth, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [natural, setNatural] = useState({ w: 1, h: 1 })
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 })
  const [preview, setPreview] = useState<string>(src)
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; setNatural({ w: img.naturalWidth, h: img.naturalHeight }); setReady(true) }
    img.src = src
  }, [src])

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  /** Scale (frame px per source px) at the current zoom; zoom 1 makes the image just cover the frame. */
  const scale = useMemo(() => {
    if (!frame.w) return 1
    return Math.max(frame.w / natural.w, frame.h / natural.h) * zoom
  }, [frame, natural, zoom])

  const clamp = useCallback((c: { x: number; y: number }, s = scale) => {
    const hx = frame.w / (s * natural.w) / 2, hy = frame.h / (s * natural.h) / 2
    return { x: Math.min(1 - hx, Math.max(hx, c.x)), y: Math.min(1 - hy, Math.max(hy, c.y)) }
  }, [frame, natural, scale])

  const region: CropRegion = useMemo(() => {
    if (!frame.w) return { x: 0, y: 0, w: 1, h: 1 }
    const w = frame.w / (scale * natural.w), h = frame.h / (scale * natural.h)
    const c = clamp(center)
    return { x: c.x - w / 2, y: c.y - h / 2, w, h }
  }, [frame, natural, scale, center, clamp])

  // Live preview: the cropped result, shown in every box the way the app shows it.
  useEffect(() => {
    if (!ready || !imgRef.current || !frame.w) return
    const id = requestAnimationFrame(() => setPreview(cropToDataUrl(imgRef.current!, region, 480, aspect, 0.8)))
    return () => cancelAnimationFrame(id)
  }, [ready, region, aspect, frame.w])

  function changeZoom(z: number) {
    const next = Math.min(MAX_ZOOM, Math.max(1, z))
    const s = Math.max(frame.w / natural.w, frame.h / natural.h) * next
    setZoom(next)
    setCenter(c => clamp(c, s))
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, cx: clamp(center).x, cy: clamp(center).y }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    setCenter(clamp({
      x: d.cx - (e.clientX - d.px) / (scale * natural.w),
      y: d.cy - (e.clientY - d.py) / (scale * natural.h),
    }))
  }
  function onPointerUp() { drag.current = null }
  function onWheel(e: React.WheelEvent) { changeZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)) }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 0.02 / zoom
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = d[e.key]
    if (!m) return
    e.preventDefault()
    setCenter(c => clamp({ x: c.x + m[0], y: c.y + m[1] }))
  }

  function confirm() {
    if (!imgRef.current) return
    onConfirm(cropToDataUrl(imgRef.current, region, outWidth, aspect))
  }

  const c = clamp(center)
  const imgStyle: React.CSSProperties = ready && frame.w ? {
    width: natural.w * scale, height: natural.h * scale,
    left: frame.w / 2 - c.x * natural.w * scale, top: frame.h / 2 - c.y * natural.h * scale,
  } : { visibility: 'hidden' }

  return createPortal(
    <div className="modal-overlay crop-overlay" role="dialog" aria-modal="true" aria-label={title}
         onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="crop-modal">
        <h2 className="crop-title">{title}</h2>

        <div className="crop-body">
          <div className="crop-stage">
            <div
              ref={frameRef}
              className={`crop-frame${circle ? ' circle' : ''}`}
              style={{ aspectRatio: String(aspect) }}
              tabIndex={0}
              role="application"
              aria-label="Área de recorte: arraste para mover, use as setas do teclado"
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              onWheel={onWheel} onKeyDown={onKeyDown}
            >
              <img src={src} alt="" className="crop-img" style={imgStyle} draggable={false} />
            </div>
            <label className="crop-zoom">
              <span>Zoom</span>
              <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom}
                     onChange={e => changeZoom(Number(e.target.value))} aria-label="Zoom" />
            </label>
            <small className="field-hint">Arraste a imagem para posicionar.</small>
          </div>

          <div className="crop-previews">
            <span className="crop-previews-title">Como vai aparecer</span>
            {previews.map(p => (
              <figure key={p.label} className="crop-preview">
                <div className={`crop-preview-box${p.circle ? ' circle' : ''}`}
                     style={{ width: p.width, aspectRatio: String(p.aspect), backgroundImage: `url("${preview}")` }} />
                <figcaption>{p.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="crop-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={confirm} disabled={!ready}>Usar esta imagem</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Formats used by the app, so every upload shows the same set of previews. */
export const AVATAR_PREVIEWS: CropPreview[] = [
  { label: 'Perfil e ficha', aspect: 1, circle: true, width: 96 },
  { label: 'Listas', aspect: 1, circle: true, width: 52 },
  { label: 'Cabeçalho', aspect: 1, circle: true, width: 32 },
]
export const COVER_ASPECT = 2.5
export const COVER_PREVIEWS: CropPreview[] = [
  { label: 'Faixa na lista (celular)', aspect: 2.9, width: 232 },
  { label: 'Faixa na lista (computador)', aspect: 2.3, width: 232 },
  { label: 'Topo da mesa', aspect: 2.6, width: 232 },
]
