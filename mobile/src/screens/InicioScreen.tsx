import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { NewEventPopup } from '../components/calendar/NewEventPopup';
import { NavIcon } from '../components/NavIcon';
import { COLORS, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { useCharacters } from '../store/useCharacters';
import { useDice } from '../store/useDice';
import { useNotifications } from '../store/useNotifications';
import { useTables, type TableRole } from '../store/useTables';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';
const BTN = 'FugazOne_400Regular';
const MUTED = '#C0C0C0';
const FAINT = '#9AA4A8';
const SAPPHIRE = '#8FB8DE';

const ROLE_BADGE: Record<TableRole, string> = { MASTER: 'MESTRE', MODERATOR: 'MODERADOR', PLAYER: 'JOGADOR' };

/** Título de seção com filetes dos dois lados (`.md-dash .dash-sec-title`). */
function SectionTitle({ children }: { children: string }) {
  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 8 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(192,192,192,0.55)' }} />
      <Text style={{ color: MUTED, fontFamily: SERIF, fontSize: appFontSize(15) }}>{children}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(192,192,192,0.55)' }} />
    </View>
  );
}

/** Cartão do dashboard (`.md-card`). */
function Card({ children, column, border }: { children: React.ReactNode; column?: boolean; border?: string }) {
  return (
    <View style={{ flexDirection: column ? 'column' : 'row', flexWrap: column ? undefined : 'wrap', alignItems: column ? 'flex-start' : 'center', gap: column ? 2 : 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1,
      borderColor: border ?? 'rgba(192,192,192,0.18)', backgroundColor: 'rgba(0,0,0,0.14)' }}>
      {children}
    </View>
  );
}

const Strong = ({ children, color = '#fff', lines }: { children: string; color?: string; lines?: number }) => (
  <Text numberOfLines={lines} style={{ color, fontFamily: BOLD, fontSize: appFontSize(14) }}>{children}</Text>
);
const Small = ({ children, color = FAINT }: { children: string; color?: string }) => (
  <Text style={{ color, fontFamily: BODY, fontSize: appFontSize(12) }}>{children}</Text>
);

/** Botão pílula escuro (`.md-enter`). */
function Enter({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}
      style={{ height: 28, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#252525', borderWidth: 1, borderColor: SAPPHIRE,
        shadowColor: SAPPHIRE, shadowOpacity: 0.5, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}>
      <Text style={{ color: '#6A89A7', fontFamily: BTN, fontStyle: 'italic', fontSize: appFontSize(12) }}>{label}</Text>
    </Pressable>
  );
}

function Soon({ title, text }: { title: string; text: string }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <Card column>
        <Strong color={MUTED}>Em breve</Strong>
        <Small>{text}</Small>
      </Card>
    </>
  );
}

/** Dashboard do celular (MobileDashboard no web): só dados que o app já tem; o resto aparece como "Em breve". */
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
  const cover = imageSrc(next?.coverUrl);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = today.charAt(0).toUpperCase() + today.slice(1);
  const shownRolls = history.filter((h) => !rollTable || h.tableId === rollTable).slice(0, 3);
  const open = (id: string) => router.push(`/sessao/${id}` as any);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Dashboard" />
      <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 14, paddingBottom: 16 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTables} tintColor="#70B596" />}>
        <Text accessibilityRole="header" style={{ color: '#fff', fontFamily: SERIF, fontSize: appFontSize(20), marginTop: 6 }}>{`Olá, ${conta?.apelido || 'aventureiro'}`}</Text>
        <Text style={{ color: FAINT, fontFamily: BODY, fontSize: appFontSize(12), marginTop: 2, marginBottom: 8 }}>{date}</Text>

        <SectionTitle>Próxima sessão</SectionTitle>
        {next ? (
          <Card>
            {cover
              ? <Image source={{ uri: cover }} accessibilityLabel={`Capa de ${next.name}`} style={{ width: '100%', aspectRatio: 5 / 2, borderRadius: 8 }} resizeMode="cover" />
              : <View style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: '#4a5a65', alignItems: 'center', justifyContent: 'center' }}><NavIcon name="tables" size={34} color="#fff" /></View>}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Strong lines={2}>{next.name}</Strong>
              <Small color={SAPPHIRE}>{`${next.gameSystem} · ${next.myRole === 'MASTER' ? 'você é o mestre' : `Mestre ${next.ownerUsername}`}`}</Small>
            </View>
            <Enter label="Entrar" onPress={() => open(next.id)} a11y={`Entrar na mesa ${next.name}`} />
          </Card>
        ) : (
          <Card column>
            <Strong color={MUTED}>Nenhuma mesa por aqui</Strong>
            <View style={{ marginTop: 6 }}><Enter label="Criar mesa" onPress={() => router.push('/mesa' as any)} a11y="Criar mesa" /></View>
          </Card>
        )}

        <Soon title="Mensagens recentes" text="O chat das mesas chega com a Comunidade." />
        <Soon title="Criações inacabadas" text="Fichas, mapas e NPCs em andamento aparecem aqui." />
        <Soon title="Notas recentes" text="As anotações chegam com a tela de Anotações." />

        <SectionTitle>Situação na mesa</SectionTitle>
        {next ? (
          <View style={{ gap: 4, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: SAPPHIRE, backgroundColor: 'rgba(0,0,0,0.14)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}><Strong lines={1}>{next.name}</Strong></View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#e8c25a' }}>
                <Text style={{ color: '#2a2410', fontFamily: BOLD, fontSize: appFontSize(10) }}>{ROLE_BADGE[next.myRole]}</Text>
              </View>
            </View>
            <Small>{`${next.playerCount} de ${next.maxPlayers} jogadores`}</Small>
          </View>
        ) : (
          <Card column>
            <Strong color={MUTED}>Sem mesa ativa</Strong>
            <Small>Entre em uma mesa para ver a situação dela aqui.</Small>
          </Card>
        )}

        <SectionTitle>Rolagens</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          {[{ id: null as string | null, name: 'Todas' }, ...tables.slice(0, 2).map((t) => ({ id: t.id as string | null, name: t.name }))].map((c) => {
            const on = rollTable === c.id;
            return (
              <Pressable key={c.id ?? 'all'} onPress={() => setRollTable(c.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={{ height: 28, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? SAPPHIRE : 'rgba(192,192,192,0.6)', backgroundColor: on ? SAPPHIRE : 'transparent' }}>
                <Text style={{ color: on ? '#10202e' : MUTED, fontFamily: on ? BOLD : BODY, fontSize: appFontSize(12) }}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {shownRolls.length === 0 ? (
          <Card column>
            <Strong color={MUTED}>Nenhuma rolagem ainda</Strong>
            <View style={{ marginTop: 6 }}><Enter label="Rolar dados" onPress={() => router.push('/dados' as any)} a11y="Rolar dados" /></View>
          </Card>
        ) : shownRolls.map((h) => {
          const when = new Date(h.timestamp);
          const stamp = `${String(when.getDate()).padStart(2, '0')}/${String(when.getMonth() + 1).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
          return (
            <Card key={`${h.timestamp}-${h.formula}`}>
              <View style={{ flex: 1 }}>
                <Strong lines={1}>{h.formula ?? h.label ?? `d${h.result.sides}`}</Strong>
                <Small>{`${stamp}${h.tableName ? ` · ${h.tableName}` : ''}`}</Small>
              </View>
              <Text style={{ color: MUTED, fontFamily: BOLD, fontSize: appFontSize(24) }}>{h.result.total}</Text>
            </Card>
          );
        })}
      </ScrollView>
      <NewEventPopup />
    </View>
  );
}
