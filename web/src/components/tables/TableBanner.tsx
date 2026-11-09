import type { TableSummary } from '@/types'
import { imageSrc } from '@/lib/image'
import { storage } from '@/lib/storage'

/**
 * Faixa de uma mesa, como na lista do Figma: capa, nome por cima e botão "Entrar".
 * A capa vem da API (URL) ou da foto guardada neste aparelho; sem nenhuma, usa um degradê.
 */
export function TableBanner({ table, onEnter }: { table: TableSummary; onEnter: () => void }) {
  const cover = imageSrc(table.coverUrl) ?? storage.getTableCovers()[table.id] ?? null

  return (
    <div
      className={`table-banner${cover ? '' : ' no-cover'}`}
      style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
    >
      <span className="table-banner-name">{table.name}</span>
      <button className="btn btn-primary btn-pill table-banner-enter" onClick={onEnter}>
        Entrar
      </button>
    </div>
  )
}
