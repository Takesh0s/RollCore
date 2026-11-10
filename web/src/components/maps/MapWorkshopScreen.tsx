import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMaps, type MapItem } from '@/store/useMaps'
import { AppHeader } from '@/components/ui/AppHeader'
import { StateView } from '@/components/ui/StateView'
import { IconSearch } from '@/components/ui/icons'
import { MapThumb } from '@/components/maps/MapCanvas'
import { MapPreviewModal, gridOf, mapSummary, usePaintOf } from '@/components/maps/MapModals'
import { KINDS, type MapKind } from '@/lib/maps'

function WorkshopCard({ map, busy, onView, onAdd, onEdit }: {
  map: MapItem; busy: boolean; onView: () => void; onAdd: () => void; onEdit: () => void
}) {
  const paint = usePaintOf(map)
  return (
    <article className="map-card" aria-label={`Mapa ${map.name}`}>
      <MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} fogEnabled={false} label={`Prévia de ${map.name}`} />
      <h3 className="map-card-name">{map.name}</h3>
      <small className="map-card-meta">{mapSummary(map)}</small>
      <small className="map-card-meta">{map.mine ? 'Publicado por você' : `por ${map.authorName}`}</small>
      <div className="map-card-actions">
        {map.mine
          ? <button type="button" className="btn btn-primary btn-pill" onClick={onEdit}>Editar mapa</button>
          : <button type="button" className="btn btn-primary btn-pill" disabled={busy} onClick={onAdd}>Usar este mapa</button>}
        <button type="button" className="btn btn-outline btn-pill" onClick={onView}>Visualizar</button>
      </div>
    </article>
  )
}

/**
 * Oficina da Comunidade: mapas que outros mestres publicaram. "Usar este mapa" copia para a sua
 * biblioteca (a cópia é sua, pode ser editada à vontade); o original não muda.
 */
export function MapWorkshopScreen() {
  const { navigate, showToast } = useAppStore()
  const { community, loading, loadCommunity, copy, edit } = useMaps()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<MapKind | ''>('')
  const [viewing, setViewing] = useState<MapItem | null>(null)
  const [busy, setBusy] = useState(false)

  // busca com um pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => { loadCommunity(query.trim(), kind) }, query ? 250 : 0)
    return () => clearTimeout(t)
  }, [query, kind, loadCommunity])

  async function add(m: MapItem) {
    setBusy(true)
    const res = await copy(m.id)
    setBusy(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setViewing(null)
    showToast('Mapa adicionado à sua biblioteca.', 'success')
    edit(res.map.id)
    navigate('mapa-editor')
  }
  const editMine = (m: MapItem) => { edit(m.id); navigate('mapa-editor') }

  return (
    <div className="device">
      <AppHeader title="Oficina de mapas" onBack={() => navigate('mapas')} />

      <div className="page-body map-page">
        <div className="list-toolbar map-toolbar">
          <label className="search-box">
            <IconSearch />
            <input type="search" placeholder="Buscar mapa" value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar mapa na Oficina" />
          </label>
          <select className="form-input map-kind-filter" value={kind} onChange={e => setKind(e.target.value as MapKind | '')} aria-label="Filtrar por tipo">
            <option value="">Todos os tipos</option>
            {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>

        {community.length === 0 && !loading ? (
          query || kind
            ? <StateView kind="noresults" title="Nada encontrado" text="Nenhum mapa publicado combina com a busca."
                         actions={[{ label: 'Limpar filtros', primary: true, onClick: () => { setQuery(''); setKind('') } }]} />
            : <StateView kind="empty" title="A Oficina está vazia" text="Publique um dos seus mapas pelo editor ou pelo botão Gerenciar para ele aparecer aqui."
                         actions={[{ label: 'Voltar aos meus mapas', primary: true, onClick: () => navigate('mapas') }]} />
        ) : (
          <div className="map-grid">
            {community.map(m => (
              <WorkshopCard key={m.id} map={m} busy={busy} onView={() => setViewing(m)} onAdd={() => add(m)} onEdit={() => editMine(m)} />
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <MapPreviewModal map={viewing} onClose={() => setViewing(null)}>
          <div className="tm-actions">
            <button type="button" className="btn btn-outline" onClick={() => setViewing(null)}>Fechar</button>
            {!viewing.mine && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => add(viewing)}>Usar este mapa</button>}
          </div>
        </MapPreviewModal>
      )}
    </div>
  )
}
