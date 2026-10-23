import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';

type NotificationKind = 'mensagem' | 'evento' | 'avaliacao';
type NotificationItem = {
  id: string;
  day: 'Hoje' | 'Ontem';
  text: string;
  kind: NotificationKind;
  read: boolean;
  route: string;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', day: 'Hoje', text: 'Susie enviou 3 novas mensagens.', kind: 'mensagem', read: false, route: '/comunidade' },
  { id: 'n2', day: 'Hoje', text: 'Queenie criou um evento na comunidade Hometown TTRPGs.', kind: 'evento', read: false, route: '/calendario' },
  { id: 'n3', day: 'Hoje', text: 'Você recebeu 342 novas avaliações no seu mapa: Reino do Armário.', kind: 'avaliacao', read: false, route: '/gmtools' },
  { id: 'n4', day: 'Ontem', text: 'Ralsei te enviou 1 nova mensagem.', kind: 'mensagem', read: true, route: '/comunidade' },
  { id: 'n5', day: 'Ontem', text: 'Susie enviou 5 novas mensagens.', kind: 'mensagem', read: true, route: '/comunidade' },
  { id: 'n6', day: 'Ontem', text: 'Você recebeu 516 novas avaliações no seu mapa: Reino do Armário.', kind: 'avaliacao', read: true, route: '/gmtools' },
];

const KIND_META: Record<NotificationKind, { icon: keyof typeof MaterialIcons.glyphMap; label: string; color: string }> = {
  mensagem: { icon: 'mail-outline', label: 'Mensagem', color: '#93C5FD' },
  evento: { icon: 'event-available', label: 'Evento', color: '#C4B5FD' },
  avaliacao: { icon: 'reviews', label: 'Avaliação', color: '#70B596' },
};

const FILTERS = ['Todas', 'Não lidas', 'Mensagens', 'Eventos', 'Avaliações'] as const;
type Filter = (typeof FILTERS)[number];

export default function NotificacoesScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Todas');
  const [filterOpen, setFilterOpen] = useState(false);

  const unreadCount = items.filter((item) => !item.read).length;
  const groups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const filtered = items.filter((item) => {
      const matchesSearch = item.text.toLocaleLowerCase('pt-BR').includes(query);
      const matchesFilter = filter === 'Todas'
        || (filter === 'Não lidas' && !item.read)
        || (filter === 'Mensagens' && item.kind === 'mensagem')
        || (filter === 'Eventos' && item.kind === 'evento')
        || (filter === 'Avaliações' && item.kind === 'avaliacao');
      return matchesSearch && matchesFilter;
    });
    return (['Hoje', 'Ontem'] as const)
      .map((day) => ({ day, items: filtered.filter((item) => item.day === day) }))
      .filter((group) => group.items.length > 0);
  }, [filter, items, search]);

  if (!fontsLoaded) return null;

  const openNotification = (item: NotificationItem) => {
    setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, read: true } : notification));
    router.push(item.route as any);
  };

  const markAllRead = () => setItems((current) => current.map((item) => ({ ...item, read: true })));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Notificações" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
        <MaterialIcons name="search" size={22} color={COLORS.onSurfaceVariant} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar notificações..."
          placeholderTextColor={COLORS.outline}
          accessibilityLabel="Buscar notificações"
          style={{ flex: 1, height: 42, color: COLORS.onSurface, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}
        />
        <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="Filtrar notificações" style={{ padding: 8 }}>
          <MaterialIcons name="filter-list" size={24} color={filter === 'Todas' ? COLORS.onSurfaceVariant : COLORS.primary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
          {unreadCount === 0 ? 'Tudo em dia' : `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`}
        </Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} accessibilityRole="button">
            <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Marcar todas como lidas</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <MaterialIcons name="notifications-none" size={38} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>Nenhuma notificação encontrada.</Text>
          </View>
        ) : groups.map((group) => (
          <View key={group.day}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(13) }}>{group.day}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
            </View>
            {group.items.map((item) => {
              const meta = KIND_META[item.kind];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openNotification(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.read ? '' : 'Não lida. '}${meta.label}: ${item.text}`}
                  style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(192,192,192,0.18)' }}>
                  <View style={{ width: 30, alignItems: 'center' }}>
                    <MaterialIcons name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <Text style={{ flex: 1, color: item.read ? COLORS.onSurfaceVariant : COLORS.onSurface, fontFamily: item.read ? 'AtkinsonHyperlegible_400Regular' : 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14), lineHeight: 19 }}>
                    {item.text}
                  </Text>
                  {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary }} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable onPress={() => setFilterOpen(false)} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ padding: 20, gap: 10, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20), marginBottom: 4 }}>Filtrar notificações</Text>
            {FILTERS.map((option) => (
              <Pressable key={option} onPress={() => { setFilter(option); setFilterOpen(false); }} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 8, backgroundColor: filter === option ? COLORS.surfaceContainerHighest : 'transparent' }}>
                <Text style={{ color: filter === option ? COLORS.primary : COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>{option}</Text>
                {filter === option ? <MaterialIcons name="check" size={20} color={COLORS.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
