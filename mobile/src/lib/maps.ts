/**
 * Mapas de batalha: tipos, catálogo de terrenos, geometria da grade (quadrada e hexagonal),
 * (de)serialização do que o mestre pinta e o desenho do mapa em SVG.
 *
 * A pintura é guardada como índices de células (`índice = linha * colunas + coluna`), não como pixels:
 * assim o JSON enviado ao servidor fica pequeno e vale para qualquer tamanho de tela.
 */

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

// ─── Desenho (SVG) ───────────────────────────────────────────────────────────

/** Um traço do SVG: `d` junta todas as células que compartilham o mesmo estilo. */
export interface Shape { key: string; d: string; fill?: string; stroke?: string; sw?: number; fillOpacity?: number }

interface Prim { d: string; fill?: string; stroke?: string; sw: number }

export interface DrawOptions {
  grid: Grid
  kind: MapKind
  hasImage: boolean
  paint: Painting
  showGrid: boolean
  fogEnabled: boolean
  /** `edit`: a névoa só escurece (o mestre enxerga tudo); `play`: névoa quase opaca, como os jogadores veriam. */
  fogView: 'edit' | 'play'
}

const r2 = (n: number) => Math.round(n * 100) / 100
const M = (x: number, y: number) => `M${r2(x)} ${r2(y)}`
const L = (x: number, y: number) => `L${r2(x)} ${r2(y)}`
const Q = (cx: number, cy: number, x: number, y: number) => `Q${r2(cx)} ${r2(cy)} ${r2(x)} ${r2(y)}`
const line = (x1: number, y1: number, x2: number, y2: number) => `${M(x1, y1)}${L(x2, y2)}`
const poly = (pts: [number, number][]) => pts.map(([x, y], i) => (i ? L(x, y) : M(x, y))).join('') + 'Z'
const circle = (cx: number, cy: number, r: number) =>
  `${M(cx - r, cy)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx + r)} ${r2(cy)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx - r)} ${r2(cy)}Z`

const LIGHT = 'rgba(255,255,255,0.55)'
const DARK = 'rgba(0,0,0,0.38)'
const EDGE = 'rgba(0,0,0,0.5)'

/** O desenho de um terreno/peça numa célula de lado `cell` centrada em (cx, cy), como lista de traços. */
export function markPrims(t: Terrain, cx: number, cy: number, cell: number): Prim[] {
  const u = cell / 10
  const lw = Math.max(1, u * 0.45)
  const out: Prim[] = []
  const stroke = (d: string, color: string, sw = lw) => out.push({ d, stroke: color, sw })
  switch (t.mark) {
    case 'waves': {
      let d = ''
      for (const dy of [-1.6, 1.6]) {
        d += M(cx - 3 * u, cy + dy * u) + Q(cx - 1.5 * u, cy + (dy - 1.3) * u, cx, cy + dy * u) + Q(cx + 1.5 * u, cy + (dy + 1.3) * u, cx + 3 * u, cy + dy * u)
      }
      stroke(d, LIGHT)
      break
    }
    case 'dots': {
      let d = ''
      for (const [dx, dy] of [[-2, -1.5], [1.5, -2], [0, 1.8], [-2.2, 2.2], [2.6, 1.2]]) d += circle(cx + dx * u, cy + dy * u, u * 0.5)
      out.push({ d, fill: t.id === 'snow' ? 'rgba(120,150,170,0.55)' : DARK, sw: 0 })
      break
    }
    case 'blades': {
      let d = ''
      for (const dx of [-2.4, 0, 2.4]) d += line(cx + dx * u, cy + 2 * u, cx + (dx + 0.5) * u, cy - 1.8 * u)
      stroke(d, DARK)
      break
    }
    case 'cracks':
      stroke(M(cx - 3 * u, cy - 1 * u) + L(cx - 0.5 * u, cy + 0.5 * u) + L(cx + 0.5 * u, cy - 1.5 * u) + L(cx + 3 * u, cy + 1 * u), DARK)
      break
    case 'planks': {
      let d = ''
      for (const dy of [-1.8, 1.8]) d += line(cx - 3.4 * u, cy + dy * u, cx + 3.4 * u, cy + dy * u)
      stroke(d, DARK)
      break
    }
    case 'diamonds':
      stroke(poly([[cx, cy - 2.8 * u], [cx + 2 * u, cy], [cx, cy + 2.8 * u], [cx - 2 * u, cy]]), LIGHT)
      break
    case 'slashes': {
      let d = ''
      for (const dx of [-2.6, 0, 2.6]) d += line(cx + (dx - 1) * u, cy + 2.4 * u, cx + (dx + 1) * u, cy - 2.4 * u)
      stroke(d, DARK)
      break
    }
    case 'hatch': {
      let d = ''
      for (const k of [-2, 0, 2]) d += line(cx - 3 * u, cy + (k - 1) * u, cx + 3 * u, cy + (k + 1) * u) + line(cx - 3 * u, cy + (k + 1) * u, cx + 3 * u, cy + (k - 1) * u)
      stroke(d, DARK)
      break
    }
    case 'peak':
      out.push({ d: poly([[cx - 3 * u, cy + 2.6 * u], [cx, cy - 3 * u], [cx + 3 * u, cy + 2.6 * u]]), fill: 'rgba(255,255,255,0.35)', stroke: DARK, sw: lw })
      break
    case 'mound':
      stroke(`${M(cx - 3 * u, cy + 1.6 * u)}A${r2(3 * u)} ${r2(3 * u)} 0 0 1 ${r2(cx + 3 * u)} ${r2(cy + 1.6 * u)}`, DARK)
      break
    case 'ring':
      stroke(circle(cx, cy, 2.6 * u), LIGHT)
      break
    case 'cross':
      stroke(line(cx - 2.6 * u, cy - 2.6 * u, cx + 2.6 * u, cy + 2.6 * u) + line(cx + 2.6 * u, cy - 2.6 * u, cx - 2.6 * u, cy + 2.6 * u), t.group === 'general' ? t.color : LIGHT, Math.max(1.5, u * 0.9))
      break
    case 'tree':
      out.push({ d: circle(cx, cy, 3.8 * u), fill: t.color, stroke: EDGE, sw: lw })
      out.push({ d: circle(cx - 1 * u, cy - 1 * u, 1.8 * u), fill: 'rgba(160,220,120,0.5)', sw: 0 })
      break
    case 'flame':
      out.push({ d: circle(cx, cy, 3 * u), fill: t.color, stroke: 'rgba(0,0,0,0.45)', sw: lw })
      out.push({ d: circle(cx, cy, 1.4 * u), fill: '#ffd54f', sw: 0 })
      break
    case 'gem':
      out.push({ d: poly([[cx, cy - 3.4 * u], [cx + 3 * u, cy], [cx, cy + 3.4 * u], [cx - 3 * u, cy]]), fill: t.color, stroke: EDGE, sw: lw })
      break
    case 'door':
      out.push({ d: poly([[cx - 3.4 * u, cy - 1.8 * u], [cx + 3.4 * u, cy - 1.8 * u], [cx + 3.4 * u, cy + 1.8 * u], [cx - 3.4 * u, cy + 1.8 * u]]), fill: t.color, stroke: 'rgba(0,0,0,0.55)', sw: lw })
      out.push({ d: circle(cx + 2 * u, cy, 0.5 * u), fill: '#f2d98d', sw: 0 })
      break
    case 'steps': {
      let d = ''
      for (const dy of [-2.4, 0, 2.4]) d += line(cx - 3 * u, cy + dy * u, cx + 3 * u, cy + dy * u)
      stroke(d, t.color, Math.max(1.5, u * 0.7))
      break
    }
    case 'rock':
      out.push({ d: poly([[cx - 3.4 * u, cy + 2 * u], [cx - 2 * u, cy - 2.4 * u], [cx + 1.6 * u, cy - 3 * u], [cx + 3.4 * u, cy + 0.6 * u], [cx + 1 * u, cy + 3 * u]]), fill: t.color, stroke: EDGE, sw: lw })
      break
    default:
      break
  }
  return out
}

/** Contorno da célula como caminho SVG. */
const cellPath = (g: Grid, idx: number) => poly(cellCorners(g, idx))

/** Junta os traços de várias células com o mesmo estilo num só caminho (poucos elementos, mapa grande). */
class Batch {
  private map = new Map<string, Shape>()
  constructor(private prefix: string) {}
  add(p: { d: string; fill?: string; stroke?: string; sw?: number; fillOpacity?: number }) {
    const key = `${this.prefix}|${p.fill ?? ''}|${p.stroke ?? ''}|${p.sw ?? 0}|${p.fillOpacity ?? 1}`
    const cur = this.map.get(key)
    if (cur) cur.d += p.d
    else this.map.set(key, { key, d: p.d, fill: p.fill, stroke: p.stroke, sw: p.sw, fillOpacity: p.fillOpacity })
  }
  shapes() { return [...this.map.values()] }
}

/**
 * Tudo o que se desenha por cima do fundo, na ordem de baixo para cima:
 * terreno, desenho do terreno, peças, grade e névoa.
 */
export function buildShapes(o: DrawOptions): Shape[] {
  const { grid: g, paint } = o
  const marks = g.cell >= 20
  const baseAlpha = o.hasImage ? 0.78 : 1
  const out: Shape[] = []

  const fills = new Batch('bf')
  const bmarks = new Batch('bm')
  paint.base.forEach((id, idx) => {
    const t = BY_ID.get(id)
    if (!t) return
    fills.add({ d: cellPath(g, idx), fill: t.color, fillOpacity: baseAlpha })
    if (marks) { const c = cellCenter(g, idx); markPrims(t, c.x, c.y, g.cell).forEach(p => bmarks.add(p)) }
  })
  out.push(...fills.shapes(), ...bmarks.shapes())

  const ofills = new Batch('of')
  const omarks = new Batch('om')
  paint.objects.forEach((id, idx) => {
    const t = BY_ID.get(id)
    if (!t) return
    const c = cellCenter(g, idx)
    if (t.fill) ofills.add({ d: cellPath(g, idx), fill: t.color })
    else if (marks) markPrims(t, c.x, c.y, g.cell).forEach(p => omarks.add(p))
    else omarks.add({ d: circle(c.x, c.y, g.cell * 0.3), fill: t.color, sw: 0 })
  })
  out.push(...ofills.shapes(), ...omarks.shapes())

  if (o.showGrid) {
    const { w, h } = mapSize(g)
    let d = ''
    if (g.type === 'SQUARE') {
      for (let c = 0; c <= g.cols; c++) d += line(c * g.cell, 0, c * g.cell, h)
      for (let r = 0; r <= g.rows; r++) d += line(0, r * g.cell, w, r * g.cell)
    } else {
      for (let i = 0; i < g.cols * g.rows; i++) d += cellPath(g, i)
    }
    out.push({ key: 'grid', d, stroke: o.hasImage ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)', sw: 1 })
  }

  if (o.fogEnabled) {
    let d = ''
    for (let i = 0; i < g.cols * g.rows; i++) if (!paint.fog.has(i)) d += cellPath(g, i)
    if (d) out.push({ key: 'fog', d, fill: o.fogView === 'play' ? 'rgba(6,8,12,0.96)' : 'rgba(6,8,12,0.55)' })
  }
  return out
}

/** Cor do chão de um mapa em branco do tipo `kind`. */
export const baseColor = kindBase

/** Colunas, linhas e tamanho da célula que cobrem uma imagem com `cols` colunas. */
export function gridForImage(width: number, height: number, cols: number): { cols: number; rows: number; cellSize: number } {
  const c = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(cols)))
  const cellSize = Math.min(128, Math.max(16, Math.round(width / c)))
  const rows = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(height / cellSize)))
  return { cols: c, rows, cellSize }
}
