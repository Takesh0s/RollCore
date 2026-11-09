import { create } from 'zustand'
import { loadEvents, saveEvents, type CalendarEvent, type Rsvp } from '@/lib/calendar'

interface CalendarState {
  events: CalendarEvent[]
  add: (e: CalendarEvent) => void
  remove: (id: string) => void
  respond: (id: string, username: string, status: Rsvp) => void
}

/** Eventos do calendário (guardados neste aparelho enquanto a API não existe). */
export const useCalendar = create<CalendarState>((set, get) => {
  const commit = (events: CalendarEvent[]) => { saveEvents(events); set({ events }) }
  return {
    events: loadEvents(),
    add: e => commit([...get().events, e]),
    remove: id => commit(get().events.filter(e => e.id !== id)),
    respond: (id, username, status) =>
      commit(get().events.map(e => (e.id === id ? { ...e, rsvp: { ...e.rsvp, [username]: status } } : e))),
  }
})
