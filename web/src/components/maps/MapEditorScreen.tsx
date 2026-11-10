import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMaps, bodyOf, type MapItem } from '@/store/useMaps'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'
import { AppHeader } from '@/components/ui/AppHeader'
import { Modal } from '@/components/ui/Modal'
import { StateView } from '@/components/ui/StateView'
import { MapCanvas, type StrokeEvent } from '@/components/maps/MapCanvas'
import { RenameMapModal } from '@/components/maps/MapModals'
import {
  clonePainting, decodeLayers, drawTerrainSample, encodeLayers, exportMapPng, GRID_TYPES, GROUPS, KINDS, TERRAINS,
  type GridType, type MapKind, type Painting, type Terrain, type TerrainGroup,
} from '@/lib/maps'

type Tool = { kind: 'paint'; id: string } | { kind: 'erase' } | { kind: 'reveal' } | { kind: 'cover' }

const HISTORY = 60
const ZOOMS = [1, 1.5, 2, 3, 4]

function TerrainTile({ t, on, onPick }: { t: Terrain; on: boolean; onPick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (ctx) drawTerrainSample(ctx, t, 56)
  }, [t])
  return (
    <button type="button" className={`map-tile${on ? ' on' : ''}`} aria-pressed={on} onClick={onPick}>
      <canvas ref={ref} width={56} height={56} aria-hidden="true" />
      <span>{t.label}</span>
    </button>
  )
}

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const ICON = {
  edit:  svg('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z'),
  copy:  svg('M9 9h11v11H9zM5 15V5a1 1 0 0 1 1-1h10'),
  eye:   svg('M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'),
  trash: svg('M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14'),
  undo:  svg('M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'),
  redo:  svg('m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3'),
}

/** Carrega o mapa aberto e mostra o editor; sem mapa (ou de outra pessoa) mostra "não encontrado". */
export function MapEditorScreen() {
  const navigate = useAppStore(s => s.navigate)
  const { editingId, get } = useMaps()
  const [item, setItem] = useState<MapItem | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    if (!editingId) { setItem(null); return }
    get(editingId).then(m => { if (alive) setItem(m && m.mine ? m : null) })
    return () => { alive = false }
  }, [editingId, get])

  if (item === undefined) return <div className="device"><AppHeader title="Editor de mapa" onBack={() => navigate('mapas')} /><div className="page-body" /></div>
  if (item === null) {
    return (
      <div className="device">
        <AppHeader title="Editor de mapa" onBack={() => navigate('mapas')} />
        <div className="page-body">
          <StateView kind="notfound" title="Mapa não encontrado" text="Ele pode ter sido excluído, ou não é seu."
                     actions={[{ label: 'Voltar aos mapas', primary: true, onClick: () => navigate('mapas') }]} />
        </div>
      </div>
    )
  }
  return <MapEditor key={item.id} initial={item} />
}

/**
 * Editor de mapa (Figma 09.5): o mapa num canvas e, ao lado, a paleta de terrenos por abas,
 * tamanho do pincel, grade, névoa de guerra, publicar na Oficina, salvar e sair.
 * Extras: desfazer/refazer (Ctrl+Z / Ctrl+Y), zoom, visualização como jogador e exportar PNG.
 */
function MapEditor({ initial }: { initial: MapItem }) {
  const { navigate, showToast } = useAppStore()
  const { save, remove, copy, setPublished } = useMaps()

  const [saved, setSaved] = useState(initial)
  const [name, setName] = useState(initial.name)
  const [kind, setKind] = useState<MapKind>(initial.kind)
  const [gridType, setGridType] = useState<GridType>(initial.gridType)
  const [gridVisible, setGridVisible] = useState(initial.gridVisible)
  const [fogEnabled, setFogEnabled] = useState(initial.fogEnabled)

  const paintRef = useRef<Painting>(decodeLayers(initial.layers, initial.cols, initial.rows))
  const [rev, setRev] = useState(0)
  const [paintDirty, setPaintDirty] = useState(false)
  const undo = useRef<Painting[]>([])
  const redo = useRef<Painting[]>([])
  const [, setHist] = useState(0)
  const snap = useRef<Painting | null>(null)
  const changed = useRef(false)

  const [group, setGroup] = useState<TerrainGroup>('terrain')
  const [tool, setTool] = useState<Tool>({ kind: 'paint', id: 'grass' })
  const [brush, setBrush] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty = paintDirty || name !== saved.name || kind !== saved.kind || gridType !== saved.gridType
    || gridVisible !== saved.gridVisible || fogEnabled !== saved.fogEnabled
  useUnsavedGuard(dirty, 'As alterações deste mapa ainda não foram salvas.')

  const grid = useMemo(() => ({ type: gridType, cols: saved.cols, rows: saved.rows, cell: saved.cellSize }), [gridType, saved.cols, saved.rows, saved.cellSize])
  const bump = () => setRev(r => r + 1)
  const pushHistory = (before: Painting) => {
    undo.current.push(before)
    if (undo.current.length > HISTORY) undo.current.shift()
    redo.current = []
    setHist(h => h + 1)
    setPaintDirty(true)
  }

  // ── pintura ──────────────────────────────────────────────────────────────
  function applyCells(cells: number[]) {
    const p = paintRef.current
    let any = false
    for (const idx of cells) {
      if (tool.kind === 'paint') {
        const t = TERRAINS.find(x => x.id === tool.id)
        if (!t) continue
        const layer = t.group === 'general' ? p.objects : p.base
        if (layer.get(idx) !== t.id) { layer.set(idx, t.id); any = true }
      } else if (tool.kind === 'erase') {
        if (p.base.delete(idx)) any = true
        if (p.objects.delete(idx)) any = true
      } else if (tool.kind === 'reveal') {
        if (!p.fog.has(idx)) { p.fog.add(idx); any = true }
      } else if (p.fog.delete(idx)) any = true
    }
    if (any) { changed.current = true; bump() }
  }

  const onStroke = (e: StrokeEvent) => {
    if (e.phase === 'start') { snap.current = clonePainting(paintRef.current); changed.current = false }
    if (e.phase !== 'end') { applyCells(e.cells); return }
    if (changed.current && snap.current) pushHistory(snap.current)
    snap.current = null
  }

  const doUndo = useCallback(() => {
    const prev = undo.current.pop()
    if (!prev) return
    redo.current.push(clonePainting(paintRef.current))
    paintRef.current = prev
    setHist(h => h + 1); setPaintDirty(true); bump()
  }, [])
  const doRedo = useCallback(() => {
    const next = redo.current.pop()
    if (!next) return
    undo.current.push(clonePainting(paintRef.current))
    paintRef.current = next
    setHist(h => h + 1); setPaintDirty(true); bump()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); doRedo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doUndo, doRedo])

  function fillFog(reveal: boolean) {
    pushHistory(clonePainting(paintRef.current))
    const p = paintRef.current
    p.fog = new Set(reveal ? Array.from({ length: grid.cols * grid.rows }, (_, i) => i) : [])
    bump()
  }

  function toggleFog(on: boolean) {
    setFogEnabled(on)
    if (!on && (tool.kind === 'reveal' || tool.kind === 'cover')) setTool({ kind: 'paint', id: 'grass' })
  }

  // ── ações ────────────────────────────────────────────────────────────────
  async function doSave(): Promise<MapItem | null> {
    setSaving(true)
    const res = await save(saved.id, bodyOf(saved, { name, kind, gridType, gridVisible, fogEnabled, layers: encodeLayers(paintRef.current) }))
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return null }
    setSaved(res.map)
    setPaintDirty(false)
    return res.map
  }

  async function onSave() {
    if (await doSave()) showToast('Mapa salvo.', 'success')
  }

  async function onPublish() {
    const current = dirty ? await doSave() : saved
    if (!current) return
    const res = await setPublished(current.id, !current.published)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setSaved(res.map)
    showToast(res.map.published ? 'Mapa publicado na Oficina da Comunidade.' : 'O mapa saiu da Oficina.', 'success')
  }

  async function onDuplicate() {
    const current = dirty ? await doSave() : saved
    if (!current) return
    const res = await copy(current.id)
    if (res.ok) showToast('Cópia criada na biblioteca.', 'success')
    else showToast(res.error, 'error')
  }

  async function onExport() {
    const ok = await exportMapPng({ grid, kind, imageUrl: saved.imageUrl, paint: paintRef.current, showGrid: gridVisible, name })
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error')
  }

  async function onDelete() {
    setConfirmDelete(false)
    if (await remove(saved.id)) {
      useAppStore.getState().setDirty(null)
      showToast('Mapa excluído.', 'success')
      navigate('mapas')
    } else showToast('Não foi possível excluir o mapa.', 'error')
  }

  const terrains = TERRAINS.filter(t => t.group === group)
  const paintId = tool.kind === 'paint' ? tool.id : null

  return (
    <div className="device">
      <AppHeader title="Editor de mapa" onBack={() => navigate('mapas')} />

      <div className="page-body map-page">
        <div className="map-editor">
          <section className="map-stage-wrap" aria-label="Mapa">
            <div className="map-float" role="toolbar" aria-label="Ações do mapa">
              <span className="map-title">{name}{dirty ? ' •' : ''}</span>
              <button type="button" className="map-icon" aria-label="Renomear mapa" title="Renomear" onClick={() => setRenaming(true)}>{ICON.edit}</button>
              <button type="button" className="map-icon" aria-label="Duplicar mapa" title="Duplicar" onClick={onDuplicate}>{ICON.copy}</button>
              <button type="button" className={`map-icon${preview ? ' on' : ''}`} aria-label="Visualizar como jogador" aria-pressed={preview} title="Visualizar como jogador" onClick={() => setPreview(p => !p)}>{ICON.eye}</button>
              <button type="button" className="map-icon" aria-label="Excluir mapa" title="Excluir" onClick={() => setConfirmDelete(true)}>{ICON.trash}</button>
            </div>

            <div className="map-stage">
              <MapCanvas grid={grid} kind={kind} imageUrl={saved.imageUrl} paint={paintRef.current} rev={rev}
                         showGrid={gridVisible} fogEnabled={fogEnabled} fogView={preview ? 'play' : 'edit'}
                         brush={brush} onStroke={preview ? undefined : onStroke} zoom={zoom} label={`Mapa ${name}`} />
            </div>

            <div className="map-bottombar">
              <button type="button" className="map-icon" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={undo.current.length === 0} onClick={doUndo}>{ICON.undo}</button>
              <button type="button" className="map-icon" aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled={redo.current.length === 0} onClick={doRedo}>{ICON.redo}</button>
              <span className="map-sep" />
              <button type="button" className="map-icon" aria-label="Diminuir zoom" disabled={zoom <= ZOOMS[0]} onClick={() => setZoom(z => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])}>−</button>
              <button type="button" className="map-zoom" aria-label="Ajustar à tela" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
              <button type="button" className="map-icon" aria-label="Aumentar zoom" disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onClick={() => setZoom(z => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])}>+</button>
              {preview && <span className="map-badge">Visão do jogador · toque no olho para voltar a editar</span>}
            </div>
          </section>

          <aside className="map-panel" aria-label="Ferramentas do mapa">
            <div className="map-tabs" role="tablist" aria-label="Categorias de terreno">
              {GROUPS.map(g => (
                <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={`map-tab${group === g.id ? ' on' : ''}`} onClick={() => setGroup(g.id)}>{g.label}</button>
              ))}
            </div>
            <h3 className="map-panel-title">{group === 'general' ? 'Peças' : GROUPS.find(g => g.id === group)?.label}</h3>
            <div className="map-tiles">
              {terrains.map(t => <TerrainTile key={t.id} t={t} on={paintId === t.id} onPick={() => setTool({ kind: 'paint', id: t.id })} />)}
            </div>
            <button type="button" className={`btn btn-outline btn-pill map-eraser${tool.kind === 'erase' ? ' on' : ''}`} aria-pressed={tool.kind === 'erase'}
                    onClick={() => setTool({ kind: 'erase' })}>Borracha</button>

            <hr className="map-rule" />
            <label className="map-slider-label" htmlFor="map-brush">Tamanho do pincel: {brush}</label>
            <input id="map-brush" type="range" min={1} max={6} value={brush} onChange={e => setBrush(Number(e.target.value))} />

            <label className="tm-switch">
              <span>Grade</span>
              <input type="checkbox" role="switch" checked={gridVisible} onChange={e => setGridVisible(e.target.checked)} />
            </label>
            <label className="tm-switch">
              <span>Névoa de guerra</span>
              <input type="checkbox" role="switch" checked={fogEnabled} onChange={e => toggleFog(e.target.checked)} />
            </label>
            {fogEnabled && (
              <div className="map-fog">
                <div className="map-seg" role="group" aria-label="Pincel da névoa">
                  <button type="button" className={`map-seg-btn${tool.kind === 'reveal' ? ' on' : ''}`} aria-pressed={tool.kind === 'reveal'} onClick={() => setTool({ kind: 'reveal' })}>Revelar</button>
                  <button type="button" className={`map-seg-btn${tool.kind === 'cover' ? ' on' : ''}`} aria-pressed={tool.kind === 'cover'} onClick={() => setTool({ kind: 'cover' })}>Cobrir</button>
                </div>
                <div className="map-seg">
                  <button type="button" className="map-seg-btn" onClick={() => fillFog(true)}>Revelar tudo</button>
                  <button type="button" className="map-seg-btn" onClick={() => fillFog(false)}>Cobrir tudo</button>
                </div>
              </div>
            )}

            <hr className="map-rule" />
            <div className="map-settings">
              <div>
                <label className="form-label" htmlFor="map-kind">Tipo</label>
                <select id="map-kind" className="form-input" value={kind} onChange={e => setKind(e.target.value as MapKind)}>
                  {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="map-grid-type">Formato</label>
                <select id="map-grid-type" className="form-input" value={gridType} onChange={e => setGridType(e.target.value as GridType)}>
                  {GRID_TYPES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <small className="field-hint">{saved.cols} × {saved.rows} células</small>
            </div>

            <div className="map-panel-actions">
              <button type="button" className="btn btn-outline btn-pill" onClick={onPublish} disabled={saving}>
                {saved.published ? 'Remover da Oficina' : 'Publicar na Oficina'}
              </button>
              <button type="button" className="btn btn-outline btn-pill" onClick={onExport}>Exportar PNG</button>
              <button type="button" className="btn btn-primary btn-pill map-save" onClick={onSave} disabled={saving || !dirty}>
                {saving ? '…' : 'Salvar mapa'}
              </button>
              <button type="button" className="btn btn-outline btn-pill" onClick={() => navigate('mapas')}>Sair do editor</button>
            </div>
          </aside>
        </div>
      </div>

      {renaming && <RenameMapModal name={name} onSave={n => { setName(n); setRenaming(false) }} onClose={() => setRenaming(false)} />}
      <Modal open={confirmDelete} danger title="Excluir mapa?"
             message={`"${name}" será apagado da sua biblioteca. Isso não pode ser desfeito.`}
             confirmLabel="Excluir" onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} />
    </div>
  )
}
