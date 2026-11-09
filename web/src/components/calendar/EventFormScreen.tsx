import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useCalendar } from '@/store/useCalendar'
import { AppHeader } from '@/components/ui/AppHeader'
import {
  COLOR_NAMES, COLOR_ORDER, EVENT_COLORS, REPEAT_LABELS, dayLabel, rangeLabel, toISO,
  type CalendarEvent, type EventColor, type Repeat,
} from '@/lib/calendar'
import { RsvpBadge } from './EventModal'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'

const REPEATS = Object.keys(REPEAT_LABELS) as Repeat[]

/** Criar evento: formulário e, no computador, pré-visualização do cartão como ele aparece no calendário. */
export function EventFormScreen() {
  const { tables: allTables, loadTables, navigate, showToast } = useAppStore()
  // só o mestre e os moderadores marcam eventos
  const tables = allTables.filter(t => t.myRole !== 'PLAYER')
  const [saving, setSaving] = useState(false)
  const add = useCalendar(s => s.add)
  const [title, setTitle] = useState('')
  const [tableId, setTableId] = useState('')
  const [date, setDate] = useState(() => toISO(new Date()))
  const [start, setStart] = useState('20:00')
  const [end, setEnd] = useState('23:00')
  const [repeat, setRepeat] = useState<Repeat>('none')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<EventColor>('blue')
  const [askRsvp, setAskRsvp] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { loadTables() }, [loadTables])
  useEffect(() => { if (!tableId && tables[0]) setTableId(tables[0].id) }, [tables, tableId])

  const table = tables.find(t => t.id === tableId)
  useUnsavedGuard(!!(title.trim() || description.trim()), `Você começou a criar ${title.trim() || 'um evento'} e ainda não salvou.`)

  async function save() {
    const e: Record<string, string> = {}
    const name = title.trim()
    if (name.length < 3 || name.length > 100) e.title = 'O nome do evento deve ter de 3 a 100 caracteres.'
    if (!table) e.table = 'Escolha a mesa do evento.'
    if (!date) e.date = 'Informe a data.'
    if (!start || !end) e.time = 'Informe o início e o fim.'
    else if (end <= start) e.time = 'O fim deve ser depois do início.'
    setErrors(e)
    if (Object.keys(e).length || !table) return

    setSaving(true)
    const res = await add(table.id, { title: name, date, start, end, repeat, description: description.trim(), color, askRsvp })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    useAppStore.getState().setDirty(null)
    showToast('Evento criado.', 'success')
    navigate('calendario')
  }

  const preview: Pick<CalendarEvent, 'start' | 'end'> = { start, end }

  return (
    <div className="device">
      <AppHeader title="Criar evento" onBack={() => navigate('calendario')} />
      <div className="page-body cal-form-page">
        <div className="cal-form-layout">
          <form className="cal-form" onSubmit={e => { e.preventDefault(); save() }} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="ev-title">Nome do evento:</label>
              <input id="ev-title" className={`form-input${errors.title ? ' error' : ''}`} value={title} maxLength={100}
                     onChange={e => setTitle(e.target.value)} placeholder="Ex.: Sessão 13" />
              {errors.title && <small className="field-error">{errors.title}</small>}
            </div>

            <div className="cal-fields">
              <div className="form-group cal-f-table">
                <label className="form-label" htmlFor="ev-table">Mesa / comunidade</label>
                <select id="ev-table" className={`form-input${errors.table ? ' error' : ''}`} value={tableId} onChange={e => setTableId(e.target.value)}>
                  {tables.length === 0 && <option value="">Só o mestre ou moderador de uma mesa cria eventos</option>}
                  {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.table && <small className="field-error">{errors.table}</small>}
              </div>
              <div className="form-group cal-f-date">
                <label className="form-label" htmlFor="ev-date">Data do evento</label>
                <input id="ev-date" type="date" className={`form-input${errors.date ? ' error' : ''}`} value={date} onChange={e => setDate(e.target.value)} />
                {errors.date && <small className="field-error">{errors.date}</small>}
              </div>
              <div className="form-group cal-f-start">
                <label className="form-label" htmlFor="ev-start">Início</label>
                <input id="ev-start" type="time" className={`form-input${errors.time ? ' error' : ''}`} value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="form-group cal-f-end">
                <label className="form-label" htmlFor="ev-end">Fim</label>
                <input id="ev-end" type="time" className={`form-input${errors.time ? ' error' : ''}`} value={end} onChange={e => setEnd(e.target.value)} />
              </div>
              <div className="form-group cal-f-repeat">
                <label className="form-label" htmlFor="ev-repeat">Repetir</label>
                <select id="ev-repeat" className="form-input" value={repeat} onChange={e => setRepeat(e.target.value as Repeat)}>
                  {REPEATS.map(r => <option key={r} value={r}>{REPEAT_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            {errors.time && <small className="field-error cal-time-error">{errors.time}</small>}

            <div className="form-group">
              <label className="form-label" htmlFor="ev-desc">Descrição do evento (Opcional)</label>
              <textarea id="ev-desc" className="form-input" value={description} maxLength={500} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="form-group">
              <span className="form-label" id="ev-color-label">Cor do evento</span>
              <div className="cal-colors" role="radiogroup" aria-labelledby="ev-color-label">
                {COLOR_ORDER.map(c => (
                  <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={COLOR_NAMES[c]}
                          className={`cal-color${color === c ? ' on' : ''}`} style={{ background: EVENT_COLORS[c] }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>

            <label className="cal-switch">
              <input type="checkbox" checked={askRsvp} onChange={e => setAskRsvp(e.target.checked)} />
              <span className="cal-switch-track" aria-hidden="true"><span /></span>
              Pedir confirmação de presença dos jogadores
            </label>

            <div className="cal-form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('calendario')}>Cancelar</button>
            </div>
          </form>

          <aside className="cal-form-side">
            <div className="cal-card">
              <h3>Pré-visualização</h3>
              <div className="cal-preview" style={{ ['--ev' as string]: EVENT_COLORS[color] }}>
                <strong>{title.trim() || 'Nome do evento'}</strong>
                <span>{date ? dayLabel(date) : '—'} · {rangeLabel(preview)}</span>
                <em>{table?.name ?? 'Escolha uma mesa'}</em>
                {askRsvp && <RsvpBadge status="pending" />}
              </div>
              <p className="cal-card-sub">Participantes convidados</p>
              <p className="cal-card-text">Você entra como confirmado. Os demais convidados aparecem quando o evento for sincronizado com a mesa.</p>
            </div>
            <div className="cal-card cal-tip">
              <h3>Dica</h3>
              <p>Todos os jogadores da mesa veem o evento e podem confirmar ou recusar a presença. A data e a hora valem como você digitou, sem conversão de fuso.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
