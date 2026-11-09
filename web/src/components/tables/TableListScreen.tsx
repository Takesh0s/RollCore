import { useEffect, useState } from 'react'
import { StateView } from '@/components/ui/StateView'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus, IconSearch } from '@/components/ui/icons'
import { TableBanner } from '@/components/tables/TableBanner'
import { JoinTableModal } from '@/components/tables/TableModals'

/** Lista de mesas do usuário, com busca por nome. */
export function TableListScreen() {
  const { tables, loadTables, openTable, navigate } = useAppStore()
  const [query, setQuery] = useState('')
  const [joining, setJoining] = useState(false)

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
          <button className="btn btn-outline btn-pill list-join" onClick={() => setJoining(true)}>Entrar com código</button>
          <button className="home-icon-btn" aria-label="Criar mesa" onClick={() => navigate('nova-mesa')}>
            <IconPlus />
          </button>
        </div>

        {tables.length === 0 ? (
          <StateView kind="empty" title="Nenhuma mesa ainda"
                     text="Crie uma mesa ou entre em uma para começar a jogar."
                     actions={[
                       { label: 'Criar mesa', primary: true, onClick: () => navigate('nova-mesa') },
                       { label: 'Entrar por código', onClick: () => setJoining(true) },
                     ]} />
        ) : shown.length === 0 ? (
          <StateView kind="noresults" title="Nada encontrado"
                     text="Tente outros termos ou ajuste a busca."
                     actions={[{ label: 'Limpar busca', primary: true, onClick: () => setQuery('') }]} />
        ) : (
          <div className="table-grid">
            {shown.map(t => <TableBanner key={t.id} table={t} onEnter={() => openTable(t.id)} />)}
          </div>
        )}
      </div>
      {joining && <JoinTableModal onClose={() => setJoining(false)} />}
    </div>
  )
}
