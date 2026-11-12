import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessibleText as Text } from '../components/accessible-text';
import { Btn, StateBlock } from '../components/Controls';
import {
  DeleteTableModal, LeaveTableModal, MemberActionsModal, MyTableProfileModal, ROLE_LABEL, RemoveMemberModal, TransferHostModal,
} from '../components/tables/TableModals';
import { Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, Header, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { showToast } from '../store/useToast';
import { useTables, type TableMember } from '../store/useTables';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

type Dialog = { kind: 'delete' | 'leave' | 'profile' } | { kind: 'actions' | 'transfer' | 'remove'; member: TableMember } | null;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant }}>
      <Text style={{ flexShrink: 1, color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{label}</Text>
      {children}
    </View>
  );
}

/** Visão geral da mesa: capa, dados da campanha, código de convite e membros (mesma do web). */
export default function MesaScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conta = useContaAtiva();
  const { detail, open, regenerateInvite } = useTables();
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState('loading');
    void open(id).then((r) => { if (alive) setState(r === 'ok' ? 'ok' : r); });
    return () => { alive = false; };
  }, [id, open, attempt]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/mesas' as any));
  const toList = () => router.replace('/mesas' as any);

  if (state !== 'ok' || !detail || detail.table.id !== id) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Mesa" onBack={back} />
        {state === 'notfound' ? <StateBlock icon="search-off" title="Mesa não encontrada" text="Ela pode ter sido excluída, ou você saiu dela." actionLabel="Voltar às mesas" onAction={toList} />
          : state === 'error' ? <StateBlock icon="cloud-off" title="Não foi possível abrir a mesa" actionLabel="Tentar de novo" onAction={() => setAttempt((a) => a + 1)} />
          : <StateBlock icon="hourglass-empty" title="Carregando mesa…" />}
      </SafeAreaView>
    );
  }

  const { table, inviteCode, members } = detail;
  const cover = imageSrc(table.coverUrl);
  const staff = table.myRole === 'MASTER' || table.myRole === 'MODERATOR';

  async function copyInvite() {
    if (!inviteCode) return;
    try { await Clipboard.setStringAsync(inviteCode); showToast('Código copiado!', 'success'); } catch { showToast(`Código: ${inviteCode}`); }
  }

  const header = (t: string) => <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20), marginTop: 10 }}>{t}</Text>;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={table.name} onBack={back} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}>
        {cover && <ImageBackground source={{ uri: cover }} resizeMode="cover" accessibilityLabel={`Capa de ${table.name}`} style={{ height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }} />}

        <Row label="Sistema"><Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{table.gameSystem}</Text></Row>
        <Row label="Seu papel"><Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{ROLE_LABEL[table.myRole]}</Text></Row>
        <Row label="Mestre"><Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{table.ownerUsername}</Text></Row>
        <Row label="Jogadores"><Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{table.playerCount}/{table.maxPlayers}</Text></Row>

        {!!table.description && (<>{header('Descrição')}<Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>{table.description}</Text></>)}

        {!!inviteCode && (
          <>
            {header('Convite')}
            <View accessible accessibilityLabel={`Código ${inviteCode}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {inviteCode.split('').map((ch, i) => (
                <View key={i} accessibilityElementsHidden style={{ width: 38, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                  <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(20) }}>{ch}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <View style={{ flexGrow: 1 }}><Btn label="Copiar código" kind="primary" onPress={copyInvite} /></View>
              {table.myRole === 'MASTER' && <View style={{ flexGrow: 1 }}><Btn label="Gerar novo código" onPress={() => regenerateInvite(table.id)} /></View>}
            </View>
          </>
        )}

        {header('Membros')}
        {members.map((m) => {
          const isMe = m.username === conta?.apelido;
          const canRemove = staff && m.role !== 'MASTER' && !isMe;
          const canPromote = table.myRole === 'MASTER' && m.role !== 'MASTER';
          const canTransfer = !!detail.canTransferHost && m.role !== 'MASTER' && !isMe;
          const name = m.displayName || m.username;
          return (
            <Row key={m.userId} label={name}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{ROLE_LABEL[m.role]}</Text>
                {(canRemove || canPromote || canTransfer) && (
                  <Pressable onPress={() => setDialog({ kind: 'actions', member: m })} accessibilityRole="button" accessibilityLabel={`Ações de ${name}`} style={{ padding: 6 }}>
                    <MaterialIcons name="more-horiz" size={22} color={COLORS.onSurfaceVariant} />
                  </Pressable>
                )}
              </View>
            </Row>
          );
        })}

        <View style={{ marginTop: 14, padding: 14, borderRadius: 12, gap: 4, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>Sessão ao vivo</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>As rolagens em tempo real e quem está online chegam em breve.</Text>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <Btn label="Meu perfil na mesa" onPress={() => setDialog({ kind: 'profile' })} />
          {table.myRole === 'MASTER' && <Btn label="Editar mesa" onPress={() => router.push(`/mesa?id=${table.id}` as any)} />}
          {table.myRole === 'MASTER'
            ? <Btn label="Excluir mesa" kind="danger" onPress={() => setDialog({ kind: 'delete' })} />
            : <Btn label="Sair da mesa" kind="danger" onPress={() => setDialog({ kind: 'leave' })} />}
        </View>
      </ScrollView>

      {dialog?.kind === 'delete' && <DeleteTableModal table={table} onClose={() => setDialog(null)} onDone={toList} />}
      {dialog?.kind === 'leave' && <LeaveTableModal table={table} onClose={() => setDialog(null)} onDone={toList} />}
      {dialog?.kind === 'profile' && <MyTableProfileModal table={table} username={conta?.apelido ?? ''} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'actions' && (
        <MemberActionsModal tableId={table.id} member={dialog.member} onClose={() => setDialog(null)}
          canPromote={table.myRole === 'MASTER' && dialog.member.role !== 'MASTER'}
          canTransfer={!!detail.canTransferHost && dialog.member.role !== 'MASTER'}
          canRemove={staff && dialog.member.role !== 'MASTER'}
          onTransfer={() => setDialog({ kind: 'transfer', member: dialog.member })}
          onRemove={() => setDialog({ kind: 'remove', member: dialog.member })} />
      )}
      {dialog?.kind === 'transfer' && <TransferHostModal tableId={table.id} member={dialog.member} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'remove' && <RemoveMemberModal tableId={table.id} member={dialog.member} onClose={() => setDialog(null)} />}
    </SafeAreaView>
  );
}
