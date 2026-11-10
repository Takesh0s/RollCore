import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMaps, type MapItem } from '@/store/useMaps'
import { AppHeader } from '@/components/ui/AppHeader'
import { StateView } from '@/components/ui/StateView'
import { IconPlus, IconSearch } from '@/components/ui/icons'
import { MapThumb } from '@/components/maps/MapCanvas'
import { ManageMapModal, gridOf, mapSummary, usePaintOf } from '@/components/maps/MapModals'
import { decodeLayers, exportMapPng, KINDS, type MapKind } from '@/lib/maps'

function MapCard({ map, onEdit, onManage }: { map: MapItem; onEdit: () => void; onManage: () => void }) {
  const showToast = useAppStore(s => s.showToast)
  const paint = usePaintOf(map)

  async function exportPng() {
    const ok = await exportMapPng({ grid: gridOf(map), kind: map.kind, imageUrl: map.imageUrl, paint: decodeLayers(map.layers, map.cols, map.rows), showGrid: map.gridVisible, name: map.name })
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error')
  }

  return (
    <article className="map-card" aria-label={`Mapa ${map.name}`}>
      <MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} fogEnabled={false} label={`Prévia de ${map.name}`} />
      <h3 className="map-card-name">{map.name}</h3>
      <small className="map-card-meta">{mapSummary(map)}{map.published ? ' · Na Oficina' : ''}</small>
      <div className="map-card-actions">
        <button type="button" className="btn btn-primary btn-pill" onClick={onEdit}>Editar mapa</button>
        <button type="button" className="btn btn-outline btn-pill" onClick={onManage} aria-label={`Gerenciar ${map.name}`}>Gerenciar</button>
      </div>
      <button type="button" className="btn btn-outline btn-pill map-card-export" onClick={exportPng}>Exportar PNG</button>
    </article>
  )
}

/**
 * Lista de mapas (Figma 09.3): biblioteca do mestre com busca por nome e tipo, "Adicionar mapa",
 * "Criar novo mapa" e o caminho para a Oficina da Comunidade.
 */
export function MapLibraryScreen() {
  const { navigate } = useAppStore()
  const { maps, loading, load, edit } = useMaps()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<MapKind | ''>('')
  const [managing, setManaging] = useState<string | null>(null)

  useEffect(() => { load() }, [load])

  const q = query.trim().toLowerCase()
  const shown = useMemo(
    () => maps.filter(m => (!kind || m.kind === kind) && (!q || m.name.toLowerCase().includes(q))),
    [maps, q, kind],
  )
  const managed = maps.find(m => m.id === managing) ?? null

  const open = (id: string) => { edit(id); navigate('mapa-editor') }

  return (
    <div className="device">
      <AppHeader title="Lista de mapas" />

      <div className="page-body map-page">
        <div className="list-toolbar map-toolbar">
          <label className="search-box">
            <IconSearch />
            <input type="search" placeholder="Buscar mapa" value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar mapa" />
          </label>
          <select className="form-input map-kind-filter" value={kind} onChange={e => setKind(e.target.value as MapKind | '')} aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-pill" onClick={() => navigate('oficina-mapas')}>Oficina da Comunidade</button>
          <button type="button" className="btn btn-primary btn-pill map-add" onClick={() => navigate('mapa-novo')}>
            <IconPlus /> Adicionar mapa
          </button>
        </div>

        <h2 className="section-title map-section">Biblioteca de mapas</h2>

        {maps.length === 0 && !loading ? (
          <StateView kind="empty" title="Nenhum mapa ainda"
                     text="Crie um mapa do zero, envie uma imagem sua ou pegue um da Oficina da Comunidade."
                     actions={[
                       { label: 'Criar mapa', primary: true, onClick: () => navigate('mapa-novo') },
                       { label: 'Ver a Oficina', onClick: () => navigate('oficina-mapas') },
                     ]} />
        ) : shown.length === 0 && maps.length > 0 ? (
          <StateView kind="noresults" title="Nada encontrado" text="Tente outros termos ou outro tipo de mapa."
                     actions={[{ label: 'Limpar filtros', primary: true, onClick: () => { setQuery(''); setKind('') } }]} />
        ) : (
          <div className="map-grid">
            {shown.map(m => <MapCard key={m.id} map={m} onEdit={() => open(m.id)} onManage={() => setManaging(m.id)} />)}
            <button type="button" className="map-card map-new" onClick={() => navigate('mapa-novo')}>
              <span className="map-new-plus" aria-hidden="true">+</span>
              Criar novo mapa
            </button>
          </div>
        )}
      </div>
      {managed && <ManageMapModal map={managed} onClose={() => setManaging(null)} />}
    </div>
  )
}
