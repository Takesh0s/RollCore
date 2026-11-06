import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus, IconSearch } from '@/components/ui/icons'
import { TableBanner } from '@/components/tables/TableBanner'

/** Lista de mesas do usuário, com busca por nome. */
export function TableListScreen() {
  const { tables, loadTables, openTable, navigate } = useAppStore()
  const [query, setQuery] = useState('')

  useEffect(() => { loadTables() }, [loadTables])

  const q = query.trim().toLowerCase()
  const shown = q ? tables.filter(t => t.name.toLowerCase().includes(q)) : tables

  return (
    <div className="device">
      <AppHeader title="Mesas" />

      <div className="page-body">
        <div className="list-toolbar">
          <label className="search-box">
            <IconSearch />
            <input
              type="search"
              placeholder="Buscar mesa"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Buscar mesa"
            />
          </label>
          <button className="home-icon-btn" aria-label="Criar mesa" onClick={() => navigate('nova-mesa')}>
            <IconPlus />
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center' }}>
            <p>Você ainda não participa de nenhuma mesa.</p>
            <button className="btn btn-primary" onClick={() => navigate('nova-mesa')}>
              Criar mesa
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center' }}>
            <p>Nenhuma mesa com esse nome.</p>
          </div>
        ) : (
          <div className="table-grid">
            {shown.map(t => <TableBanner key={t.id} table={t} onEnter={() => openTable(t.id)} />)}
          </div>
        )}
      </div>
    </div>
  )
}
