import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { NewEventPopup } from '../components/calendar/NewEventPopup';
import { Btn, Chip } from '../components/Controls';
import { TableBanner } from '../components/tables/TableBanner';
import { COLORS, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { useCharacters } from '../store/useCharacters';
import { useDice } from '../store/useDice';
import { useNotifications } from '../store/useNotifications';
import { useQuickRoll } from '../store/useQuickRoll';
import { useQuickSearch } from '../store/useQuickSearch';
import { useTables, type TableRole } from '../store/useTables';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const ROLE_BADGE: Record<TableRole, string> = { MASTER: 'MESTRE', MODERATOR: 'MODERADOR', PLAYER: 'JOGADOR' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ padding: 14, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh }}>
      <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{title}</Text>
      {children}
    </View>
  );
}

function Soon({ title, text }: { title: string; text: string }) {
  return (
    <Section title={title}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: COLORS.surfaceContainerLowest }}>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(12) }}>Em breve</Text>
      </View>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{text}</Text>
    </Section>
  );
}

const Muted = ({ children }: { children: string }) => (
  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{children}</Text>
);

/** Início (o Dashboard do web): próxima sessão, situação na mesa e últimas rolagens, só com dados que o app já tem. */
export default function InicioScreen() {
  useAcessibilidade();
  const router = useRouter();
  const conta = useContaAtiva();
  const { tables, loading, load: loadTables } = useTables();
  const loadCharacters = useCharacters((s) => s.load);
  const { history, loadHistory } = useDice();
  const [rollTable, setRollTable] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    void loadTables(); void loadCharacters(); void loadHistory(); void useNotifications.getState().load();
  }, [loadTables, loadCharacters, loadHistory]));

  const next = tables[0] ?? null;
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = today.charAt(0).toUpperCase() + today.slice(1);
  const filterTables = tables.slice(0, 2);
  const shownRolls = history.filter((h) => !rollTable || h.tableId === rollTable).slice(0, 3);
  const open = (id: string) => router.push(`/sessao/${id}` as any);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Início" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTables} tintColor={COLORS.primary} />}>
        <View>
          <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(26) }}>{`Olá, ${conta?.apelido || 'aventureiro'}`}</Text>
          <Muted>{date}</Muted>
        </View>

        <Pressable onPress={() => useQuickSearch.getState().setOpen(true)} accessibilityRole="search" accessibilityLabel="Buscar mesas, fichas e comandos"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerLowest }}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
          <Text style={{ flex: 1, color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>Buscar mesas, fichas, sistemas…</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Rolar dados" onPress={() => useQuickRoll.getState().setOpen(true)} /></View>
          <View style={{ flex: 1 }}><Btn label="Criar mesa" onPress={() => router.push('/mesa' as any)} /></View>
        </View>

        <Section title="Próxima sessão">
          {next ? (
            <>
              <TableBanner table={next} onEnter={() => open(next.id)} />
              <Muted>{`${next.gameSystem} · ${next.myRole === 'MASTER' ? 'você é o mestre' : `Mestre ${next.ownerUsername}`}`}</Muted>
            </>
          ) : (
            <>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>Nenhuma mesa por aqui</Text>
              <Btn label="Criar mesa" kind="primary" onPress={() => router.push('/mesa' as any)} />
            </>
          )}
        </Section>

        <Soon title="Mensagens recentes" text="O chat das mesas chega com a Comunidade." />
        <Soon title="Criações inacabadas" text="Fichas, mapas e NPCs em andamento aparecem aqui." />
        <Soon title="Notas recentes" text="As anotações chegam com a tela de Anotações." />

        <Section title="Situação na mesa">
          {next ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text numberOfLines={1} style={{ flex: 1, color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>{next.name}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: COLORS.primary }}>
                  <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(11) }}>{ROLE_BADGE[next.myRole]}</Text>
                </View>
              </View>
              <Muted>{`${next.playerCount} de ${next.maxPlayers} jogadores`}</Muted>
            </>
          ) : (
            <>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>Sem mesa ativa</Text>
              <Muted>Entre em uma mesa para ver a situação dela aqui.</Muted>
            </>
          )}
        </Section>

        <Section title="Rolagens">
          {filterTables.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Todas" on={!rollTable} onPress={() => setRollTable(null)} />
              {filterTables.map((t) => <Chip key={t.id} label={t.name} on={rollTable === t.id} onPress={() => setRollTable(t.id)} />)}
            </View>
          )}
          {shownRolls.length === 0 ? (
            <>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>Nenhuma rolagem ainda</Text>
              <Btn label="Rolar dados" kind="primary" onPress={() => router.push('/dados' as any)} />
            </>
          ) : shownRolls.map((h) => {
            const when = new Date(h.timestamp);
            const stamp = `${String(when.getDate()).padStart(2, '0')}/${String(when.getMonth() + 1).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
            return (
              <View key={`${h.timestamp}-${h.formula}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{h.formula ?? h.label ?? `d${h.result.sides}`}</Text>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{`${stamp}${h.tableName ? ` · ${h.tableName}` : ''}`}</Text>
                </View>
                <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(22) }}>{h.result.total}</Text>
              </View>
            );
          })}
        </Section>
      </ScrollView>
      <NewEventPopup />
    </SafeAreaView>
  );
}
