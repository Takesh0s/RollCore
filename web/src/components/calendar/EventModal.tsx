import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '@/store/useAppStore'
import { useCalendar } from '@/store/useCalendar'
import { EVENT_COLORS, RSVP_LABELS, confirmedCount, dayLabel, myStatus, rangeLabel, type CalendarEvent, type Rsvp } from '@/lib/calendar'
import { IconUser } from '@/components/ui/icons'

export function RsvpBadge({ status }: { status: Rsvp }) {
  return <span className={`cal-badge ${status}`}>{RSVP_LABELS[status].toUpperCase()}</span>
}

/** Detalhes do evento: quem confirmou, resposta do usuário e, para quem criou, exclusão. */
export function EventModal({ event, date, onClose }: { event: CalendarEvent; date: string; onClose: () => void }) {
  const user = useAppStore(s => s.user)
  const showToast = useAppStore(s => s.showToast)
  const { respond, remove } = useCalendar()
  const [askDelete, setAskDelete] = useState(false)
  const me = user.username
  const mine = myStatus(event, me)
  const canDelete = event.createdBy === me || useAppStore.getState().tables.find(t => t.id === event.tableId)?.myRole === 'MASTER'
  const total = event.guests.length
  const confirmed = confirmedCount(event)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function answer(status: 'yes' | 'no') {
    const ok = await respond(event.id, status)
    if (ok) showToast(status === 'yes' ? 'Presença confirmada.' : 'Você recusou o evento.', 'success')
    else showToast('Não foi possível enviar sua resposta. Tente de novo.', 'error')
  }
  async function del() {
    if (await remove(event.id)) {
      showToast('Evento excluído.', 'success')
      onClose()
    } else {
      showToast('Não foi possível excluir o evento.', 'error')
    }
  }

  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={event.title}
         onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-modal" style={{ ['--ev' as string]: EVENT_COLORS[event.color] }}>
        <h2 className="cal-modal-title">{event.title}</h2>
        <p className="cal-modal-when">{dayLabel(date)} · {rangeLabel(event)}</p>
        <p className="cal-modal-table">{event.tableName} · criado por {event.createdBy}</p>
        {event.description && <p className="cal-modal-desc">{event.description}</p>}
        <hr className="cal-modal-rule" />

        <h3 className="cal-modal-count">{confirmed}/{total} confirmados</h3>
        <div className="cal-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={confirmed}>
          <span style={{ width: total ? `${(confirmed / total) * 100}%` : 0 }} />
        </div>

        <ul className="cal-guests">
          {event.guests.map(g => (
            <li key={g}>
              {g === me && user.avatar_url
                ? <img className="cal-avatar" src={user.avatar_url} alt="" />
                : <span className="cal-avatar"><IconUser /></span>}
              <span className="cal-guest-name">{g}{g === me ? ' (você)' : g === event.createdBy ? ' (Mestre)' : ''}</span>
              <RsvpBadge status={event.rsvp[g] ?? 'pending'} />
            </li>
          ))}
        </ul>

        <p className="cal-note"><span aria-hidden="true">ⓘ</span> Apenas quem criou o evento ou o mestre da mesa pode cancelá-lo.</p>

        {event.askRsvp && (
          <div className="cal-modal-actions">
            <button type="button" className={`btn btn-primary${mine === 'yes' ? ' on' : ''}`} onClick={() => answer('yes')}>Confirmar</button>
            <button type="button" className="btn btn-danger-fill" onClick={() => answer('no')}>Recusar</button>
          </div>
        )}
        {canDelete && (
          <button type="button" className="cal-delete" onClick={() => (askDelete ? del() : setAskDelete(true))}>
            {askDelete ? 'Toque de novo para excluir' : 'Excluir evento'}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
