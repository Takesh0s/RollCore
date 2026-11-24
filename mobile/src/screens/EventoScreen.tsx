import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessibleText as Text } from '../components/accessible-text';
import { GuestList } from '../components/calendar/EventModal';
import { SERIF } from '../components/calendar/EventParts';
import { StateBlock } from '../components/Controls';
import { PillBtn } from '../components/tables/parts';
import { COLORS, Header, appFontSize } from '../design/shared';
import { confirmedCount, dayLabel, myStatus, rangeLabel, type Rsvp } from '../lib/calendar';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { useCalendar } from '../store/useCalendar';
import { showToast } from '../store/useToast';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

const ANSWERS: { status: Exclude<Rsvp, 'pending'>; label: string; ok: string }[] = [
  { status: 'yes', label: 'Vou', ok: 'Presença confirmada.' },
  { status: 'maybe', label: 'Talvez', ok: 'Resposta enviada: talvez.' },
  { status: 'no', label: 'Não vou', ok: 'Você recusou o evento.' },
];

/** Página do evento: quantos foram convidados e confirmaram, sua resposta e a lista de respostas. */
export default function EventoScreen() {
  useAcessibilidade();
  const router = useRouter();
  const conta = useContaAtiva();
  const me = conta?.apelido ?? '';
  const { events, selectedId, load, respond, loading } = useCalendar();
  const event = events.find((e) => e.id === selectedId);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/calendario' as any));

  useEffect(() => { if (!event) void load(); }, [event, load]);

  if (!event) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Evento" onBack={back} />
        {loading ? <Text style={{ padding: 16, color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Carregando evento…</Text>
          : <StateBlock icon="search-off" title="Evento não encontrado" text="Ele pode ter sido cancelado." actionLabel="Voltar ao calendário" onAction={() => router.replace('/calendario' as any)} />}
      </SafeAreaView>
    );
  }

  const mine = myStatus(event, me);
  async function answer(a: (typeof ANSWERS)[number]) {
    if (await respond(event!.id, a.status)) showToast(a.ok, 'success');
    else showToast('Não foi possível enviar sua resposta. Tente de novo.', 'error');
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Evento" onBack={back} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View style={{ padding: 14, borderRadius: 12, gap: 2, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.background }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{event.tableName} · {event.title}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{dayLabel(event.date)} · {rangeLabel(event)}</Text>
        </View>
        {!!event.description && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{event.description}</Text>}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[[event.guests.length, 'convidados'], [confirmedCount(event), 'confirmados']].map(([n, label]) => (
            <View key={String(label)} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 18, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.sapphire, fontFamily: SERIF, fontSize: appFontSize(30) }}>{n}</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{label}</Text>
            </View>
          ))}
        </View>

        {event.askRsvp && (
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>Você vai?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ANSWERS.map((a) => (
                <PillBtn key={a.status} kind={mine === a.status ? 'primary' : 'outline'} label={a.label} onPress={() => answer(a)} accessibilityLabel={`${a.label}${mine === a.status ? ', selecionado' : ''}`} />
              ))}
            </View>
          </View>
        )}

        <View style={{ padding: 14, gap: 10, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(16) }}>Confirmações</Text>
          <GuestList event={event} me={me} avatar={conta?.avatarUrl} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
