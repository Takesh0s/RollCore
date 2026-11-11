import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { EventModal } from '../components/calendar/EventModal';
import { RsvpBadge } from '../components/calendar/EventParts';
import { Btn, SectionTitle, StateBlock } from '../components/Controls';
import { COLORS, appFontSize } from '../design/shared';
import {
  EVENT_COLORS, WEEKDAY_HEADERS, dayLabel, hourLabel, monthGrid, monthTitle, myStatus, occurrencesBetween, sameDay,
  tableLegend, toISO, upcoming, type Occurrence,
} from '../lib/calendar';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { useCalendar } from '../store/useCalendar';
import { useTables } from '../store/useTables';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

/** Calendário de sessões: mês, próximos eventos e legenda das mesas (no celular só há a visão do mês, como no web). */
const navBtn = { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(192,192,192,0.6)' } as const;

export default function CalendarioScreen() {
  useAcessibilidade();
  const router = useRouter();
  const me = useContaAtiva()?.apelido ?? '';
  const { events, loading, loaded, load } = useCalendar();
  const tables = useTables((s) => s.tables);
  const loadTables = useTables((s) => s.load);
  const canCreate = tables.some((t) => t.myRole !== 'PLAYER');
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState<Occurrence | null>(null);

  useEffect(() => { void loadTables(); void load(); }, [loadTables, load]);

  const grid = useMemo(() => monthGrid(anchor), [anchor]);
  const occ = useMemo(() => occurrencesBetween(events, grid[0], grid[grid.length - 1]), [events, grid]);
  const byDay = useMemo(() => {
    const m = new Map<string, Occurrence[]>();
    occ.forEach((o) => m.set(o.date, [...(m.get(o.date) ?? []), o]));
    return m;
  }, [occ]);
  const next = useMemo(() => upcoming(events, today, 5), [events, today]);
  const legend = useMemo(() => tableLegend(events), [events]);
  const shown = picked ? (byDay.get(picked) ?? []) : next;
  const weeks: Date[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  function step(dir: -1 | 1) {
    setPicked(null);
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Calendário" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Pressable onPress={() => step(-1)} accessibilityLabel="Mês anterior" style={navBtn}><MaterialIcons name="chevron-left" size={22} color={COLORS.onSurface} /></Pressable>
            <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(18) }}>{monthTitle(anchor)}</Text>
            <Pressable onPress={() => step(1)} accessibilityLabel="Próximo mês" style={navBtn}><MaterialIcons name="chevron-right" size={22} color={COLORS.onSurface} /></Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {WEEKDAY_HEADERS.map((d) => (
              <Text key={d} style={{ flex: 1, textAlign: 'center', paddingVertical: 4, color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11) }}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: 'row', gap: 6 }}>
              {week.map((d) => {
                const iso = toISO(d);
                const list = byDay.get(iso) ?? [];
                const out = d.getMonth() !== anchor.getMonth();
                const sel = picked === iso;
                const isToday = sameDay(d, today);
                return (
                  <Pressable key={iso} disabled={!list.length} onPress={() => setPicked((p) => (p === iso ? null : iso))}
                    accessibilityLabel={`${dayLabel(iso)}${list.length ? `, ${list.length} evento${list.length > 1 ? 's' : ''}` : ''}`}
                    accessibilityState={{ selected: sel }}
                    style={{ flex: 1, height: 46, paddingTop: 5, alignItems: 'center', borderRadius: 8, borderWidth: sel ? 2 : 1, borderColor: sel ? COLORS.sapphire : COLORS.outlineVariant,
                      backgroundColor: out ? 'transparent' : COLORS.surfaceContainerHigh, opacity: out ? 0.5 : 1 }}>
                    <View style={{ minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? COLORS.field : 'transparent' }}>
                      <Text style={{ color: isToday ? COLORS.fieldText : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(12) }}>{d.getDate()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 3, marginTop: 2 }}>
                      {list.slice(0, 4).map((o) => <View key={o.event.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: EVENT_COLORS[o.event.color] }} />)}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {canCreate && <Btn label="+ Criar evento" kind="primary" onPress={() => router.push('/novo-evento' as any)} />}

        <SectionTitle align="start">{picked ? `Eventos de ${dayLabel(picked)}` : 'Próximos eventos'}</SectionTitle>

        {!loaded && loading ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Carregando eventos…</Text>
          : shown.length === 0 ? <StateBlock icon="event-busy" title={picked ? 'Nenhum evento neste dia.' : 'Nenhum evento marcado.'} text={picked ? undefined : canCreate ? 'Crie o primeiro!' : undefined} />
          : shown.map((o) => (
            <Pressable key={o.event.id + o.date} onPress={() => setOpen(o)} accessibilityRole="button" accessibilityLabel={`${o.event.title}, ${dayLabel(o.date)}, ${hourLabel(o.event.start)}. Detalhes`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, borderLeftWidth: 4,
                borderLeftColor: EVENT_COLORS[o.event.color], backgroundColor: COLORS.surfaceContainerHigh }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{o.event.title}</Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{dayLabel(o.date)} · {hourLabel(o.event.start)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {o.event.askRsvp && <RsvpBadge status={myStatus(o.event, me)} />}
                <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(12) }}>Detalhes ›</Text>
              </View>
            </Pressable>
          ))}

        {legend.length > 0 && (
          <View style={{ gap: 8, marginTop: 4 }}>
            <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Legenda das mesas</Text>
            {legend.map((l) => (
              <View key={l.tableId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: EVENT_COLORS[l.color] }} />
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{l.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {open && <EventModal event={open.event} date={open.date} onClose={() => setOpen(null)} />}
    </SafeAreaView>
  );
}
