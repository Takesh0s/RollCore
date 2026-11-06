import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { DiceLogo } from '@/components/ui/DiceLogo'
import { TableBanner } from '@/components/tables/TableBanner'
import { IconScroll, IconPlus, IconSheets, IconCommunity, IconWand, IconNotes } from '@/components/ui/icons'

/** Atalhos que já existem no Figma mas ainda não têm tela no web. */
const COMING_SOON = [
  { label: 'Comunidade', icon: <IconCommunity className="dash-card-icon" /> },
  { label: 'GM Tools',   icon: <IconWand className="dash-card-icon" /> },
  { label: 'Anotações',  icon: <IconNotes className="dash-card-icon" /> },
]

/**
 * Tela inicial, no layout do Figma: faixa de Mesas e os atalhos grandes
 * (Rolar Dados, Fichas, Comunidade, GM Tools e Anotações).
 */
export function DashboardScreen() {
  const { navigate, tables, loadTables, openTable, characters, history, showToast } = useAppStore()
  const lastRoll = history[0] ?? null

  useEffect(() => { loadTables() }, [loadTables])

  return (
    <div className="device">
      <AppHeader title="RollCore" />

      <div className="page-body wide">
        <div className="home-section-head">
          <button className="home-icon-btn" aria-label="Ver mesas" onClick={() => navigate('mesas')}>
            <IconScroll />
          </button>
          <h2>Mesas</h2>
          <button className="home-icon-btn" aria-label="Criar mesa" onClick={() => navigate('nova-mesa')}>
            <IconPlus />
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="home-mesas">
            <strong>Nenhuma mesa por aqui</strong>
            <span>Toque no + para criar a sua primeira mesa.</span>
          </div>
        ) : (
          <>
            {tables.slice(0, 2).map(t => (
              <TableBanner key={t.id} table={t} onEnter={() => openTable(t.id)} />
            ))}
            {tables.length > 2 && (
              <button className="link-btn" style={{ marginBottom: 14 }} onClick={() => navigate('mesas')}>
                ver todas as mesas ({tables.length})
              </button>
            )}
          </>
        )}

        <div className="dash-grid">
          <button className="dash-card" onClick={() => navigate('dados')}>
            <DiceLogo className="dash-card-icon mint" />
            <h3>Rolar Dados</h3>
            <p>
              {lastRoll
                ? `Último: ${lastRoll.formula ?? `d${lastRoll.result.sides}`} = ${lastRoll.result.total}`
                : 'Faça sua primeira rolagem'}
            </p>
          </button>

          <button className="dash-card" onClick={() => navigate('personagens')}>
            <IconSheets className="dash-card-icon" />
            <h3>Fichas</h3>
            <p>
              {characters.length === 0 ? 'Criar primeira ficha'
                : characters.length === 1 ? '1 personagem'
                : `${characters.length} personagens`}
            </p>
          </button>

          {COMING_SOON.map(item => (
            <button
              key={item.label}
              className="dash-card soon"
              onClick={() => showToast(`${item.label} chega em breve.`)}
            >
              {item.icon}
              <h3>{item.label}</h3>
              <p>Em breve</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
