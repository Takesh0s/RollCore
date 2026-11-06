import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconSearch, IconFilter } from '@/components/ui/icons'

/**
 * Biblioteca de Mapas, no layout do Figma (busca, filtro, grade de mapas e "Adicionar mapa").
 * O backend ainda não guarda mapas, então a grade mostra o estado vazio.
 */
export function MapLibraryScreen() {
  const { navigate, showToast } = useAppStore()

  return (
    <div className="device">
      <AppHeader title="Biblioteca de mapas" onBack={() => navigate('nova-mesa')} />

      <div className="page-body profile-body">
        <div className="list-toolbar">
          <label className="search-box">
            <IconSearch />
            <input type="search" placeholder="Buscar mapa" disabled aria-label="Buscar mapa" />
          </label>
          <button className="home-icon-btn" aria-label="Filtrar" disabled><IconFilter /></button>
        </div>

        <div className="empty-state" style={{ textAlign: 'center' }}>
          <p>Nenhum mapa por aqui ainda.</p>
          <small className="field-hint">O envio de mapas chega junto com o armazenamento de imagens no backend.</small>
        </div>

        <div className="profile-logout-wrap">
          <button className="btn btn-primary" style={{ margin: 0 }} onClick={() => showToast('Adicionar mapas chega em breve.')}>
            Adicionar mapa
          </button>
        </div>
      </div>
    </div>
  )
}
