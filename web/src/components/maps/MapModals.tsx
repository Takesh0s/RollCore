import { useMemo, useState, type ReactNode } from 'react'
import { Shell } from '@/components/tables/TableModals'
import { Modal } from '@/components/ui/Modal'
import { MapCanvas } from '@/components/maps/MapCanvas'
import { useAppStore } from '@/store/useAppStore'
import { useMaps, bodyOf, type MapItem } from '@/store/useMaps'
import { decodeLayers, exportMapPng, kindLabel, MAX_NAME, type Grid } from '@/lib/maps'

export const gridOf = (m: MapItem): Grid => ({ type: m.gridType, cols: m.cols, rows: m.rows, cell: m.cellSize })

/** Mapa decodificado (pintura) para desenhar; recalcula só quando a pintura muda. */
export function usePaintOf(m: MapItem) {
  return useMemo(() => decodeLayers(m.layers, m.cols, m.rows), [m.layers, m.cols, m.rows])
}

/** Mensagem curta com tipo, formato e tamanho: "Medieval · Hexágonos · 30 × 20". */
export const mapSummary = (m: MapItem) =>
  `${kindLabel(m.kind)} · ${m.gridType === 'HEX' ? 'Hexágonos' : 'Quadrados'} · ${m.cols} × ${m.rows}`

/** Pede um novo nome (3 a 100 caracteres). */
export function RenameMapModal({ name, onSave, onClose }: { name: string; onSave: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(name)
  const trimmed = value.trim()
  const valid = trimmed.length >= 3 && trimmed.length <= MAX_NAME
  return (
    <Shell title="Renomear mapa" onClose={onClose}>
      <label className="tm-label" htmlFor="map-rename">Nome do mapa</label>
      <input id="map-rename" className="form-input" value={value} maxLength={MAX_NAME} autoComplete="off" autoFocus
             onChange={e => setValue(e.target.value)}
             onKeyDown={e => { if (e.key === 'Enter' && valid) onSave(trimmed) }} />
      {!valid && <small className="field-error">O nome deve ter de 3 a 100 caracteres.</small>}
      <div className="tm-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={!valid} onClick={() => onSave(trimmed)}>Salvar nome</button>
      </div>
    </Shell>
  )
}

/** "Gerenciar" (biblioteca): renomear, duplicar, publicar na Oficina, exportar e excluir. */
export function ManageMapModal({ map, onClose }: { map: MapItem; onClose: () => void }) {
  const { save, copy, setPublished, remove } = useMaps()
  const showToast = useAppStore(s => s.showToast)
  const paint = usePaintOf(map)
  const [renaming, setRenaming] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  async function run(job: () => Promise<void>) {
    setBusy(true)
    try { await job() } finally { setBusy(false) }
  }

  const rename = (name: string) => run(async () => {
    const res = await save(map.id, bodyOf(map, { name }))
    if (res.ok) { setRenaming(false); showToast('Nome atualizado.', 'success') } else showToast(res.error, 'error')
  })
  const duplicate = () => run(async () => {
    const res = await copy(map.id)
    if (res.ok) { showToast('Cópia criada na biblioteca.', 'success'); onClose() } else showToast(res.error, 'error')
  })
  const togglePublish = () => run(async () => {
    const res = await setPublished(map.id, !map.published)
    if (res.ok) showToast(map.published ? 'O mapa saiu da Oficina.' : 'Mapa publicado na Oficina da Comunidade.', 'success')
    else showToast(res.error, 'error')
  })
  const exportPng = () => run(async () => {
    const ok = await exportMapPng({ grid: gridOf(map), kind: map.kind, imageUrl: map.imageUrl, paint, showGrid: map.gridVisible, name: map.name })
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error')
  })
  const del = () => run(async () => {
    if (await remove(map.id)) { showToast('Mapa excluído.', 'success'); onClose() } else showToast('Não foi possível excluir o mapa.', 'error')
  })

  return (
    <>
      <Shell title={map.name} onClose={onClose} label="Gerenciar mapa">
        <p className="tm-text">{mapSummary(map)}{map.published ? ' · Publicado na Oficina' : ''}</p>
        <div className="map-manage">
          <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setRenaming(true)}>Renomear</button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={duplicate}>Duplicar</button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={togglePublish}>
            {map.published ? 'Remover da Oficina' : 'Publicar na Oficina'}
          </button>
          <button type="button" className="btn btn-outline" disabled={busy} onClick={exportPng}>Exportar PNG</button>
          <button type="button" className="btn tm-danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir mapa</button>
        </div>
      </Shell>
      {renaming && <RenameMapModal name={map.name} onSave={rename} onClose={() => setRenaming(false)} />}
      <Modal open={confirmDelete} danger title="Excluir mapa?"
             message={`"${map.name}" será apagado da sua biblioteca. Isso não pode ser desfeito.`}
             confirmLabel="Excluir" onCancel={() => setConfirmDelete(false)} onConfirm={del} />
    </>
  )
}

/** Visualização grande de um mapa (Oficina da Comunidade), com ações opcionais no rodapé. */
export function MapPreviewModal({ map, onClose, children }: { map: MapItem; onClose: () => void; children?: ReactNode }) {
  const paint = usePaintOf(map)
  return (
    <Shell title={map.name} onClose={onClose} label="Visualizar mapa">
      <p className="tm-text">{mapSummary(map)} · por {map.authorName}</p>
      <div className="map-preview">
        <MapCanvas grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} rev={0}
                   showGrid={map.gridVisible} fogEnabled={false} label={`Mapa ${map.name}`} maxSide={1600} />
      </div>
      {children}
    </Shell>
  )
}
