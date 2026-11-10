/**
 * Mapas de batalha: tipos, catálogo de terrenos, geometria da grade (quadrada e hexagonal),
 * (de)serialização do que o mestre pinta e o desenho do mapa num canvas.
 *
 * A pintura é guardada como índices de células (`índice = linha * colunas + coluna`), não como pixels:
 * assim o JSON enviado ao servidor fica pequeno e vale para qualquer tamanho de tela.
 */

import { imageSrc } from './image'

export type GridType = 'SQUARE' | 'HEX'
export type MapKind = 'MEDIEVAL' | 'STEAMPUNK' | 'CYBERPUNK' | 'WESTERN' | 'PIRATE' | 'MODERN'

/** Tipos de mapa do assistente (Figma 09.4); `base` é a cor do chão de um mapa em branco. */
export const KINDS: { id: MapKind; label: string; base: string }[] = [
  { id: 'MEDIEVAL',  label: 'Medieval',  base: '#3b342b' },
  { id: 'STEAMPUNK', label: 'Steampunk', base: '#3d3029' },
  { id: 'CYBERPUNK', label: 'Cyberpunk', base: '#181531' },
  { id: 'WESTERN',   label: 'Faroeste',  base: '#4c3d28' },
  { id: 'PIRATE',    label: 'Pirata',    base: '#1f3b4b' },
  { id: 'MODERN',    label: 'Moderno',   base: '#33393d' },
]
export const kindLabel = (k: MapKind) => KINDS.find(x => x.id === k)?.label ?? k
const kindBase = (k: MapKind) => KINDS.find(x => x.id === k)?.base ?? '#33393d'

export const GRID_TYPES: { id: GridType; label: string; hint: string }[] = [
  { id: 'SQUARE', label: 'Quadrados', hint: 'Grade quadrada' },
  { id: 'HEX',    label: 'Hexágonos', hint: 'Grade hexagonal' },
]

/** Tamanhos prontos para um mapa em branco. */
export const SIZES = [
  { id: 'small',  label: 'Pequeno', cols: 20, rows: 15 },
  { id: 'medium', label: 'Médio',   cols: 30, rows: 22 },
  { id: 'large',  label: 'Grande',  cols: 40, rows: 30 },
] as const

export const MIN_CELLS = 5
export const MAX_CELLS = 100
export const DEFAULT_CELL = 48
export const MAX_NAME = 100

// ─── Terrenos ────────────────────────────────────────────────────────────────

export type TerrainGroup = 'liquids' | 'terrain' | 'relief' | 'general'

export const GROUPS: { id: TerrainGroup; label: string }[] = [
  { id: 'liquids', label: 'Líquidos' },
  { id: 'terrain', label: 'Terrenos' },
  { id: 'relief',  label: 'Relevo' },
  { id: 'general', label: 'Gerais' },
]

type Mark =
  | 'none' | 'waves' | 'dots' | 'blades' | 'cracks' | 'planks' | 'diamonds' | 'slashes' | 'hatch'
  | 'peak' | 'mound' | 'ring' | 'tree' | 'flame' | 'gem' | 'door' | 'steps' | 'rock' | 'cross'

export interface Terrain {
  id: string
  label: string
  group: TerrainGroup
  color: string
  mark: Mark
  /** Gerais: peças desenhadas por cima do terreno (árvore, porta…); só a parede preenche a célula toda. */
  fill?: boolean
}

export const TERRAINS: Terrain[] = [
  { id: 'water',    label: 'Água',        group: 'liquids', color: '#3b78b5', mark: 'waves' },
  { id: 'deep',     label: 'Água funda',  group: 'liquids', color: '#1f4a7a', mark: 'waves' },
  { id: 'lava',     label: 'Lava',        group: 'liquids', color: '#d1481b', mark: 'waves' },
  { id: 'swamp',    label: 'Pântano',     group: 'liquids', color: '#5b6b3a', mark: 'dots' },
  { id: 'ice',      label: 'Gelo',        group: 'liquids', color: '#a9dcec', mark: 'cross' },

  { id: 'grass',    label: 'Grama',       group: 'terrain', color: '#5c9a3b', mark: 'blades' },
  { id: 'stone',    label: 'Pedra',       group: 'terrain', color: '#7b7d80', mark: 'cracks' },
  { id: 'floor',    label: 'Piso',        group: 'terrain', color: '#8b6a45', mark: 'planks' },
  { id: 'dune',     label: 'Duna',        group: 'terrain', color: '#d9b46a', mark: 'waves' },
  { id: 'mud',      label: 'Lama',        group: 'terrain', color: '#6b4a2f', mark: 'dots' },
  { id: 'snow',     label: 'Neve',        group: 'terrain', color: '#e8eff4', mark: 'dots' },
  { id: 'crystal',  label: 'Cristal',     group: 'terrain', color: '#8f63cc', mark: 'diamonds' },
  { id: 'slope',    label: 'Declive',     group: 'terrain', color: '#a39270', mark: 'slashes' },

  { id: 'hill',     label: 'Colina',      group: 'relief',  color: '#8aa65a', mark: 'mound' },
  { id: 'mountain', label: 'Montanha',    group: 'relief',  color: '#7f858a', mark: 'peak' },
  { id: 'cliff',    label: 'Penhasco',    group: 'relief',  color: '#5e5348', mark: 'hatch' },
  { id: 'valley',   label: 'Vale',        group: 'relief',  color: '#4f6b45', mark: 'blades' },
  { id: 'crater',   label: 'Cratera',     group: 'relief',  color: '#5a4a4a', mark: 'ring' },
  { id: 'plateau',  label: 'Planalto',    group: 'relief',  color: '#b09a6e', mark: 'planks' },

  { id: 'wall',     label: 'Parede',      group: 'general', color: '#1d1d1f', mark: 'none',  fill: true },
  { id: 'door',     label: 'Porta',       group: 'general', color: '#9a6b34', mark: 'door' },
  { id: 'tree',     label: 'Árvore',      group: 'general', color: '#2f6b2f', mark: 'tree' },
  { id: 'rock',     label: 'Rocha',       group: 'general', color: '#8d9094', mark: 'rock' },
  { id: 'fire',     label: 'Fogueira',    group: 'general', color: '#e8762b', mark: 'flame' },
  { id: 'trap',     label: 'Armadilha',   group: 'general', color: '#d9534f', mark: 'cross' },
  { id: 'treasure', label: 'Tesouro',     group: 'general', color: '#e6b422', mark: 'gem' },
  { id: 'stairs',   label: 'Escada',      group: 'general', color: '#b8b2a6', mark: 'steps' },
]
const BY_ID = new Map(TERRAINS.map(t => [t.id, t]))
export const terrainOf = (id: string) => BY_ID.get(id)

// ─── Pintura (o que o mestre desenhou) ───────────────────────────────────────

export interface Painting {
  /** Líquidos, terrenos e relevo: um por célula. */
  base: Map<number, string>
  /** Peças "Gerais" por cima do terreno. */
  objects: Map<number, string>
  /** Células reveladas da névoa de guerra (o resto continua coberto). */
  fog: Set<number>
}

export const emptyPainting = (): Painting => ({ base: new Map(), objects: new Map(), fog: new Set() })

export const clonePainting = (p: Painting): Painting => ({
  base: new Map(p.base), objects: new Map(p.objects), fog: new Set(p.fog),
})

const group = (m: Map<number, string>) => {
  const out: Record<string, number[]> = {}
  m.forEach((id, idx) => { (out[id] ??= []).push(idx) })
  Object.values(out).forEach(l => l.sort((a, b) => a - b))
  return out
}

/** JSON enviado ao servidor: `{ cells: {terreno: [índices]}, objects: {peça: [índices]}, fog: [índices] }`. */
export function encodeLayers(p: Painting): string {
  return JSON.stringify({ cells: group(p.base), objects: group(p.objects), fog: [...p.fog].sort((a, b) => a - b) })
}

/** Lê o JSON do servidor; ignora o que não entende e o que cai fora da grade. */
export function decodeLayers(raw: string | null | undefined, cols: number, rows: number): Painting {
  const out = emptyPainting()
  if (!raw) return out
  let doc: any
  try { doc = JSON.parse(raw) } catch { return out }
  if (!doc || typeof doc !== 'object') return out
  const total = cols * rows
  const ok = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < total
  const read = (src: any, into: Map<number, string>) => {
    if (!src || typeof src !== 'object') return
    for (const [id, list] of Object.entries(src)) {
      if (!BY_ID.has(id) || !Array.isArray(list)) continue
      for (const n of list) if (ok(n)) into.set(n, id)
    }
  }
  read(doc.cells, out.base)
  read(doc.objects, out.objects)
  if (Array.isArray(doc.fog)) for (const n of doc.fog) if (ok(n)) out.fog.add(n)
  return out
}

// ─── Geometria ───────────────────────────────────────────────────────────────

export interface Grid { type: GridType; cols: number; rows: number; cell: number }

const SQRT3 = Math.sqrt(3)
/** Hexágonos "pointy-top", linhas ímpares deslocadas meia célula; `cell` é a largura (face a face). */
const hexSize = (cell: number) => cell / SQRT3

export function mapSize(g: Grid): { w: number; h: number } {
  if (g.type === 'SQUARE') return { w: g.cols * g.cell, h: g.rows * g.cell }
  const s = hexSize(g.cell)
  return { w: g.cols * g.cell + g.cell / 2, h: (g.rows - 1) * 1.5 * s + 2 * s }
}

export function cellCenter(g: Grid, idx: number): { x: number; y: number } {
  const col = idx % g.cols, row = Math.floor(idx / g.cols)
  if (g.type === 'SQUARE') return { x: col * g.cell + g.cell / 2, y: row * g.cell + g.cell / 2 }
  const s = hexSize(g.cell)
  return { x: col * g.cell + g.cell / 2 + (row & 1 ? g.cell / 2 : 0), y: s + row * 1.5 * s }
}

/** Índice da célula sob o ponto (x, y) do mapa, ou -1 fora da grade. */
export function cellAt(g: Grid, x: number, y: number): number {
  if (g.type === 'SQUARE') {
    const col = Math.floor(x / g.cell), row = Math.floor(y / g.cell)
    return col < 0 || row < 0 || col >= g.cols || row >= g.rows ? -1 : row * g.cols + col
  }
  const s = hexSize(g.cell)
  // a origem dos eixos hexagonais é o centro da célula (0, 0)
  const px = x - g.cell / 2, py = y - s
  const q = (SQRT3 / 3 * px - py / 3) / s
  const r = (2 / 3 * py) / s
  // arredondamento de coordenadas cúbicas
  let cx = Math.round(q), cz = Math.round(r), cy = Math.round(-q - r)
  const dx = Math.abs(cx - q), dy = Math.abs(cy - (-q - r)), dz = Math.abs(cz - r)
  if (dx > dy && dx > dz) cx = -cy - cz
  else if (dy > dz) cy = -cx - cz
  else cz = -cx - cy
  const row = cz
  const col = cx + (cz - (((cz % 2) + 2) % 2)) / 2
  return col < 0 || row < 0 || col >= g.cols || row >= g.rows ? -1 : row * g.cols + col
}

/** Cantos da célula (quadrado ou hexágono), em coordenadas do mapa. */
export function cellCorners(g: Grid, idx: number): [number, number][] {
  const { x, y } = cellCenter(g, idx)
  if (g.type === 'SQUARE') {
    const h = g.cell / 2
    return [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]]
  }
  const s = hexSize(g.cell)
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30)
    return [x + s * Math.cos(a), y + s * Math.sin(a)] as [number, number]
  })
}

/** Células cujo centro está a até `(tamanho - 0,5)` células do centro da célula `center` (pincel 1 = só ela). */
export function cellsInBrush(g: Grid, center: number, size: number): number[] {
  if (center < 0) return []
  if (size <= 1) return [center]
  const c = cellCenter(g, center)
  const reach = (size - 0.5) * g.cell
  const col = center % g.cols, row = Math.floor(center / g.cols)
  const out: number[] = []
  for (let r = Math.max(0, row - size); r <= Math.min(g.rows - 1, row + size); r++) {
    for (let k = Math.max(0, col - size); k <= Math.min(g.cols - 1, col + size); k++) {
      const idx = r * g.cols + k
      const p = cellCenter(g, idx)
      if (Math.hypot(p.x - c.x, p.y - c.y) <= reach + 0.001) out.push(idx)
    }
  }
  return out
}

// ─── Desenho ─────────────────────────────────────────────────────────────────

export interface DrawOptions {
  grid: Grid
  kind: MapKind
  img: HTMLImageElement | null
  paint: Painting
  showGrid: boolean
  fogEnabled: boolean
  /** `edit`: a névoa só escurece (o mestre enxerga tudo); `play`: névoa quase opaca, como os jogadores veriam. */
  fogView: 'edit' | 'play'
}

function tracePath(ctx: CanvasRenderingContext2D, g: Grid, idx: number) {
  const pts = cellCorners(g, idx)
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

function drawMark(ctx: CanvasRenderingContext2D, t: Terrain, cx: number, cy: number, cell: number) {
  const u = cell / 10
  ctx.save()
  ctx.lineWidth = Math.max(1, u * 0.45)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const light = 'rgba(255,255,255,0.55)', dark = 'rgba(0,0,0,0.38)'
  switch (t.mark) {
    case 'waves':
      ctx.strokeStyle = light
      for (const dy of [-1.6, 1.6]) {
        ctx.beginPath()
        ctx.moveTo(cx - 3 * u, cy + dy * u)
        ctx.quadraticCurveTo(cx - 1.5 * u, cy + (dy - 1.3) * u, cx, cy + dy * u)
        ctx.quadraticCurveTo(cx + 1.5 * u, cy + (dy + 1.3) * u, cx + 3 * u, cy + dy * u)
        ctx.stroke()
      }
      break
    case 'dots':
      ctx.fillStyle = t.id === 'snow' ? 'rgba(120,150,170,0.55)' : dark
      for (const [dx, dy] of [[-2, -1.5], [1.5, -2], [0, 1.8], [-2.2, 2.2], [2.6, 1.2]]) {
        ctx.beginPath(); ctx.arc(cx + dx * u, cy + dy * u, u * 0.5, 0, Math.PI * 2); ctx.fill()
      }
      break
    case 'blades':
      ctx.strokeStyle = dark
      for (const dx of [-2.4, 0, 2.4]) {
        ctx.beginPath(); ctx.moveTo(cx + dx * u, cy + 2 * u); ctx.lineTo(cx + (dx + 0.5) * u, cy - 1.8 * u); ctx.stroke()
      }
      break
    case 'cracks':
      ctx.strokeStyle = dark
      ctx.beginPath()
      ctx.moveTo(cx - 3 * u, cy - 1 * u); ctx.lineTo(cx - 0.5 * u, cy + 0.5 * u); ctx.lineTo(cx + 0.5 * u, cy - 1.5 * u); ctx.lineTo(cx + 3 * u, cy + 1 * u)
      ctx.stroke()
      break
    case 'planks':
      ctx.strokeStyle = dark
      for (const dy of [-1.8, 1.8]) { ctx.beginPath(); ctx.moveTo(cx - 3.4 * u, cy + dy * u); ctx.lineTo(cx + 3.4 * u, cy + dy * u); ctx.stroke() }
      break
    case 'diamonds':
      ctx.strokeStyle = light
      ctx.beginPath(); ctx.moveTo(cx, cy - 2.8 * u); ctx.lineTo(cx + 2 * u, cy); ctx.lineTo(cx, cy + 2.8 * u); ctx.lineTo(cx - 2 * u, cy); ctx.closePath(); ctx.stroke()
      break
    case 'slashes':
      ctx.strokeStyle = dark
      for (const dx of [-2.6, 0, 2.6]) { ctx.beginPath(); ctx.moveTo(cx + (dx - 1) * u, cy + 2.4 * u); ctx.lineTo(cx + (dx + 1) * u, cy - 2.4 * u); ctx.stroke() }
      break
    case 'hatch':
      ctx.strokeStyle = dark
      for (const d of [-2, 0, 2]) {
        ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy + (d - 1) * u); ctx.lineTo(cx + 3 * u, cy + (d + 1) * u); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy + (d + 1) * u); ctx.lineTo(cx + 3 * u, cy + (d - 1) * u); ctx.stroke()
      }
      break
    case 'peak':
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.strokeStyle = dark
      ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy + 2.6 * u); ctx.lineTo(cx, cy - 3 * u); ctx.lineTo(cx + 3 * u, cy + 2.6 * u); ctx.closePath(); ctx.fill(); ctx.stroke()
      break
    case 'mound':
      ctx.strokeStyle = dark
      ctx.beginPath(); ctx.arc(cx, cy + 1.6 * u, 3 * u, Math.PI, 0); ctx.stroke()
      break
    case 'ring':
      ctx.strokeStyle = light
      ctx.beginPath(); ctx.arc(cx, cy, 2.6 * u, 0, Math.PI * 2); ctx.stroke()
      break
    case 'cross':
      ctx.strokeStyle = t.group === 'general' ? t.color : light
      ctx.lineWidth = Math.max(1.5, u * 0.9)
      ctx.beginPath(); ctx.moveTo(cx - 2.6 * u, cy - 2.6 * u); ctx.lineTo(cx + 2.6 * u, cy + 2.6 * u); ctx.moveTo(cx + 2.6 * u, cy - 2.6 * u); ctx.lineTo(cx - 2.6 * u, cy + 2.6 * u); ctx.stroke()
      break
    case 'tree':
      ctx.fillStyle = t.color; ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath(); ctx.arc(cx, cy, 3.8 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = 'rgba(160,220,120,0.5)'
      ctx.beginPath(); ctx.arc(cx - 1 * u, cy - 1 * u, 1.8 * u, 0, Math.PI * 2); ctx.fill()
      break
    case 'flame':
      ctx.fillStyle = t.color; ctx.strokeStyle = 'rgba(0,0,0,0.45)'
      ctx.beginPath(); ctx.arc(cx, cy, 3 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#ffd54f'
      ctx.beginPath(); ctx.arc(cx, cy, 1.4 * u, 0, Math.PI * 2); ctx.fill()
      break
    case 'gem':
      ctx.fillStyle = t.color; ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath(); ctx.moveTo(cx, cy - 3.4 * u); ctx.lineTo(cx + 3 * u, cy); ctx.lineTo(cx, cy + 3.4 * u); ctx.lineTo(cx - 3 * u, cy); ctx.closePath(); ctx.fill(); ctx.stroke()
      break
    case 'door':
      ctx.fillStyle = t.color; ctx.strokeStyle = 'rgba(0,0,0,0.55)'
      ctx.beginPath(); ctx.rect(cx - 3.4 * u, cy - 1.8 * u, 6.8 * u, 3.6 * u); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#f2d98d'
      ctx.beginPath(); ctx.arc(cx + 2 * u, cy, 0.5 * u, 0, Math.PI * 2); ctx.fill()
      break
    case 'steps':
      ctx.strokeStyle = t.color; ctx.lineWidth = Math.max(1.5, u * 0.7)
      for (const dy of [-2.4, 0, 2.4]) { ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy + dy * u); ctx.lineTo(cx + 3 * u, cy + dy * u); ctx.stroke() }
      break
    case 'rock':
      ctx.fillStyle = t.color; ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath(); ctx.moveTo(cx - 3.4 * u, cy + 2 * u); ctx.lineTo(cx - 2 * u, cy - 2.4 * u); ctx.lineTo(cx + 1.6 * u, cy - 3 * u); ctx.lineTo(cx + 3.4 * u, cy + 0.6 * u); ctx.lineTo(cx + 1 * u, cy + 3 * u); ctx.closePath(); ctx.fill(); ctx.stroke()
      break
    default:
      break
  }
  ctx.restore()
}

/** Desenha o mapa inteiro em coordenadas lógicas (0..largura, 0..altura); o canvas já deve estar escalado. */
export function drawMap(ctx: CanvasRenderingContext2D, o: DrawOptions) {
  const { grid: g, paint } = o
  const { w, h } = mapSize(g)
  const hasImage = !!o.img && o.img.complete && o.img.naturalWidth > 0

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = kindBase(o.kind)
  ctx.fillRect(0, 0, w, h)
  if (hasImage) ctx.drawImage(o.img as HTMLImageElement, 0, 0, w, h)

  const marks = g.cell >= 20
  const baseAlpha = hasImage ? 0.78 : 1
  paint.base.forEach((id, idx) => {
    const t = BY_ID.get(id)
    if (!t) return
    ctx.globalAlpha = baseAlpha
    ctx.fillStyle = t.color
    tracePath(ctx, g, idx)
    ctx.fill()
    ctx.globalAlpha = 1
    if (marks) { const c = cellCenter(g, idx); drawMark(ctx, t, c.x, c.y, g.cell) }
  })
  paint.objects.forEach((id, idx) => {
    const t = BY_ID.get(id)
    if (!t) return
    if (t.fill) { ctx.fillStyle = t.color; tracePath(ctx, g, idx); ctx.fill() }
    else if (marks) { const c = cellCenter(g, idx); drawMark(ctx, t, c.x, c.y, g.cell) }
    else { const c = cellCenter(g, idx); ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(c.x, c.y, g.cell * 0.3, 0, Math.PI * 2); ctx.fill() }
  })

  if (o.showGrid) {
    ctx.strokeStyle = hasImage ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    if (g.type === 'SQUARE') {
      ctx.beginPath()
      for (let c = 0; c <= g.cols; c++) { ctx.moveTo(c * g.cell, 0); ctx.lineTo(c * g.cell, h) }
      for (let r = 0; r <= g.rows; r++) { ctx.moveTo(0, r * g.cell); ctx.lineTo(w, r * g.cell) }
      ctx.stroke()
    } else {
      for (let i = 0; i < g.cols * g.rows; i++) { tracePath(ctx, g, i); ctx.stroke() }
    }
  }

  if (o.fogEnabled) {
    ctx.fillStyle = o.fogView === 'play' ? 'rgba(6,8,12,0.96)' : 'rgba(6,8,12,0.55)'
    for (let i = 0; i < g.cols * g.rows; i++) {
      if (paint.fog.has(i)) continue
      tracePath(ctx, g, i)
      ctx.fill()
    }
  }
}

/** Dimensiona o canvas (no máximo `maxSide` px no lado maior) e desenha o mapa nele. */
export function renderMap(canvas: HTMLCanvasElement, o: DrawOptions, maxSide = 4096) {
  const { w, h } = mapSize(o.grid)
  const scale = Math.min(1, maxSide / Math.max(w, h))
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawMap(ctx, o)
}

// ─── Imagem de fundo ─────────────────────────────────────────────────────────

const MAX_IMAGE_SIDE = 2400
const MAX_IMAGE_BYTES = 1_900_000

export interface PreparedImage { dataUrl: string; width: number; height: number }

const readAsDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result))
  r.onerror = () => reject(new Error('read'))
  r.readAsDataURL(blob)
})

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error('decode'))
  img.src = src
})

/**
 * Prepara a imagem escolhida para virar fundo: o servidor aceita até 2 MB, então imagens grandes são
 * reduzidas (lado maior de 2400 px) e regravadas como JPEG com a qualidade que couber.
 * Devolve `null` quando o arquivo não é uma imagem que o navegador consiga abrir.
 */
export async function prepareMapImage(file: File): Promise<PreparedImage | null> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return null
  try {
    const original = await readAsDataUrl(file)
    const img = await loadImage(original)
    const side = Math.max(img.naturalWidth, img.naturalHeight)
    if (file.size <= MAX_IMAGE_BYTES && side <= MAX_IMAGE_SIDE) {
      return { dataUrl: original, width: img.naturalWidth, height: img.naturalHeight }
    }
    const scale = Math.min(1, MAX_IMAGE_SIDE / side)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    for (const q of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', q))
      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        return { dataUrl: await readAsDataUrl(blob), width: canvas.width, height: canvas.height }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Colunas, linhas e tamanho da célula que cobrem uma imagem com `cols` colunas. */
export function gridForImage(width: number, height: number, cols: number): { cols: number; rows: number; cellSize: number } {
  const c = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(cols)))
  const cellSize = Math.min(128, Math.max(16, Math.round(width / c)))
  const rows = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(height / cellSize)))
  return { cols: c, rows, cellSize }
}

// ─── Exportar ────────────────────────────────────────────────────────────────

/** Baixa o mapa como PNG (sem névoa). Devolve false se o navegador não conseguir gerar o arquivo. */
export async function exportMapPng(o: Omit<DrawOptions, 'img' | 'fogEnabled' | 'fogView'> & { imageUrl: string | null; name: string }): Promise<boolean> {
  try {
    let img: HTMLImageElement | null = null
    const src = imageSrc(o.imageUrl)
    if (src) {
      img = new Image()
      img.crossOrigin = 'anonymous'
      const el = img
      await new Promise<void>((resolve, reject) => { el.onload = () => resolve(); el.onerror = () => reject(new Error('img')); el.src = src })
    }
    const canvas = document.createElement('canvas')
    renderMap(canvas, { grid: o.grid, kind: o.kind, img, paint: o.paint, showGrid: o.showGrid, fogEnabled: false, fogView: 'edit' }, 4096)
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
    if (!blob) return false
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${o.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'mapa'}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    return true
  } catch {
    return false
  }
}

/** Amostra de um terreno (paleta do editor): o mesmo desenho do mapa, numa célula quadrada de `size` px. */
export function drawTerrainSample(ctx: CanvasRenderingContext2D, t: Terrain, size: number) {
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = t.group === 'general' && !t.fill ? 'rgba(255,255,255,0.08)' : t.fill ? t.color : t.color
  ctx.fillRect(0, 0, size, size)
  drawMark(ctx, t, size / 2, size / 2, size * 0.9)
}
