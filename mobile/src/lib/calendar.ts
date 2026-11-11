/** Calendário: modelo, conversão da API e datas. Os eventos vivem no servidor (GET /events). */

export type EventColor = 'red' | 'blue' | 'green' | 'amber' | 'teal' | 'purple'
export type Repeat = 'none' | 'weekly' | 'biweekly' | 'monthly'
export type Rsvp = 'yes' | 'maybe' | 'no' | 'pending'

export const EVENT_COLORS: Record<EventColor, string> = {
  red: '#A32A2E', blue: '#2F6F9F', green: '#3B8A58', amber: '#A67C1A', teal: '#2A8680', purple: '#6D4DA3',
}
export const COLOR_ORDER = Object.keys(EVENT_COLORS) as EventColor[]
export const COLOR_NAMES: Record<EventColor, string> = {
  red: 'Vermelho', blue: 'Azul', green: 'Verde', amber: 'Âmbar', teal: 'Verde-água', purple: 'Roxo',
}
export const REPEAT_LABELS: Record<Repeat, string> = {
  none: 'Não repetir', weekly: 'Toda semana', biweekly: 'A cada 2 semanas', monthly: 'Todo mês',
}
export const RSVP_LABELS: Record<Rsvp, string> = { yes: 'Confirmado', maybe: 'Talvez', no: 'Recusado', pending: 'Pendente' }

export interface CalendarEvent {
  id: string
  title: string
  tableId: string
  tableName: string
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  start: string
  end: string
  repeat: Repeat
  description: string
  color: EventColor
  askRsvp: boolean
  createdBy: string
  /** usernames convidados (inclui quem criou) */
  guests: string[]
  /** username -> resposta */
  rsvp: Record<string, Rsvp>
}

/** Uma ocorrência de um evento em um dia (eventos que se repetem têm várias). */
export interface Occurrence { event: CalendarEvent; date: string }

/** Evento como a API devolve (enums em maiúsculas, horas HH:mm). */
export interface EventApi {
  id: string
  tableId: string
  tableName: string
  title: string
  description: string | null
  date: string
  start: string
  end: string
  repeat: string
  color: string
  askRsvp: boolean
  createdBy: string
  guests: string[]
  rsvp: Record<string, string>
}

export function fromApi(e: EventApi): CalendarEvent {
  const rsvp: Record<string, Rsvp> = {}
  for (const [user, status] of Object.entries(e.rsvp ?? {})) rsvp[user] = status.toLowerCase() as Rsvp
  return {
    id: e.id, title: e.title, tableId: e.tableId, tableName: e.tableName, date: e.date,
    start: e.start.slice(0, 5), end: e.end.slice(0, 5),
    repeat: e.repeat.toLowerCase() as Repeat, description: e.description ?? '',
    color: e.color.toLowerCase() as EventColor, askRsvp: e.askRsvp, createdBy: e.createdBy,
    guests: e.guests ?? [], rsvp,
  }
}

// ── Datas (sempre no fuso local, sem converter por UTC) ───────────────────────

const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const startOfWeek = (d: Date) => addDays(d, -d.getDay())
export const sameDay = (a: Date, b: Date) => toISO(a) === toISO(b)

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const WEEKDAY_HEADERS = WEEKDAYS
export const monthTitle = (d: Date) => `${MONTHS[d.getMonth()][0].toUpperCase()}${MONTHS[d.getMonth()].slice(1)} ${d.getFullYear()}`
const monthShort = (d: Date) => MONTHS[d.getMonth()].slice(0, 3)

/** "Sex, 6 nov" */
export const dayLabel = (iso: string) => { const d = fromISO(iso); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${monthShort(d)}` }
/** "Sexta, 6 de novembro" */
export const dayLabelLong = (d: Date) => `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
/** "21h" ou "20h30" */
export function hourLabel(hhmm: string) { const [h, m] = hhmm.split(':'); return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}` }
/** "20h – 23h" */
export const rangeLabel = (e: Pick<CalendarEvent, 'start' | 'end'>) => `${hourLabel(e.start)} – ${hourLabel(e.end)}`

/** Semanas (domingo a sábado) que cobrem o mês, como no Figma (5 ou 6 linhas). */
export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = startOfWeek(first)
  const days = Math.ceil((last.getTime() - start.getTime()) / 86400000 + 1)
  const total = Math.ceil(days / 7) * 7
  return Array.from({ length: total }, (_, i) => addDays(start, i))
}

/** Ocorrências de todos os eventos entre duas datas (inclusive), em ordem de data e hora. */
export function occurrencesBetween(events: CalendarEvent[], from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = []
  const f = toISO(from), t = toISO(to)
  for (const ev of events) {
    const base = fromISO(ev.date)
    if (ev.repeat === 'none') {
      if (ev.date >= f && ev.date <= t) out.push({ event: ev, date: ev.date })
      continue
    }
    if (ev.date > t) continue
    if (ev.repeat === 'monthly') {
      let m = new Date(base.getFullYear(), base.getMonth(), 1)
      for (let guard = 0; guard < 600 && toISO(m) <= t; guard++) {
        const d = new Date(m.getFullYear(), m.getMonth(), base.getDate())
        // pula meses sem esse dia (ex.: 31)
        if (d.getMonth() === m.getMonth()) { const iso = toISO(d); if (iso >= ev.date && iso >= f && iso <= t) out.push({ event: ev, date: iso }) }
        m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
      }
      continue
    }
    const step = ev.repeat === 'weekly' ? 7 : 14
    const diff = Math.max(0, Math.ceil((from.getTime() - base.getTime()) / 86400000 / step))
    for (let d = addDays(base, diff * step); toISO(d) <= t; d = addDays(d, step)) out.push({ event: ev, date: toISO(d) })
  }
  return out.sort((a, b) => (a.date + a.event.start).localeCompare(b.date + b.event.start))
}

/** Próximas ocorrências a partir de hoje (aqui contam também as de hoje que ainda não acabaram). */
export function upcoming(events: CalendarEvent[], now: Date, limit = 5): Occurrence[] {
  const today = toISO(now)
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  return occurrencesBetween(events, now, addDays(now, 370))
    .filter(o => o.date > today || o.event.end >= hhmm)
    .slice(0, limit)
}

/** Cor de cada mesa na legenda: a do primeiro evento dela. */
export function tableLegend(events: CalendarEvent[]): { tableId: string; name: string; color: EventColor }[] {
  const seen = new Map<string, { tableId: string; name: string; color: EventColor }>()
  for (const e of events) if (!seen.has(e.tableId)) seen.set(e.tableId, { tableId: e.tableId, name: e.tableName, color: e.color })
  return [...seen.values()]
}

export function myStatus(e: CalendarEvent, username: string): Rsvp {
  return e.rsvp[username] ?? 'pending'
}
export const confirmedCount = (e: CalendarEvent) => e.guests.filter(g => e.rsvp[g] === 'yes').length
