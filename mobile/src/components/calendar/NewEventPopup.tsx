import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { Btn, Sheet } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { confirmedCount, dayLabel, rangeLabel } from '../../lib/calendar';
import { useCalendar } from '../../store/useCalendar';
import { useNotifications } from '../../store/useNotifications';

const SEEN_KEY = 'rollcore_seen_event_popups';
const FRESH_MS = 24 * 3600 * 1000;
const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

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
      <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>
        {`${note.actorName ?? 'Alguém'} criou um novo evento: ${event.title}, na mesa ${event.tableName}${event.askRsvp ? ', e precisa que você confirme a presença.' : '.'}`}
      </Text>
      <View style={{ padding: 12, borderRadius: 12, gap: 2, backgroundColor: COLORS.surfaceContainerLowest }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{`${dayLabel(event.date)} · ${rangeLabel(event)}`}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{`${confirmedCount(event)}/${event.guests.length} confirmados`}</Text>
      </View>
      <Btn label="Ir para o evento" kind="primary" onPress={go} />
      <Btn label="Ver mais tarde" onPress={later} />
    </Sheet>
  );
}
