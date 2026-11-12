import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text as NativeText, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { Btn, Chip, StateBlock } from '../components/Controls';
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[['Não lidas', unread], ['Mesas', items.filter((n) => !isEventNotification(n)).length], ['Eventos', items.filter(isEventNotification).length]].map(([label, n]) => (
            <View key={String(label)} style={{ flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh }}>
              <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(22) }}>{n}</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{label}</Text>
            </View>
          ))}
        </View>

        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8 }}>
          {TABS.map((t) => <Chip key={t.id} label={t.label} on={filter === t.id} onPress={() => setFilter(t.id)} />)}
        </View>
        <Btn label="Marcar todas como lidas" disabled={unread === 0} onPress={() => void markAllRead()} />

        {!loaded && loading ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Carregando notificações…</Text>
          : groups.length === 0 ? (
            filter === 'all'
              ? <StateBlock icon="notifications-none" title="Nada por aqui" text="Quando algo acontecer nas suas mesas, você vê aqui." />
              : <StateBlock icon="search-off" title="Nada encontrado" text="Não há notificações dessa categoria." actionLabel="Limpar filtros" onAction={() => setFilter('all')} />
          ) : groups.map((g) => (
            <View key={g.label} style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{g.label}</Text>
              {g.items.map((n) => (
                <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1,
                  borderColor: n.read ? COLORS.surfaceContainerHighest : COLORS.primary, backgroundColor: COLORS.surfaceContainerHigh }}>
                  <MaterialIcons name={isEventNotification(n) ? 'event' : 'notifications'} size={22} color={n.read ? COLORS.onSurfaceVariant : COLORS.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>
                      {notificationParts(n).map((p, i) => <NativeText key={i} style={p.bold ? { fontFamily: BOLD } : undefined}>{p.text}</NativeText>)}
                    </Text>
                    <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{relativeTime(n.createdAt)}</Text>
                  </View>
                  {canOpenNotification(n) && (
                    <Pressable onPress={() => open(n)} accessibilityRole="button" accessibilityLabel="Abrir notificação"
                      style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(12) }}>Abrir</Text>
                    </Pressable>
                  )}
                  {!n.read && (
                    <Pressable onPress={() => void markRead(n.id)} accessibilityRole="button" accessibilityLabel="Marcar como lida" hitSlop={10}
                      style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary }} />
                  )}
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
