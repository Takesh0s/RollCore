import type { TableSummary } from '@/types'
import { imageSrc } from '@/lib/image'
import { storage } from '@/lib/storage'
import { NavIcon } from '@/components/ui/NavIcon'

export const hasCover = (t: TableSummary) => !!(t.coverUrl || storage.getTableCovers()[t.id])

/** Miniatura da mesa: a capa, quando existe; senão o ícone de Mesas do tema atual. */
export function TableCover({ table, className }: { table: TableSummary; className: string }) {
  const cover = imageSrc(table.coverUrl) ?? storage.getTableCovers()[table.id] ?? null
  return (
    <div className={`${className}${cover ? ' has-cover' : ''}`} style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
         role={cover ? 'img' : undefined} aria-label={cover ? `Capa de ${table.name}` : undefined}>
      {!cover && <NavIcon name="tables" />}
    </div>
  )
}
