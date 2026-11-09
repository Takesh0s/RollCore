import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCalendar } from '@/store/useCalendar'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus } from '@/components/ui/icons'
import { useDesktop } from '@/hooks/useDesktop'
import { EventModal, RsvpBadge } from './EventModal'
import {
  EVENT_COLORS, WEEKDAY_HEADERS, addDays, dayLabel, dayLabelLong, hourLabel, monthGrid, monthTitle,
  myStatus, occurrencesBetween, rangeLabel, sameDay, startOfWeek, tableLegend, toISO, upcoming, type Occurrence,
} from '@/lib/calendar'

type View = 'month' | 'week' | 'day'
const VIEWS: [View, string][] = [['month', 'Mês'], ['week', 'Semana'], ['day', 'Dia']]

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={dir === 'l' ? '15 5 8 12 15 19' : '9 5 16 12 9 19'} />
  </svg>
)

/** Calendário de sessões: mês, semana e dia, próximos eventos e legenda das mesas. */
export function CalendarScreen() {
  const { navigate, user, loadTables } = useAppStore()
  const events = useCalendar(s => s.events)
  const loadEvents = useCalendar(s => s.load)
  const tables = useAppStore(s => s.tables)
  const canCreate = tables.some(t => t.myRole !== 'PLAYER')
  const today = useMemo(() => new Date(), [])
  const desktop = useDesktop()
  const [pickedView, setView] = useState<View>('month')
  const view: View = desktop ? pickedView : 'month'   // no celular só há o mês, como no Figma
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [picked, setPicked] = useState<string | null>(null)       // dia tocado (celular)
  const [open, setOpen] = useState<Occurrence | null>(null)

  useEffect(() => { loadTables(); loadEvents() }, [loadTables, loadEvents])

  const grid = useMemo(() => monthGrid(anchor), [anchor])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)), [anchor])
  const range: [Date, Date] = view === 'month' ? [grid[0], grid[grid.length - 1]]
    : view === 'week' ? [weekDays[0], weekDays[6]] : [anchor, anchor]
  const occ = useMemo(() => occurrencesBetween(events, range[0], range[1]), [events, view, anchor]) // eslint-disable-line react-hooks/exhaustive-deps
  const byDay = useMemo(() => {
    const m = new Map<string, Occurrence[]>()
    occ.forEach(o => m.set(o.date, [...(m.get(o.date) ?? []), o]))
    return m
  }, [occ])
  const next = useMemo(() => upcoming(events, today, 5), [events, today])
  const legend = useMemo(() => tableLegend(events), [events])
  const shownNext = picked ? (byDay.get(picked) ?? []) : next

  function step(dir: -1 | 1) {
    setPicked(null)
    setAnchor(a => view === 'month' ? new Date(a.getFullYear(), a.getMonth() + dir, 1)
      : addDays(a, (view === 'week' ? 7 : 1) * dir))
  }
  const title = view === 'month' ? monthTitle(anchor)
    : view === 'week' ? `${dayLabel(toISO(weekDays[0]))} – ${dayLabel(toISO(weekDays[6]))}` : dayLabelLong(anchor)

  const chip = (o: Occurrence) => (
    <button key={o.event.id + o.date} type="button" className="cal-chip"
            style={{ background: EVENT_COLORS[o.event.color] }}
            onClick={e => { e.stopPropagation(); setOpen(o) }}
            title={`${o.event.title} · ${rangeLabel(o.event)}`}>
      {o.event.title} {hourLabel(o.event.start)}
    </button>
  )

  return (
    <div className="device">
      <AppHeader title="Calendário" />
      <div className="page-body cal-page">
        <div className="cal-layout">
          <section className="cal-main" aria-label="Calendário">
            <div className="cal-bar">
              <button type="button" className="cal-nav" onClick={() => step(-1)} aria-label="Anterior"><Chevron dir="l" /></button>
              <button type="button" className="cal-nav cal-nav-next" onClick={() => step(1)} aria-label="Próximo"><Chevron dir="r" /></button>
              <h2 className="cal-title" aria-live="polite">{title}</h2>
              <div className="cal-tabs" role="tablist" aria-label="Visualização">
                {VIEWS.map(([v, label]) => (
                  <button key={v} type="button" role="tab" aria-selected={view === v}
                          className={`cal-tab${view === v ? ' on' : ''}`} onClick={() => { setView(v); setPicked(null) }}>{label}</button>
                ))}
              </div>
            </div>

            {view === 'month' && (
              <div className="cal-grid" role="grid">
                {WEEKDAY_HEADERS.map(d => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
                {grid.map(d => {
                  const iso = toISO(d), list = byDay.get(iso) ?? []
                  const out = d.getMonth() !== anchor.getMonth()
                  return (
                    <div key={iso} role="gridcell" tabIndex={0}
                         className={`cal-cell${out ? ' out' : ''}${picked === iso ? ' picked' : ''}`}
                         onClick={() => list.length && setPicked(p => (p === iso ? null : iso))}
                         onKeyDown={e => { if (e.key === 'Enter' && list.length) setPicked(p => (p === iso ? null : iso)) }}>
                      <span className={`cal-num${sameDay(d, today) ? ' today' : ''}`}>{d.getDate()}</span>
                      <div className="cal-chips">{list.slice(0, 2).map(chip)}{list.length > 2 && <span className="cal-more">+{list.length - 2}</span>}</div>
                      <div className="cal-dots" aria-hidden="true">
                        {list.slice(0, 4).map(o => <i key={o.event.id} style={{ background: EVENT_COLORS[o.event.color] }} />)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {view === 'week' && (
              <div className="cal-week">
                {weekDays.map(d => {
                  const iso = toISO(d), list = byDay.get(iso) ?? []
                  return (
                    <div key={iso} className="cal-wcol">
                      <div className="cal-whead"><span>{WEEKDAY_HEADERS[d.getDay()]}</span>
                        <span className={`cal-num${sameDay(d, today) ? ' today' : ''}`}>{d.getDate()}</span></div>
                      <div className="cal-chips">{list.map(chip)}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {view === 'day' && (
              <ul className="cal-dayview">
                {(byDay.get(toISO(anchor)) ?? []).length === 0 && <li className="cal-empty">Nenhum evento neste dia.</li>}
                {(byDay.get(toISO(anchor)) ?? []).map(o => (
                  <li key={o.event.id}>
                    <button type="button" className="cal-item" style={{ ['--ev' as string]: EVENT_COLORS[o.event.color] }} onClick={() => setOpen(o)}>
                      <span className="cal-item-main"><strong>{o.event.title}</strong>
                        <small>{rangeLabel(o.event)} · {o.event.tableName}</small></span>
                      {o.event.askRsvp && <RsvpBadge status={myStatus(o.event, user.username)} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="cal-side">
            {canCreate && (
              <button type="button" className="btn btn-primary cal-create" onClick={() => navigate('novo-evento')}>
                <IconPlus /> Criar evento
              </button>
            )}

            <h3 className="section-title cal-side-title">{picked ? `Eventos de ${dayLabel(picked)}` : 'Próximos eventos'}</h3>
            {shownNext.length === 0 ? (
              <p className="cal-empty">{picked ? 'Nenhum evento neste dia.' : 'Nenhum evento marcado. Crie o primeiro!'}</p>
            ) : (
              <ul className="cal-list">
                {shownNext.map(o => (
                  <li key={o.event.id + o.date}>
                    <button type="button" className="cal-item" style={{ ['--ev' as string]: EVENT_COLORS[o.event.color] }} onClick={() => setOpen(o)}>
                      <span className="cal-item-main">
                        <strong>{o.event.title}</strong>
                        <small>{dayLabel(o.date)} · {hourLabel(o.event.start)}</small>
                      </span>
                      <span className="cal-item-right">
                        {o.event.askRsvp && <RsvpBadge status={myStatus(o.event, user.username)} />}
                        <span className="cal-details">Detalhes ›</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {legend.length > 0 && (
              <div className="cal-legend">
                <h4>Legenda das mesas</h4>
                <ul>{legend.map(l => <li key={l.tableId}><i style={{ background: EVENT_COLORS[l.color] }} />{l.name}</li>)}</ul>
              </div>
            )}
          </aside>
        </div>
      </div>
      {open && <EventModal event={open.event} date={open.date} onClose={() => setOpen(null)} />}
    </div>
  )
}
