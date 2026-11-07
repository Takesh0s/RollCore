import {
  AmbientLight, BoxGeometry, BufferGeometry, CanvasTexture, DirectionalLight, DodecahedronGeometry,
  EdgesGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, LineBasicMaterial, LineSegments,
  Matrix4, Mesh, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera, PlaneGeometry, Quaternion,
  Scene, TetrahedronGeometry, Vector3, WebGLRenderer, MeshBasicMaterial, SRGBColorSpace,
} from 'three'

/**
 * Dados 3D do RollCore. Um modelo por tipo (d4, d6, d8, d10, d12, d20) e o d100 como
 * dois d10 (dezenas 00–90 + unidades 0–9). O resultado vem sempre do servidor: este
 * módulo só coreografa o dado para pousar com a face sorteada virada para a câmera.
 */

interface Face { normal: Vector3; up: Vector3; center: Vector3; value: number }
interface DieModel { group: Group; faces: Face[]; dispose: () => void; sides: number; labels: MeshBasicMaterial[] }

const TAU = Math.PI * 2

/** Pentagonal trapezohedron: 10 faces em pipa, com apontamento nos polos. */
function trapezohedron(): BufferGeometry {
  const c = (1 - Math.cos(Math.PI / 5)) / (1 + Math.cos(Math.PI / 5))   // plano das pipas
  const k = 1.3                                                          // alonga o dado
  const top = new Vector3(0, k, 0), bottom = new Vector3(0, -k, 0)
  const up: Vector3[] = [], down: Vector3[] = []
  for (let i = 0; i < 5; i++) {
    const a = (TAU * i) / 5, b = a + Math.PI / 5
    up.push(new Vector3(Math.cos(a), k * c, Math.sin(a)))
    down.push(new Vector3(Math.cos(b), -k * c, Math.sin(b)))
  }
  const pos: number[] = []
  const tri = (a: Vector3, b: Vector3, d: Vector3) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z)
  for (let i = 0; i < 5; i++) {
    const u0 = up[i], u1 = up[(i + 1) % 5], dn = down[i]
    // pipa de cima: polo, up[i], down[i], up[i+1]
    tri(top, u1, dn); tri(top, dn, u0)
    // pipa de baixo: polo, down[i], up[i+1], down[i+1]
    const dn1 = down[(i + 1) % 5]
    tri(bottom, dn, u1); tri(bottom, u1, dn1)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

export function baseGeometry(sides: number): BufferGeometry {
  switch (sides) {
    case 4:  return new TetrahedronGeometry(1.25)
    case 6:  return new BoxGeometry(1.35, 1.35, 1.35)
    case 8:  return new OctahedronGeometry(1.25)
    case 10: return trapezohedron()
    case 12: return new DodecahedronGeometry(1.15)
    default: return new IcosahedronGeometry(1.2)
  }
}

/** Agrupa os triângulos da malha em faces (mesma normal) e devolve normal, centro e vértice de referência. */
export function groupFaces(geo: BufferGeometry): { normal: Vector3; center: Vector3; ref: Vector3 }[] {
  const g = geo.index ? geo.toNonIndexed() : geo
  const p = g.getAttribute('position')
  const groups: { n: Vector3; pts: Vector3[] }[] = []
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), n = new Vector3()
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2)
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize()
    if (n.dot(a.clone().add(b).add(c)) < 0) n.negate()          // sempre para fora do dado
    // triângulos coplanares (mesma face) têm normais quase iguais; agrupa por proximidade,
    // não por arredondamento, para não dividir uma face em duas por erro numérico
    const e = groups.find(grp => grp.n.dot(n) > 0.9995)
    if (e) e.pts.push(a.clone(), b.clone(), c.clone())
    else groups.push({ n: n.clone(), pts: [a.clone(), b.clone(), c.clone()] })
  }
  return groups.map(({ n: normal, pts }) => {
    const center = pts.reduce((s, v) => s.add(v), new Vector3()).divideScalar(pts.length)
    // vértice mais distante do centro: dá a direção "para cima" do número
    const ref = pts.reduce((best, v) => (v.distanceTo(center) > best.distanceTo(center) ? v : best), pts[0])
    return { normal, center, ref }
  })
}

/** Valores nas faces: faces opostas somam sides+1 (como no dado de verdade) quando há oposta. */
export function assignValues(faces: { normal: Vector3 }[], sides: number): number[] {
  const values = new Array<number>(faces.length).fill(0)
  let next = 1
  faces.forEach((f, i) => {
    if (values[i]) return
    values[i] = next++
    const j = faces.findIndex((g, k) => !values[k] && g.normal.dot(f.normal) < -0.98)
    if (j >= 0) values[j] = sides + 1 - values[i]
  })
  // garante valores únicos 1..N (d4 não tem faces opostas)
  const seen = new Set(values)
  if (seen.size !== faces.length) values.forEach((_, i) => (values[i] = i + 1))
  return values
}

function labelTexture(text: string, fg: string, bg: string): CanvasTexture {
  const s = 128, cv = document.createElement('canvas')
  cv.width = cv.height = s
  const x = cv.getContext('2d')!
  x.clearRect(0, 0, s, s)
  x.fillStyle = bg; x.globalAlpha = 0
  x.fillRect(0, 0, s, s); x.globalAlpha = 1
  x.fillStyle = fg
  x.font = `700 ${text.length > 2 ? 54 : 78}px "Source Serif 4", Georgia, serif`
  x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText(text, s / 2, s / 2 + 4)
  if (text === '6' || text === '9') x.fillRect(s / 2 - 16, s / 2 + 34, 32, 5)     // sublinhado: 6 ≠ 9
  const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace
  return t
}

function buildDie(sides: number, labelOf: (value: number) => string, colors: Colors): DieModel {
  const geo = baseGeometry(sides)
  const group = new Group()
  const flat = geo.index ? geo.toNonIndexed() : geo
  flat.computeVertexNormals()
  const body = new Mesh(flat, new MeshStandardMaterial({
    color: colors.body, roughness: 0.38, metalness: 0.15, flatShading: true,
    transparent: true, opacity: 0.94,
  }))
  group.add(body)
  const edges = new LineSegments(new EdgesGeometry(flat, 12), new LineBasicMaterial({ color: colors.edge }))
  group.add(edges)

  const raw = groupFaces(flat)
  const values = assignValues(raw, sides)
  const disposables: { dispose: () => void }[] = [flat, body.material, edges.geometry, edges.material]
  const labelMats: MeshBasicMaterial[] = []
  const faces: Face[] = raw.map((f, i) => {
    const up = sides === 6
      ? new Vector3(0, Math.abs(f.normal.y) > 0.9 ? 0 : 1, Math.abs(f.normal.y) > 0.9 ? 1 : 0).projectOnPlane(f.normal).normalize()
      : f.ref.clone().sub(f.center).projectOnPlane(f.normal).normalize()
    const tex = labelTexture(labelOf(values[i]), colors.label, colors.body)
    const size = ({ 4: 0.9, 6: 0.85, 8: 0.8, 10: 0.8, 12: 0.78, 20: 0.6 } as Record<number, number>)[sides] ?? 0.7
    const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    const plane = new Mesh(new PlaneGeometry(size, size), mat)
    const right = new Vector3().crossVectors(up, f.normal).normalize()
    // base local do rótulo: x = direita, y = cima, z = normal
    plane.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(right, up, f.normal))
    plane.position.copy(f.center).addScaledVector(f.normal, 0.012)
    group.add(plane)
    labelMats.push(mat)
    disposables.push(tex, mat, plane.geometry)
    return { normal: f.normal.clone(), up, center: f.center.clone(), value: values[i] }
  })
  return { group, faces, sides, labels: labelMats, dispose: () => disposables.forEach(d => d.dispose()) }
}

export interface Colors { body: string; edge: string; label: string }


/** Quaternion que leva a face `f` para a câmera (normal → +z, "cima" do número → +y). */
function faceToCamera(f: Face): Quaternion {
  const right = new Vector3().crossVectors(f.up, f.normal).normalize()
  const m = new Matrix4().makeBasis(right, f.up, f.normal).transpose()
  return new Quaternion().setFromRotationMatrix(m)
}

export class DiceScene {
  private renderer: WebGLRenderer
  private scene = new Scene()
  private camera = new PerspectiveCamera(32, 1, 0.1, 50)
  private dice: DieModel[] = []
  private sides = 20
  private colors: Colors
  private raf = 0
  private tumbling = false
  private spin: { axis: Vector3; speed: number }[] = []
  private landing: { r0: Quaternion[]; to: Quaternion[]; axisA: Vector3[]; axisB: Vector3[]; turnsA: number[]; turnsB: number[]; y0: number[]; start: number; dur: number; done: () => void } | null = null
  private shadows: Mesh[] = []
  private shadowTex: CanvasTexture | null = null
  private baseX: number[] = []
  private reduced: boolean

  constructor(canvas: HTMLCanvasElement, colors: Colors, reducedMotion: boolean) {
    this.colors = colors
    this.reduced = reducedMotion
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.camera.position.set(0, 0, 7.2)
    this.scene.add(new AmbientLight(0xffffff, 1.35))
    const key = new DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 6); this.scene.add(key)
    const rim = new DirectionalLight(0xffffff, 0.8); rim.position.set(-4, -2, 3); this.scene.add(rim)
    this.setSides(20)
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.render()
  }

  setColors(c: Colors) { this.colors = c; this.setSides(this.sides, true) }

  /** Troca o tipo de dado; o dado novo aparece parado numa face qualquer (ou na `show`). */
  setSides(sides: number, force = false, show?: number[]) {
    if (!force && sides === this.sides && this.dice.length && !show) return
    this.sides = sides
    this.dice.forEach(d => { this.scene.remove(d.group); d.dispose() })
    this.shadows.forEach(m => { this.scene.remove(m); (m.material as MeshBasicMaterial).dispose(); m.geometry.dispose() })
    this.shadows = []
    this.dice = []
    const mk = (n: number, labelOf: (v: number) => string) => buildDie(n, labelOf, this.colors)
    if (sides === 100) {
      this.dice = [
        mk(10, v => String(((v % 10) * 10)).padStart(2, '0')),   // dezenas: 00…90
        mk(10, v => String(v % 10)),                              // unidades: 0…9
      ]
    } else {
      this.dice = [mk(sides, v => String(sides === 10 ? v % 10 : v))]
    }
    const n = this.dice.length
    this.dice.forEach((d, i) => {
      const s = n > 1 ? 0.6 : 1
      d.group.scale.setScalar(s)
      const x = n > 1 ? (i === 0 ? -1.2 : 1.2) : 0
      this.baseX[i] = x
      d.group.position.set(x, 0, 0)
      this.scene.add(d.group)
      const sh = new Mesh(new PlaneGeometry(2.4 * s, 0.5 * s), new MeshBasicMaterial({ map: this.shadowTexture(), transparent: true, depthWrite: false }))
      sh.position.set(x, -1.12 * s - 0.06, -0.3)
      this.shadows.push(sh); this.scene.add(sh)
    })
    this.camera.position.z = this.dice.length > 1 ? 7.4 : 6.1
    this.spin = this.dice.map(() => ({ axis: new Vector3(Math.random(), Math.random(), Math.random()).normalize(), speed: 5 }))
    this.showFaces(show)
  }

  /** Faces (por dado) que correspondem a um valor de rolagem 1…sides. */
  private targets(value: number): Face[] {
    if (this.sides === 100) {
      const v = value === 100 ? 0 : value
      const tens = Math.floor(v / 10), units = v % 10
      const f = (d: DieModel, shown: number) => d.faces.find(x => x.value % 10 === shown) ?? d.faces[0]
      return [f(this.dice[0], tens), f(this.dice[1], units)]
    }
    const d = this.dice[0]
    return [d.faces.find(x => x.value === value) ?? d.faces[0]]
  }

  private showFaces(values?: number[]) {
    const value = values?.[values.length - 1] ?? 1 + Math.floor(Math.random() * this.sides)
    const t = this.targets(value)
    this.dice.forEach((d, i) => d.group.quaternion.copy(faceToCamera(t[i]).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0)))
      .premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.05)))
    this.render()
  }

  /** Mostra/esconde os números das faces (o total aparece por cima do dado quando ele pousa). */
  setLabels(visible: boolean) { this.dice.forEach(d => d.labels.forEach(m => (m.opacity = visible ? 1 : 0))); this.render() }

  /** Mostra o dado parado já na face (sem animação), ex.: ao abrir a tela. */
  showValue(value: number) { this.landing = null; this.tumbling = false; this.dice.forEach((_, i) => this.place(i, 0)); this.showFaces([value]) }

  /** Elipse suave usada como sombra sob o dado. */
  private shadowTexture() {
    if (this.shadowTex) return this.shadowTex
    const c = document.createElement('canvas'); c.width = 128; c.height = 32
    const g = c.getContext('2d')!
    g.scale(1, 0.25)
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128)
    this.shadowTex = new CanvasTexture(c)
    return this.shadowTex
  }

  /** Posição/sombra do dado `i` a uma altura `y` (a sombra encolhe e clareia com a altura). */
  private place(i: number, y: number) {
    const d = this.dice[i]; if (!d) return
    d.group.position.set(this.baseX[i] ?? 0, y, 0)
    const sh = this.shadows[i]
    if (sh) { const k = 1 / (1 + Math.max(0, y) * 1.4); sh.scale.set(k, k, 1); (sh.material as MeshBasicMaterial).opacity = k }
  }

  /** Gira o dado sem parar, até `landOn` ser chamado (enquanto o servidor responde): quica e rola. */
  startTumble() {
    if (this.reduced) return
    this.landing = null
    this.tumbling = true
    this.spin = this.dice.map(() => ({ axis: new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), speed: 13 }))
    this.loop()
  }

  /** Pousa com a face do `value` virada para a câmera: quica, gira com atrito e para. `done` avisa o fim. */
  landOn(value: number, dur: number, done: () => void) {
    const t = this.targets(value)
    const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.05)
    const to = this.dice.map((_, i) => faceToCamera(t[i]).premultiply(tilt))
    if (this.reduced) {
      this.dice.forEach((d, i) => { d.group.quaternion.copy(to[i]); this.place(i, 0) }); this.tumbling = false; this.render(); done(); return
    }
    this.tumbling = false
    const rnd = () => new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
    this.landing = {
      // rotação que falta para chegar ao alvo, a partir de onde o dado está agora
      r0: this.dice.map((d, i) => d.group.quaternion.clone().multiply(to[i].clone().invert())),
      to, axisA: this.dice.map(rnd), axisB: this.dice.map(rnd),
      turnsA: this.dice.map(() => 2 + Math.floor(Math.random() * 2)),
      turnsB: this.dice.map(() => 1 + Math.floor(Math.random() * 2)),
      y0: this.dice.map(d => d.group.position.y),
      start: performance.now(), dur, done,
    }
    this.loop()
  }

  private last = 0
  private loop = () => {
    if (this.raf) return
    this.last = performance.now()
    const I = new Quaternion()
    // quiques: fração do tempo e altura de cada salto (cada um menor que o anterior)
    const frac = [0.32, 0.25, 0.19, 0.13, 0.08, 0.03], hts = [0.62, 0.34, 0.16, 0.07, 0.025, 0.008]
    const step = (now: number) => {
      this.raf = 0
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now
      let again = false
      if (this.tumbling) {
        this.dice.forEach((d, i) => {
          const s = this.spin[i]
          d.group.quaternion.premultiply(new Quaternion().setFromAxisAngle(s.axis, s.speed * dt))
          // de tempos em tempos "bate" e muda o eixo de giro, como um dado rolando
          if (Math.random() < dt * 2.2) s.axis.add(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)).normalize()
          this.place(i, 0.4 * Math.abs(Math.sin(now / 210 + i * 1.3)))
        })
        again = true
      } else if (this.landing) {
        const L = this.landing
        const u = Math.min(1, (now - L.start) / L.dur)
        const k = Math.pow(1 - u, 2)            // velocidade angular cai até zero (atrito)
        this.dice.forEach((d, i) => {
          const spinA = new Quaternion().setFromAxisAngle(L.axisA[i], TAU * L.turnsA[i] * k)
          const spinB = new Quaternion().setFromAxisAngle(L.axisB[i], TAU * L.turnsB[i] * k * k)
          const res = I.clone().slerp(L.r0[i], k)
          d.group.quaternion.copy(spinA.multiply(spinB).multiply(res).multiply(L.to[i]))
          // altura: saltos decrescentes; no primeiro, parte da altura atual
          let acc = 0, y = 0
          for (let j = 0; j < frac.length; j++) {
            if (u <= acc + frac[j] || j === frac.length - 1) {
              const s = Math.min(1, (u - acc) / frac[j])
              y = hts[j] * 4 * s * (1 - s) + (j === 0 ? L.y0[i] * (1 - s) : 0)
              break
            }
            acc += frac[j]
          }
          this.place(i, y)
        })
        if (u >= 1) {
          this.landing = null
          this.dice.forEach((d, i) => { d.group.quaternion.copy(L.to[i]); this.place(i, 0) })
          L.done()
        } else again = true
      }
      this.render()
      if (again) { this.raf = requestAnimationFrame(step) }
    }
    this.raf = requestAnimationFrame(step)
  }

  private render() { this.renderer.render(this.scene, this.camera) }

  dispose() {
    cancelAnimationFrame(this.raf); this.raf = 0
    this.dice.forEach(d => d.dispose())
    this.shadowTex?.dispose()
    this.renderer.dispose()
  }
}
