import { create } from 'zustand'
import { api } from '@/lib/api'
import { fromApi, type CalendarEvent, type EventApi, type EventColor, type Repeat, type Rsvp } from '@/lib/calendar'

export interface NewEvent {
  title: string
  date: string
  start: string
  end: string
  repeat: Repeat
  description: string
  color: EventColor
  askRsvp: boolean
}

interface CalendarState {
  events: CalendarEvent[]
  loading: boolean
  /** Carrega os eventos de todas as mesas do usuário. */
  load: () => Promise<void>
  /** Cria o evento na mesa; devolve null se falhar (com a mensagem do servidor em `error`). */
  add: (tableId: string, input: NewEvent) => Promise<{ ok: true } | { ok: false; error: string }>
  remove: (id: string) => Promise<boolean>
  respond: (id: string, status: Exclude<Rsvp, 'pending'>) => Promise<boolean>
}

const replace = (list: CalendarEvent[], next: CalendarEvent) => list.map(e => (e.id === next.id ? next : e))

/** Eventos do calendário, guardados no servidor: valem em qualquer aparelho. */
export const useCalendar = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,

  async load() {
    set({ loading: true })
    try {
      const { data } = await api.get<EventApi[]>('/events')
      set({ events: data.map(fromApi) })
    } catch {
      // mantém o que já está na tela; recarrega na próxima visita
    } finally {
      set({ loading: false })
    }
  },

  async add(tableId, input) {
    try {
      const { data } = await api.post<EventApi>(`/tables/${tableId}/events`, {
        title: input.title,
        description: input.description || undefined,
        date: input.date,
        start: input.start,
        end: input.end,
        repeat: input.repeat.toUpperCase(),
        color: input.color.toUpperCase(),
        askRsvp: input.askRsvp,
      })
      set({ events: [...get().events, fromApi(data)] })
      return { ok: true }
    } catch (err: any) {
      const fields = err.response?.data?.fields as Record<string, string> | undefined
      const error = (fields && Object.values(fields)[0]) || err.response?.data?.detail || 'Não foi possível criar o evento.'
      return { ok: false, error }
    }
  },

  async remove(id) {
    try {
      await api.delete(`/events/${id}`)
      set({ events: get().events.filter(e => e.id !== id) })
      return true
    } catch { return false }
  },

  async respond(id, status) {
    try {
      const { data } = await api.put<EventApi>(`/events/${id}/rsvp`, { status: status.toUpperCase() })
      set({ events: replace(get().events, fromApi(data)) })
      return true
    } catch { return false }
  },
}))
