import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text as NativeText, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { StateBlock } from '../components/Controls';
import { PillBtn, ProfileRow, RuleTitle } from '../components/tables/parts';
import { COLORS, appFontSize } from '../design/shared';
import { canOpenNotification, dayGroup, isEventNotification, notificationParts, relativeTime } from '../lib/notifications';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCalendar } from '../store/useCalendar';
import { useNotifications, type AppNotification } from '../store/useNotifications';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

type Filter = 'all' | 'tables' | 'events';
const TABS: { id: Filter; label: string }[] = [{ id: 'all', label: 'Todas' }, { id: 'tables', label: 'Mesas' }, { id: 'events', label: 'Eventos' }];

/** Central de notificações: mesas e eventos, com resumo e "marcar todas como lidas". */
export default function NotificacoesScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { items, unread, loaded, loading, load, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(
    () => items.filter((n) => (filter === 'all' ? true : filter === 'events' ? isEventNotification(n) : !isEventNotification(n))),
    [items, filter],
  );
  const groups = (['Hoje', 'Ontem', 'Anteriores'] as const)
    .map((g) => ({ label: g, items: shown.filter((n) => dayGroup(n.createdAt) === g) }))
    .filter((g) => g.items.length > 0);

  function open(n: AppNotification) {
    void markRead(n.id);
    if (n.type === 'EVENT_CREATED' && n.eventId) { useCalendar.getState().select(n.eventId); router.push('/evento' as any); }
    else if (n.type === 'EVENT_CREATED') router.push('/calendario' as any);
    else if (n.tableId) router.push(`/sessao/${n.tableId}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Notificações" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <View style={{ gap: 10 }}>
          <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {TABS.map((t) => {
              const on = filter === t.id;
              return (
                <Pressable key={t.id} onPress={() => setFilter(t.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
                  style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, borderWidth: on ? 0 : 1, borderColor: COLORS.outlineVariant, backgroundColor: on ? COLORS.sapphire : 'transparent' }}>
                  <Text style={{ color: on ? '#0D1218' : COLORS.onSurfaceVariant, fontFamily: on ? BOLD : BODY, fontSize: appFontSize(12) }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ alignSelf: 'flex-start' }}>
            <PillBtn label="Marcar todas como lidas" disabled={unread === 0} onPress={() => void markAllRead()} />
          </View>
        </View>

        {!loaded && loading ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Carregando notificações…</Text>
          : groups.length === 0 ? (
            filter === 'all'
              ? <StateBlock icon="notifications-none" title="Nada por aqui" text="Quando algo acontecer nas suas mesas, você vê aqui." />
              : <StateBlock icon="search-off" title="Nada encontrado" text="Não há notificações dessa categoria." actionLabel="Limpar filtros" onAction={() => setFilter('all')} />
          ) : groups.map((g) => (
            <View key={g.label} style={{ gap: 8 }}>
              <RuleTitle>{g.label}</RuleTitle>
              {g.items.map((n) => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
                  borderColor: n.read ? COLORS.outlineVariant : COLORS.sapphire, backgroundColor: COLORS.background }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh }}>
                    <MaterialIcons name="notifications-none" size={18} color={COLORS.onSurfaceVariant} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14), lineHeight: appFontSize(19) }}>
                      {notificationParts(n).map((p, i) => <NativeText key={i} style={p.bold ? { fontFamily: BOLD } : undefined}>{p.text}</NativeText>)}
                    </Text>
                    <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{relativeTime(n.createdAt)}</Text>
                  </View>
                  {canOpenNotification(n) && <PillBtn label="Abrir" accessibilityLabel="Abrir notificação" onPress={() => open(n)} />}
                  {!n.read && (
                    <Pressable onPress={() => void markRead(n.id)} accessibilityRole="button" accessibilityLabel="Marcar como lida" hitSlop={10}
                      style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.sapphire }} />
                  )}
                </View>
              ))}
            </View>
          ))}

        <View accessibilityLabel="Resumo" style={{ padding: 14, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(17), marginBottom: 8 }}>Resumo</Text>
          <ProfileRow label="Não lidas"><Text style={{ color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) }}>{unread}</Text></ProfileRow>
          <ProfileRow label="Mesas"><Text style={{ color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) }}>{items.filter((n) => !isEventNotification(n)).length}</Text></ProfileRow>
          <ProfileRow label="Eventos"><Text style={{ color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) }}>{items.filter(isEventNotification).length}</Text></ProfileRow>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
