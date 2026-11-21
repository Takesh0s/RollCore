import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { StateBlock } from '../components/Controls';
import {
  DeleteTableModal, LeaveTableModal, MemberActionsModal, MyTableProfileModal, ROLE_LABEL, RemoveMemberModal, TransferHostModal,
} from '../components/tables/TableModals';
import { Pressable } from 'react-native';
import { BODY, BOLD, MUTED, PillBtn, ProfileRow, RuleTitle, SERIF } from '../components/tables/parts';
import { COLORS, Header, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { showToast } from '../store/useToast';
import { useTables, type TableMember } from '../store/useTables';

type Dialog = { kind: 'delete' | 'leave' | 'profile' } | { kind: 'actions' | 'transfer' | 'remove'; member: TableMember } | null;

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
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Mesa" onBack={back} />
        {state === 'notfound' ? <StateBlock icon="search-off" title="Mesa não encontrada" text="Ela pode ter sido excluída, ou você saiu dela." actionLabel="Voltar às mesas" onAction={toList} />
          : state === 'error' ? <StateBlock icon="cloud-off" title="Não foi possível abrir a mesa" actionLabel="Tentar de novo" onAction={() => setAttempt((a) => a + 1)} />
          : <StateBlock icon="hourglass-empty" title="Carregando mesa…" />}
      </View>
    );
  }

  const { table, inviteCode, members } = detail;
  const cover = imageSrc(table.coverUrl);
  const staff = table.myRole === 'MASTER' || table.myRole === 'MODERATOR';

  async function copyInvite() {
    if (!inviteCode) return;
    try { await Clipboard.setStringAsync(inviteCode); showToast('Código copiado!', 'success'); } catch { showToast(`Código: ${inviteCode}`); }
  }

  const val = { color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) } as const;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={table.name} onBack={back} />
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 14, paddingBottom: 24 }}>
        {cover && <ImageBackground source={{ uri: cover }} resizeMode="cover" accessibilityLabel={`Capa de ${table.name}`} style={{ height: 130, marginBottom: 10, backgroundColor: '#2a3237' }} />}

        <ProfileRow label="Sistema"><Text style={val}>{table.gameSystem}</Text></ProfileRow>
        <ProfileRow label="Seu papel"><Text style={val}>{ROLE_LABEL[table.myRole]}</Text></ProfileRow>
        <ProfileRow label="Mestre"><Text style={val}>{table.ownerUsername}</Text></ProfileRow>
        <ProfileRow label="Jogadores"><Text style={val}>{table.playerCount}/{table.maxPlayers}</Text></ProfileRow>

        {!!table.description && (<><RuleTitle>Descrição</RuleTitle><Text style={{ color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14), lineHeight: appFontSize(21) }}>{table.description}</Text></>)}

        {!!inviteCode && (
          <>
            <RuleTitle>Convite</RuleTitle>
            <View accessible accessibilityLabel={`Código ${inviteCode}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {inviteCode.split('').map((ch, i) => (
                <View key={i} accessibilityElementsHidden style={{ width: 38, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.field }}>
                  <Text style={{ color: COLORS.fieldText, fontFamily: SERIF, fontSize: appFontSize(21) }}>{ch}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <PillBtn kind="primary" label="Copiar código" onPress={copyInvite} />
              {table.myRole === 'MASTER' && <PillBtn label="Gerar novo código" onPress={() => regenerateInvite(table.id)} />}
            </View>
          </>
        )}

        <RuleTitle>Membros</RuleTitle>
        {members.map((m) => {
          const isMe = m.username === conta?.apelido;
          const canRemove = staff && m.role !== 'MASTER' && !isMe;
          const canPromote = table.myRole === 'MASTER' && m.role !== 'MASTER';
          const canTransfer = !!detail.canTransferHost && m.role !== 'MASTER' && !isMe;
          const name = m.displayName || m.username;
          return (
            <ProfileRow key={m.userId} label={name}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: MUTED, fontFamily: BODY, fontSize: appFontSize(12) }}>{ROLE_LABEL[m.role]}</Text>
                {(canRemove || canPromote || canTransfer) && (
                  <Pressable onPress={() => setDialog({ kind: 'actions', member: m })} accessibilityRole="button" accessibilityLabel={`Ações de ${name}`}
                    style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                    <Text style={{ color: MUTED, fontFamily: BODY, fontSize: appFontSize(16), lineHeight: appFontSize(18) }}>…</Text>
                  </Pressable>
                )}
              </View>
            </ProfileRow>
          );
        })}

        <View style={{ marginTop: 18, padding: 18, alignItems: 'center', gap: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(192,192,192,0.5)' }}>
          <Text style={{ color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(14) }}>Sessão ao vivo</Text>
          <Text style={{ color: MUTED, fontFamily: BODY, fontSize: appFontSize(13), textAlign: 'center' }}>As rolagens em tempo real e quem está online chegam em breve.</Text>
        </View>

        <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <PillBtn label="Meu perfil na mesa" onPress={() => setDialog({ kind: 'profile' })} />
          {table.myRole === 'MASTER' && <PillBtn label="Editar mesa" onPress={() => router.push(`/mesa?id=${table.id}` as any)} />}
          {table.myRole === 'MASTER'
            ? <PillBtn kind="danger" pill={false} label="Excluir mesa" onPress={() => setDialog({ kind: 'delete' })} />
            : <PillBtn kind="danger" pill={false} label="Sair da mesa" onPress={() => setDialog({ kind: 'leave' })} />}
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
    </View>
  );
}
