import { useState } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { Avatar, Btn, ConfirmDialog, Sheet } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { confirmedCount, dayLabel, myStatus, rangeLabel, EVENT_COLORS, type CalendarEvent } from '../../lib/calendar';
import { useContaAtiva } from '../../store/conta';
import { useCalendar } from '../../store/useCalendar';
import { useTables } from '../../store/useTables';
import { showToast } from '../../store/useToast';
import { ConfirmedBar, RsvpBadge } from './EventParts';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

/** Quem está na lista de convidados, com a resposta de cada um. */
export function GuestList({ event, me }: { event: CalendarEvent; me: string }) {
  return (
    <View style={{ gap: 10 }}>
      {event.guests.map((g) => (
        <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={g} size={32} />
          <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>
            {g}{g === me ? ' (você)' : g === event.createdBy ? ' (Mestre)' : ''}
          </Text>
          <RsvpBadge status={event.rsvp[g] ?? 'pending'} />
        </View>
      ))}
    </View>
  );
}

/** Detalhes do evento: quem confirmou, sua resposta e, para quem criou ou o mestre, a exclusão. */
export function EventModal({ event, date, onClose }: { event: CalendarEvent; date: string; onClose: () => void }) {
  const me = useContaAtiva()?.apelido ?? '';
  const respond = useCalendar((s) => s.respond);
  const remove = useCalendar((s) => s.remove);
  const myRole = useTables((s) => s.tables.find((t) => t.id === event.tableId)?.myRole);
  const [askDelete, setAskDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = myStatus(event, me);
  const canDelete = event.createdBy === me || myRole === 'MASTER';

  async function answer(status: 'yes' | 'no') {
    const ok = await respond(event.id, status);
    if (ok) showToast(status === 'yes' ? 'Presença confirmada.' : 'Você recusou o evento.', 'success');
    else showToast('Não foi possível enviar sua resposta. Tente de novo.', 'error');
  }
  async function del() {
    setBusy(true);
    const ok = await remove(event.id);
    setBusy(false);
    if (ok) { showToast('Evento excluído.', 'success'); setAskDelete(false); onClose(); }
    else showToast('Não foi possível excluir o evento.', 'error');
  }

  return (
    <>
      <Sheet title={event.title} onClose={onClose}>
        <View style={{ borderLeftWidth: 4, borderLeftColor: EVENT_COLORS[event.color], paddingLeft: 10, gap: 2 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{dayLabel(date)} · {rangeLabel(event)}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{event.tableName} · criado por {event.createdBy}</Text>
        </View>
        {!!event.description && <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>{event.description}</Text>}

        <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>
          {confirmedCount(event)}/{event.guests.length} confirmados
        </Text>
        <ConfirmedBar confirmed={confirmedCount(event)} total={event.guests.length} />
        <GuestList event={event} me={me} />

        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
          ⓘ Apenas quem criou o evento ou o mestre da mesa pode cancelá-lo.
        </Text>

        {event.askRsvp && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Btn label={mine === 'yes' ? 'Confirmado ✓' : 'Confirmar'} kind="primary" onPress={() => answer('yes')} /></View>
            <View style={{ flex: 1 }}><Btn label="Recusar" kind="danger" onPress={() => answer('no')} /></View>
          </View>
        )}
        {canDelete && <Btn label="Excluir evento" onPress={() => setAskDelete(true)} />}
      </Sheet>
      <ConfirmDialog visible={askDelete} danger busy={busy} title="Excluir evento?" message={`${event.title} será removido do calendário de todos os jogadores.`}
        confirmLabel="Excluir" onCancel={() => setAskDelete(false)} onConfirm={del} />
    </>
  );
}
