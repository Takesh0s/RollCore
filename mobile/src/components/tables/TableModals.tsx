import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { Avatar, Btn, Sheet, inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { imageSrc, pickImage, type PreparedImage } from '../../lib/mapImage';
import { useTables, type TableMember, type TablePreview, type TableRole, type TableSummary } from '../../store/useTables';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

export const ROLE_LABEL: Record<TableRole, string> = { MASTER: 'Mestre', MODERATOR: 'Moderador', PLAYER: 'Jogador' };

const text = (t: string) => <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>{t}</Text>;
const label = (t: string) => <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{t}</Text>;
const actions = (...children: React.ReactNode[]) => <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</View>;

/** Excluir mesa: só libera o botão depois de digitar o nome da mesa. */
export function DeleteTableModal({ table, onClose, onDone }: { table: TableSummary; onClose: () => void; onDone: () => void }) {
  const remove = useTables((s) => s.remove);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = typed.trim() === table.name.trim();
  const others = Math.max(0, table.playerCount - 1);
  async function run() {
    setBusy(true);
    if (await remove(table.id)) onDone(); else setBusy(false);
  }
  return (
    <Sheet title="Excluir mesa" onClose={onClose}>
      {text(`${others > 0 ? `${others} ${others === 1 ? 'jogador perde' : 'jogadores perdem'} o acesso. ` : ''}Mapas, notas e histórico das sessões serão apagados. Para confirmar, digite o nome da mesa.`)}
      {label('Nome da mesa')}
      <TextInput value={typed} onChangeText={setTyped} placeholder={table.name} placeholderTextColor={COLORS.onSurfaceVariant} autoCorrect={false} accessibilityLabel="Nome da mesa" style={inputStyle()} />
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="d" label="Excluir mesa" kind="danger" disabled={!ok || busy} onPress={run} />)}
    </Sheet>
  );
}

/** Sair da mesa (o mestre não pode sair: ele exclui a mesa). */
export function LeaveTableModal({ table, onClose, onDone }: { table: TableSummary; onClose: () => void; onDone: () => void }) {
  const leave = useTables((s) => s.leave);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    if (await leave(table.id)) onDone(); else setBusy(false);
  }
  return (
    <Sheet title="Sair da mesa" onClose={onClose}>
      {text(`Você deixa de ver ${table.name}. Para voltar, vai precisar de um novo convite.`)}
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="s" label="Sair da mesa" kind="danger" disabled={busy} onPress={run} />)}
    </Sheet>
  );
}

/** Remover jogador da mesa (mestre ou moderador). */
export function RemoveMemberModal({ tableId, member, onClose }: { tableId: string; member: TableMember; onClose: () => void }) {
  const removeMember = useTables((s) => s.removeMember);
  const [busy, setBusy] = useState(false);
  const name = member.displayName || member.username;
  async function run() {
    setBusy(true);
    if (await removeMember(tableId, member.userId)) onClose(); else setBusy(false);
  }
  return (
    <Sheet title={`Remover ${name} da mesa`} onClose={onClose}>
      {text(`${name} perde o acesso à mesa, mas pode voltar com um novo convite.`)}
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="r" label="Remover da mesa" kind="danger" disabled={busy} onPress={run} />)}
    </Sheet>
  );
}

/** Entrar em uma mesa com código de convite: mostra a mesa antes de confirmar. */
export function JoinTableModal({ onClose, onJoined }: { onClose: () => void; onJoined: (id: string) => void }) {
  const { preview: previewTable, join } = useTables();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<TablePreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(null); setError('');
    const c = code.trim();
    if (c.length < 4) return;
    let live = true;
    const id = setTimeout(async () => {
      const p = await previewTable(c);
      if (!live) return;
      if (p) setPreview(p); else setError('Código de convite não encontrado.');
    }, 350);
    return () => { live = false; clearTimeout(id); };
  }, [code, previewTable]);

  async function run() {
    setBusy(true);
    const detail = await join(code);
    if (detail) onJoined(detail.table.id); else setBusy(false);
  }

  return (
    <Sheet title="Entrar em uma mesa" onClose={onClose}>
      {text('Digite o código de convite que o mestre compartilhou.')}
      {label('Código de convite')}
      <TextInput value={code} onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={10} autoFocus autoCapitalize="characters" autoCorrect={false}
        placeholder="K7P2QX" placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel="Código de convite" style={[inputStyle(!!error), { letterSpacing: 3, fontFamily: BOLD }]} />
      {!!error && <Text style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(12) }}>{error}</Text>}
      {preview && (
        <View style={{ gap: 4, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(17) }}>{preview.name}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{preview.gameSystem} · Mestre {preview.ownerUsername} · {preview.playerCount}/{preview.maxPlayers} jogadores</Text>
          {!!preview.description && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{preview.description}</Text>}
          {preview.full && <Text style={{ color: '#e57373', fontFamily: BOLD, fontSize: appFontSize(13) }}>Esta mesa já está cheia.</Text>}
        </View>
      )}
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="e" label="Entrar na mesa" kind="primary" disabled={!preview || preview.full || busy} onPress={run} />)}
    </Sheet>
  );
}

/** Perfil na mesa: nome e avatar só valem nesta mesa; silenciar é pessoal. */
export function MyTableProfileModal({ table, username, onClose }: { table: TableSummary; username: string; onClose: () => void }) {
  const { detail, updateMyProfile } = useTables();
  const me = detail?.me;
  const [name, setName] = useState(me?.displayName ?? '');
  const [muted, setMuted] = useState(me?.muted ?? false);
  const [avatar, setAvatar] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    if (await updateMyProfile(table.id, { displayName: name, muted, avatar })) onClose(); else setBusy(false);
  }
  const shown = avatar?.uri ?? imageSrc(me?.avatarUrl) ?? null;
  return (
    <Sheet title="Perfil na mesa" onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={async () => { const img = await pickImage({ aspect: [1, 1], maxWidth: 256 }); if (img) setAvatar(img); }} accessibilityLabel="Alterar foto do perfil na mesa">
          <Avatar uri={shown} name={name || username} size={72} />
        </Pressable>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHighest }}>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(12) }}>{ROLE_LABEL[table.myRole]}</Text>
        </View>
      </View>
      {label('Nome de exibição (apenas para esta mesa)')}
      <TextInput value={name} onChangeText={setName} maxLength={50} placeholder={username} placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel="Nome de exibição" style={inputStyle()} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>Silenciar notificações desta mesa</Text>
        <Switch value={muted} onValueChange={setMuted} accessibilityLabel="Silenciar notificações desta mesa" trackColor={{ true: COLORS.primary }} />
      </View>
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="s" label="Salvar perfil" kind="primary" disabled={busy} onPress={run} />)}
    </Sheet>
  );
}

/** Ações sobre um membro: mudar cargo, passar o cargo de Mestre ou remover. */
export function MemberActionsModal({ tableId, member, canPromote, canTransfer, canRemove, onTransfer, onRemove, onClose }: {
  tableId: string; member: TableMember; canPromote: boolean; canTransfer: boolean; canRemove: boolean;
  onTransfer: () => void; onRemove: () => void; onClose: () => void;
}) {
  const changeRole = useTables((s) => s.changeRole);
  const [busy, setBusy] = useState(false);
  const name = member.displayName || member.username;
  const next = member.role === 'MODERATOR' ? 'PLAYER' : 'MODERATOR';
  async function setRole() {
    setBusy(true);
    if (await changeRole(tableId, member.userId, next)) onClose(); else setBusy(false);
  }
  return (
    <Sheet title={name} onClose={onClose}>
      {text(`${ROLE_LABEL[member.role]} · @${member.username}`)}
      {canPromote && <Btn label={next === 'MODERATOR' ? 'Promover a moderador' : 'Tornar jogador'} disabled={busy} onPress={setRole} />}
      {canTransfer && <Btn label="Passar cargo de Mestre" onPress={onTransfer} />}
      {canRemove && <Btn label="Remover da mesa" kind="danger" onPress={onRemove} />}
    </Sheet>
  );
}

/** Confirmação de transferência do cargo de Mestre. */
export function TransferHostModal({ tableId, member, onClose }: { tableId: string; member: TableMember; onClose: () => void }) {
  const transferHost = useTables((s) => s.transferHost);
  const [busy, setBusy] = useState(false);
  const name = member.displayName || member.username;
  async function run() {
    setBusy(true);
    if (await transferHost(tableId, member.userId)) onClose(); else setBusy(false);
  }
  return (
    <Sheet title="Passar cargo de Mestre" onClose={onClose}>
      {text(`${name} passa a ser o Mestre desta mesa e você vira moderador. Só quem criou a mesa pode transferi-la.`)}
      {actions(<Btn key="c" label="Cancelar" onPress={onClose} />, <Btn key="t" label="Confirmar transferência" kind="primary" disabled={busy} onPress={run} />)}
    </Sheet>
  );
}

/** Limite de mesas do plano grátis. */
export function TableLimitModal({ message, onClose, onManage }: { message: string; onClose: () => void; onManage: () => void }) {
  return (
    <Sheet title="Limite de mesas" onClose={onClose}>
      {text(message)}
      <Btn label="Gerenciar minhas mesas" kind="primary" onPress={onManage} />
      <Btn label="Fechar" onPress={onClose} />
    </Sheet>
  );
}

