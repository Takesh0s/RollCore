import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconBell } from '@/components/ui/icons'
import { StateView } from '@/components/ui/StateView'
import { useCalendar } from '@/store/useCalendar'
import type { AppNotification } from '@/types'

type Filter = 'all' | 'tables' | 'events'

const ROLE_WORD: Record<string, string> = { MODERATOR: 'moderador', PLAYER: 'jogador', MASTER: 'Mestre' }

/** Monta a frase a partir do tipo e dos dados guardados na notificação. */
export function notificationText(n: AppNotification): ReactNode {
  const who   = <strong>{n.actorName ?? 'Alguém'}</strong>
  const table = <strong>{n.tableName ?? 'uma mesa'}</strong>
  switch (n.type) {
    case 'MEMBER_JOINED':       return <>{who} entrou na mesa {table}.</>
    case 'MEMBER_LEFT':         return <>{who} saiu da mesa {table}.</>
    case 'ROLE_CHANGED':        return <>{who} mudou seu cargo em {table} para {ROLE_WORD[n.detail ?? ''] ?? 'outro cargo'}.</>
    case 'REMOVED_FROM_TABLE':  return <>Você foi removido da mesa {table}.</>
    case 'HOST_TRANSFERRED':    return <>{who} passou o cargo de Mestre de {table} para você.</>
    case 'TABLE_DELETED':       return <>{who} excluiu a mesa {table}.</>
    case 'EVENT_CREATED':       return <>{who} agendou <strong>{n.detail}</strong> em {table}.</>
  }
}

const isEvent = (n: AppNotification) => n.type === 'EVENT_CREATED'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
  if (min < 1)  return 'agora'
  if (min < 60) return rtf.format(-min, 'minute')
  const h = Math.round(min / 60)
  if (h < 24)   return rtf.format(-h, 'hour')
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function dayGroup(iso: string): 'Hoje' | 'Ontem' | 'Anteriores' {
  const d = new Date(iso)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(new Date()) - start(d)) / 86400000)
  return days <= 0 ? 'Hoje' : days === 1 ? 'Ontem' : 'Anteriores'
}

/** Central de notificações (Figma 02.2): mesas e eventos, com resumo e "marcar todas como lidas". */
export function NotificationsScreen() {
  const { notifications, unreadCount, loadNotifications, markNotificationRead, markAllNotificationsRead, openTable, navigate } = useAppStore()
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => { loadNotifications() }, [loadNotifications])

  const shown = useMemo(() => notifications.filter(n =>
    filter === 'all' ? true : filter === 'events' ? isEvent(n) : !isEvent(n)), [notifications, filter])

  const groups = (['Hoje', 'Ontem', 'Anteriores'] as const)
    .map(g => ({ label: g, items: shown.filter(n => dayGroup(n.createdAt) === g) }))
    .filter(g => g.items.length > 0)

  function open(n: AppNotification) {
    markNotificationRead(n.id)
    if (n.type === 'EVENT_CREATED' && n.eventId) { useCalendar.getState().select(n.eventId); navigate('evento') }
    else if (n.type === 'EVENT_CREATED') navigate('calendario')
    else if (n.tableId) openTable(n.tableId)
  }
  const canOpen = (n: AppNotification) => n.type === 'EVENT_CREATED' || !!n.tableId

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' }, { id: 'tables', label: 'Mesas' }, { id: 'events', label: 'Eventos' },
  ]

  return (
    <div className="device">
      <AppHeader title="Notificações" onBack={() => navigate('dashboard')} />

      <div className="page-body notif-body">
        <div className="notif-toolbar">
          <div className="notif-tabs" role="tablist" aria-label="Filtrar notificações">
            {tabs.map(t => (
              <button key={t.id} type="button" role="tab" aria-selected={filter === t.id}
                      className={`notif-tab${filter === t.id ? ' active' : ''}`} onClick={() => setFilter(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-pill notif-readall" disabled={unreadCount === 0}
                  onClick={markAllNotificationsRead}>
            Marcar todas como lidas
          </button>
        </div>

        <div className="notif-layout">
          <div className="notif-list">
            {groups.length === 0 && (
              filter === 'all'
                ? <StateView kind="empty" title="Nada por aqui" text="Quando algo acontecer nas suas mesas, você vê aqui." />
                : <StateView kind="noresults" title="Nada encontrado" text="Não há notificações dessa categoria."
                             actions={[{ label: 'Limpar filtros', primary: true, onClick: () => setFilter('all') }]} />
            )}
            {groups.map(g => (
              <section key={g.label} aria-label={g.label}>
                <h2 className="section-title">{g.label}</h2>
                {g.items.map(n => (
                  <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                    <span className="notif-icon" aria-hidden="true"><IconBell /></span>
                    <div className="notif-text">
                      <p>{notificationText(n)}</p>
                      <small>{relativeTime(n.createdAt)}</small>
                    </div>
                    {canOpen(n) && (
                      <button type="button" className="btn btn-outline btn-pill notif-open" onClick={() => open(n)}>Abrir</button>
                    )}
                    {!n.read && (
                      <button type="button" className="notif-dot" aria-label="Marcar como lida" onClick={() => markNotificationRead(n.id)} />
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>

          <aside className="notif-summary" aria-label="Resumo">
            <h2>Resumo</h2>
            <div className="profile-row"><span>Não lidas</span><strong>{unreadCount}</strong></div>
            <div className="profile-row"><span>Mesas</span><strong>{notifications.filter(n => !isEvent(n)).length}</strong></div>
            <div className="profile-row"><span>Eventos</span><strong>{notifications.filter(isEvent).length}</strong></div>
          </aside>
        </div>
      </div>
    </div>
  )
}
