import { create } from 'zustand'
import { api } from '@/lib/api'
import type { GridType, MapKind } from '@/lib/maps'

/** Mapa como a API devolve (`layers` é o JSON da pintura, em texto). */
export interface MapItem {
  id: string
  name: string
  kind: MapKind
  gridType: GridType
  cols: number
  rows: number
  cellSize: number
  imageUrl: string | null
  layers: string
  gridVisible: boolean
  fogEnabled: boolean
  published: boolean
  authorName: string
  mine: boolean
  updatedAt: string
}

/** Corpo de criar/salvar; `imageId` é o id devolvido pelo envio da imagem. */
export interface MapBody {
  name: string
  kind: MapKind
  gridType: GridType
  cols: number
  rows: number
  cellSize: number
  imageId?: string | null
  layers: string
  gridVisible: boolean
  fogEnabled: boolean
}

type Result = { ok: true; map: MapItem } | { ok: false; error: string }

/** Mensagem do servidor (campo inválido, limite…) ou a padrão. */
function errorOf(err: any, fallback: string): string {
  const fields = err?.response?.data?.fields as Record<string, string> | undefined
  return (fields && Object.values(fields)[0]) || err?.response?.data?.detail || fallback
}

/** `/images/{id}` → `{id}`. */
export const imageIdOf = (url: string | null | undefined) => (url ? url.split('/').pop() ?? null : null)

/** Corpo para salvar um mapa já existente, mudando só o que veio em `patch`. */
export const bodyOf = (m: MapItem, patch: Partial<MapBody> = {}): MapBody => ({
  name: m.name, kind: m.kind, gridType: m.gridType, cols: m.cols, rows: m.rows, cellSize: m.cellSize,
  imageId: imageIdOf(m.imageUrl), layers: m.layers, gridVisible: m.gridVisible, fogEnabled: m.fogEnabled,
  ...patch,
})

interface MapsState {
  maps: MapItem[]
  community: MapItem[]
  loading: boolean
  /** Mapa aberto no editor. */
  editingId: string | null
  edit: (id: string | null) => void
  load: () => Promise<void>
  loadCommunity: (q: string, kind: MapKind | '') => Promise<void>
  get: (id: string) => Promise<MapItem | null>
  create: (body: MapBody) => Promise<Result>
  save: (id: string, body: MapBody) => Promise<Result>
  remove: (id: string) => Promise<boolean>
  setPublished: (id: string, published: boolean) => Promise<Result>
  copy: (id: string) => Promise<Result>
}

const put = (list: MapItem[], next: MapItem) => (list.some(m => m.id === next.id) ? list.map(m => (m.id === next.id ? next : m)) : [next, ...list])

/** Mapas do usuário e a Oficina da Comunidade, guardados no servidor. */
export const useMaps = create<MapsState>((set, get) => ({
  maps: [],
  community: [],
  loading: false,
  editingId: null,
  edit(id) { set({ editingId: id }) },

  async load() {
    set({ loading: true })
    try {
      const { data } = await api.get<MapItem[]>('/maps')
      set({ maps: data })
    } catch {
      // mantém o que já está na tela; recarrega na próxima visita
    } finally {
      set({ loading: false })
    }
  },

  async loadCommunity(q, kind) {
    set({ loading: true })
    try {
      const { data } = await api.get<MapItem[]>('/maps/community', { params: { q: q || undefined, kind: kind || undefined } })
      set({ community: data })
    } catch {
      // idem
    } finally {
      set({ loading: false })
    }
  },

  async get(id) {
    const known = get().maps.find(m => m.id === id)
    if (known) return known
    try {
      const { data } = await api.get<MapItem>(`/maps/${id}`)
      return data
    } catch {
      return null
    }
  },

  async create(body) {
    try {
      const { data } = await api.post<MapItem>('/maps', body)
      set({ maps: put(get().maps, data) })
      return { ok: true, map: data }
    } catch (err) {
      return { ok: false, error: errorOf(err, 'Não foi possível criar o mapa.') }
    }
  },

  async save(id, body) {
    try {
      const { data } = await api.put<MapItem>(`/maps/${id}`, body)
      set({ maps: put(get().maps, data) })
      return { ok: true, map: data }
    } catch (err) {
      return { ok: false, error: errorOf(err, 'Não foi possível salvar o mapa.') }
    }
  },

  async remove(id) {
    try {
      await api.delete(`/maps/${id}`)
      set({ maps: get().maps.filter(m => m.id !== id) })
      return true
    } catch {
      return false
    }
  },

  async setPublished(id, published) {
    try {
      const { data } = await api.post<MapItem>(`/maps/${id}/${published ? 'publish' : 'unpublish'}`)
      set({ maps: put(get().maps, data) })
      return { ok: true, map: data }
    } catch (err) {
      return { ok: false, error: errorOf(err, 'Não foi possível atualizar a Oficina.') }
    }
  },

  async copy(id) {
    try {
      const { data } = await api.post<MapItem>(`/maps/${id}/copy`)
      set({ maps: put(get().maps, data) })
      return { ok: true, map: data }
    } catch (err) {
      return { ok: false, error: errorOf(err, 'Não foi possível copiar o mapa.') }
    }
  },
}))
