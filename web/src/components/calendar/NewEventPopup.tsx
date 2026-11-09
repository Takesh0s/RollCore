import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCalendar } from '@/store/useCalendar'
import { Shell } from '@/components/tables/TableModals'
import { confirmedCount, dayLabel, rangeLabel } from '@/lib/calendar'

const SEEN_KEY = 'rollcore_seen_event_popups'
const FRESH_MS = 24 * 3600 * 1000

function readSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') } catch { return [] }
}
function markSeen(id: string) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...readSeen(), id].slice(-50))) } catch { /* sem armazenamento: o aviso só reaparece */ }
}

/** Aviso "Novo evento na mesa" (Figma 06.3): aparece no Início quando alguém agenda algo e você ainda não viu. */
export function NewEventPopup() {
  const { screen, notifications, markNotificationRead, navigate } = useAppStore()
  const { events, load, select } = useCalendar()
  const [seen, setSeen] = useState<string[]>(readSeen)

  const note = screen === 'dashboard'
    ? notifications.find(n => n.type === 'EVENT_CREATED' && !n.read && n.eventId
        && Date.now() - new Date(n.createdAt).getTime() < FRESH_MS && !seen.includes(n.id))
    : undefined
  const event = note ? events.find(e => e.id === note.eventId) : undefined

  useEffect(() => { if (note && !event) load() }, [note, event, load])

  if (!note || !event) return null

  /** "Ver mais tarde": some do Início, mas a notificação continua não lida na central. */
  function later() {
    markSeen(note!.id)
    setSeen(readSeen())
  }
  function go() {
    later()
    markNotificationRead(note!.id)
    select(event!.id)
    navigate('evento')
  }

  return (
    <Shell title="Novo evento na mesa" onClose={later}>
      <p className="tm-text">
        {note.actorName ?? 'Alguém'} criou um novo evento: {event.title}, na mesa {event.tableName}
        {event.askRsvp ? ', e precisa que você confirme a presença.' : '.'}
      </p>
      <div className="evp-card">
        <div>
          <strong>{dayLabel(event.date)} · {rangeLabel(event)}</strong>
          <small>{confirmedCount(event)}/{event.guests.length} confirmados</small>
        </div>
      </div>
      <div className="tm-actions">
        <button type="button" className="btn btn-primary" onClick={go}>Ir para o evento</button>
        <button type="button" className="btn btn-outline" onClick={later}>Ver mais tarde</button>
      </div>
    </Shell>
  )
}
