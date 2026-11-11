import { create } from 'zustand';
import { ApiError, request } from '../services/api';
import { fromApi, type CalendarEvent, type EventApi, type EventColor, type Repeat, type Rsvp } from '../lib/calendar';

export interface NewEvent {
  title: string;
  date: string;
  start: string;
  end: string;
  repeat: Repeat;
  description: string;
  color: EventColor;
  askRsvp: boolean;
}

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  loaded: boolean;
  /** Evento aberto na página do evento. */
  selectedId: string | null;
  select: (id: string | null) => void;
  load: () => Promise<void>;
  add: (tableId: string, input: NewEvent) => Promise<{ ok: true } | { ok: false; error: string }>;
  remove: (id: string) => Promise<boolean>;
  respond: (id: string, status: Exclude<Rsvp, 'pending'>) => Promise<boolean>;
  clear: () => void;
}

const replace = (list: CalendarEvent[], next: CalendarEvent) => list.map((e) => (e.id === next.id ? next : e));

/** Eventos do calendário, guardados no servidor (mesmo contrato do web). */
export const useCalendar = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,
  loaded: false,
  selectedId: null,
  select: (id) => set({ selectedId: id }),

  async load() {
    set({ loading: true });
    try {
      const data = await request<EventApi[]>('/events');
      set({ events: data.map(fromApi), loaded: true });
    } catch {
      // mantém o que já está na tela; recarrega na próxima visita
    } finally {
      set({ loading: false });
    }
  },

  async add(tableId, input) {
    try {
      const data = await request<EventApi>(`/tables/${tableId}/events`, {
        method: 'POST',
        body: {
          title: input.title,
          description: input.description || undefined,
          date: input.date,
          start: input.start,
          end: input.end,
          repeat: input.repeat.toUpperCase(),
          color: input.color.toUpperCase(),
          askRsvp: input.askRsvp,
        },
      });
      set({ events: [...get().events, fromApi(data)] });
      return { ok: true };
    } catch (e) {
      const fields = e instanceof ApiError ? e.fields : undefined;
      const first = fields ? Object.values(fields)[0] : undefined;
      return { ok: false, error: first || (e instanceof ApiError && e.message) || 'Não foi possível criar o evento.' };
    }
  },

  async remove(id) {
    try {
      await request(`/events/${id}`, { method: 'DELETE' });
      set({ events: get().events.filter((e) => e.id !== id) });
      return true;
    } catch {
      return false;
    }
  },

  async respond(id, status) {
    try {
      const data = await request<EventApi>(`/events/${id}/rsvp`, { method: 'PUT', body: { status: status.toUpperCase() } });
      set({ events: replace(get().events, fromApi(data)) });
      return true;
    } catch {
      return false;
    }
  },

  clear: () => set({ events: [], loaded: false, loading: false, selectedId: null }),
}));
