import { useState } from 'react';
import { View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { Avatar, ConfirmDialog, Sheet } from '../Controls';
import { FAIL, PillBtn } from '../tables/parts';
import { COLORS, appFontSize } from '../../design/shared';
import { confirmedCount, dayLabel, myStatus, rangeLabel, EVENT_COLORS, type CalendarEvent } from '../../lib/calendar';
import { useContaAtiva } from '../../store/conta';
import { useCalendar } from '../../store/useCalendar';
import { useTables } from '../../store/useTables';
import { showToast } from '../../store/useToast';
import { ConfirmedBar, Note, RsvpBadge, SERIF } from './EventParts';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

/** Quem está na lista de convidados, com a resposta de cada um. */
export function GuestList({ event, me, avatar }: { event: CalendarEvent; me: string; avatar?: string | null }) {
  return (
    <View style={{ gap: 10 }}>
      {event.guests.map((g) => (
        <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={g} size={32} uri={g === me ? avatar : undefined} />
          <Text style={{ flex: 1, color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) }}>
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
  const conta = useContaAtiva();
  const me = conta?.apelido ?? '';
  const avatar = conta?.avatarUrl ?? null;
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
        <View style={{ borderLeftWidth: 6, borderLeftColor: EVENT_COLORS[event.color], paddingLeft: 12, gap: 4 }}>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{dayLabel(date)} · {rangeLabel(event)}</Text>
          <Text style={{ color: COLORS.btnText, fontFamily: BODY, fontSize: appFontSize(13) }}>{event.tableName} · criado por {event.createdBy}</Text>
          {!!event.description && <Text style={{ color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14), marginTop: 6 }}>{event.description}</Text>}
        </View>
        <View style={{ height: 1, backgroundColor: COLORS.outlineVariant }} />

        <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(16) }}>
          {confirmedCount(event)}/{event.guests.length} confirmados
        </Text>
        <ConfirmedBar confirmed={confirmedCount(event)} total={event.guests.length} />
        <GuestList event={event} me={me} avatar={avatar} />

        <Note>ⓘ Apenas quem criou o evento ou o mestre da mesa pode cancelá-lo.</Note>

        {event.askRsvp && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <PillBtn kind="primary" pill={false} label={mine === 'yes' ? 'Confirmado ✓' : 'Confirmar'} onPress={() => answer('yes')} />
            <PillBtn kind="danger" pill={false} label="Recusar" onPress={() => answer('no')} />
          </View>
        )}
        {canDelete && (
          <Pressable onPress={() => setAskDelete(true)} accessibilityRole="button" accessibilityLabel="Excluir evento" style={{ alignSelf: 'center', paddingVertical: 4 }}>
            <Text style={{ color: FAIL, fontFamily: BODY, fontSize: appFontSize(13), textDecorationLine: 'underline' }}>Excluir evento</Text>
          </Pressable>
        )}
      </Sheet>
      <ConfirmDialog visible={askDelete} danger busy={busy} title="Excluir evento?" message={`${event.title} será removido do calendário de todos os jogadores.`}
        confirmLabel="Excluir" onCancel={() => setAskDelete(false)} onConfirm={del} />
    </>
  );
}
