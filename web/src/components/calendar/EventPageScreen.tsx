import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCalendar } from '@/store/useCalendar'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconUser } from '@/components/ui/icons'
import { Loader } from '@/components/ui/Loader'
import { StateView } from '@/components/ui/StateView'
import { RsvpBadge } from './EventModal'
import { confirmedCount, dayLabel, myStatus, rangeLabel, type Rsvp } from '@/lib/calendar'

const ANSWERS: { status: Exclude<Rsvp, 'pending'>; label: string; ok: string }[] = [
  { status: 'yes',   label: 'Vou',     ok: 'Presença confirmada.' },
  { status: 'maybe', label: 'Talvez',  ok: 'Resposta enviada: talvez.' },
  { status: 'no',    label: 'Não vou', ok: 'Você recusou o evento.' },
]

/** Página do evento (Figma 19.6): quantos foram convidados e confirmaram, sua resposta e a lista de respostas. */
export function EventPageScreen() {
  const { navigate, user, showToast } = useAppStore()
  const { events, selectedId, load, respond, loading } = useCalendar()
  const event = events.find(e => e.id === selectedId)

  useEffect(() => { if (!event) load() }, [event, load])

  if (!event) {
    return (
      <div className="device">
        <AppHeader title="Evento" onBack={() => navigate('calendario')} />
        <div className="page-body">
          {loading
            ? <Loader label="Carregando evento" />
            : <StateView kind="notfound" title="Evento não encontrado" text="Ele pode ter sido cancelado."
                         actions={[{ label: 'Voltar ao calendário', primary: true, onClick: () => navigate('calendario') }]} />}
        </div>
      </div>
    )
  }

  const mine = myStatus(event, user.username)
  const invited = event.guests.length
  const confirmed = confirmedCount(event)

  async function answer(a: typeof ANSWERS[number]) {
    if (await respond(event!.id, a.status)) showToast(a.ok, 'success')
    else showToast('Não foi possível enviar sua resposta. Tente de novo.', 'error')
  }

  return (
    <div className="device">
      <AppHeader title="Evento" onBack={() => navigate('calendario')} />
      <div className="page-body evp-body">
        <div className="evp-card">
          <div>
            <strong>{event.tableName} · {event.title}</strong>
            <small>{dayLabel(event.date)} · {rangeLabel(event)}</small>
          </div>
        </div>
        {event.description && <p className="table-description">{event.description}</p>}

        <div className="evp-stats">
          <div className="evp-stat"><strong>{invited}</strong><span>convidados</span></div>
          <div className="evp-stat"><strong>{confirmed}</strong><span>confirmados</span></div>
        </div>

        {event.askRsvp && (
          <>
            <h2 className="evp-q">Você vai?</h2>
            <div className="evp-answers" role="group" aria-label="Você vai?">
              {ANSWERS.map(a => (
                <button key={a.status} type="button" aria-pressed={mine === a.status}
                        className={`btn btn-pill ${mine === a.status ? 'btn-primary' : 'btn-outline'}`} onClick={() => answer(a)}>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="evp-list">
          <h2>Confirmações</h2>
          <ul className="cal-guests">
            {event.guests.map(g => (
              <li key={g}>
                <span className="cal-avatar"><IconUser /></span>
                <span className="cal-guest-name">{g}{g === user.username ? ' (você)' : g === event.createdBy ? ' (Mestre)' : ''}</span>
                <RsvpBadge status={event.rsvp[g] ?? 'pending'} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
