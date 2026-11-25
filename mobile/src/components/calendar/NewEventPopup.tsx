import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { Sheet } from '../Controls';
import { PillBtn } from '../tables/parts';
import { COLORS, appFontSize } from '../../design/shared';
import { confirmedCount, dayLabel, rangeLabel } from '../../lib/calendar';
import { useCalendar } from '../../store/useCalendar';
import { useNotifications } from '../../store/useNotifications';

const SEEN_KEY = 'rollcore_seen_event_popups';
const FRESH_MS = 24 * 3600 * 1000;
const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

async function readSeen(): Promise<string[]> {
  try { return JSON.parse((await AsyncStorage.getItem(SEEN_KEY)) ?? '[]'); } catch { return []; }
}

/** Aviso "Novo evento na mesa": aparece no Início quando alguém agenda algo e você ainda não viu. */
export function NewEventPopup() {
  const router = useRouter();
  const items = useNotifications((s) => s.items);
  const { events, load } = useCalendar();
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => { void readSeen().then(setSeen); }, []);

  const note = seen
    ? items.find((n) => n.type === 'EVENT_CREATED' && !n.read && n.eventId && Date.now() - new Date(n.createdAt).getTime() < FRESH_MS && !seen.includes(n.id))
    : undefined;
  const event = note ? events.find((e) => e.id === note.eventId) : undefined;

  useEffect(() => { if (note && !event) void load(); }, [note, event, load]);

  if (!note || !event || !seen) return null;

  /** "Ver mais tarde": some do Início, mas a notificação continua não lida na central. */
  const later = () => {
    const next = [...seen, note.id].slice(-50);
    setSeen(next);
    void AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next)).catch(() => { /* sem armazenamento: o aviso só reaparece */ });
  };
  const go = () => {
    later();
    void useNotifications.getState().markRead(note.id);
    useCalendar.getState().select(event.id);
    router.push('/evento' as any);
  };

  return (
    <Sheet title="Novo evento na mesa" onClose={later}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>
        {`${note.actorName ?? 'Alguém'} criou um novo evento: ${event.title}, na mesa ${event.tableName}${event.askRsvp ? ', e precisa que você confirme a presença.' : '.'}`}
      </Text>
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, gap: 2, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{`${dayLabel(event.date)} · ${rangeLabel(event)}`}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{`${confirmedCount(event)}/${event.guests.length} confirmados`}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <PillBtn kind="primary" pill={false} label="Ir para o evento" onPress={go} />
        <PillBtn pill={false} label="Ver mais tarde" onPress={later} />
      </View>
    </Sheet>
  );
}
