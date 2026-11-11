import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { ChangeEmailModal, ChangePasswordModal, DeleteAccountModal } from '../components/AccountModals';
import { Avatar, Btn, ConfirmDialog, FormGroup, inputStyle } from '../components/Controls';
import { COLORS, Header, appFontSize } from '../design/shared';
import { pickAvatarDataUrl } from '../lib/mapImage';
import { ApiError } from '../services/api';
import { useAcessibilidade } from '../store/acessibilidade';
import { encerrarSessao, salvarPerfil, useContaAtiva } from '../store/conta';
import { showToast } from '../store/useToast';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

function Row({ title, sub, danger, onPress }: { title: string; sub: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, backgroundColor: COLORS.surfaceContainerHigh,
        borderColor: danger ? '#c0392b' : COLORS.surfaceContainerHighest }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: danger ? '#e57373' : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{title}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{sub}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.onSurfaceVariant} />
    </Pressable>
  );
}

/** Perfil: nome de usuário e foto (salvos na conta) e a seção Conta (e-mail, senha, excluir). */
export default function PerfilScreen() {
  useAcessibilidade();
  const router = useRouter();
  const navigation = useNavigation();
  const conta = useContaAtiva();
  const [username, setUsername] = useState(conta?.apelido ?? '');
  const [usernameErr, setUsernameErr] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(conta?.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<'email' | 'password' | 'delete' | 'logout' | null>(null);
  const [leaveAction, setLeaveAction] = useState<unknown>(null);

  // Quando o perfil chega do servidor (primeiro acesso ou outro aparelho) e não há edição em andamento, acompanha.
  const synced = useRef({ username: conta?.apelido ?? '', avatar: conta?.avatarUrl });
  useEffect(() => {
    if (!conta) return;
    if (username === synced.current.username && avatar === synced.current.avatar) {
      setUsername(conta.apelido); setAvatar(conta.avatarUrl);
    }
    synced.current = { username: conta.apelido, avatar: conta.avatarUrl };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conta?.apelido, conta?.avatarUrl]);

  const dirty = !!conta && (username.trim() !== conta.apelido || avatar !== conta.avatarUrl);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const leavingRef = useRef(false);
  useEffect(() => {
    const sub = (navigation as any).addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      if (!dirtyRef.current || leavingRef.current) return;
      e.preventDefault();
      setLeaveAction(e.data.action);
    });
    return sub;
  }, [navigation]);

  async function pickPhoto() {
    const url = await pickAvatarDataUrl();
    if (url) setAvatar(url);
  }

  async function save() {
    const trimmed = username.trim();
    if (!isValidUsername(trimmed)) { setUsernameErr('3–20 caracteres. Apenas letras, números e _'); return; }
    setUsernameErr('');
    setSaving(true);
    try {
      await salvarPerfil({ apelido: trimmed, avatarUrl: avatar ?? null });
      showToast('Perfil atualizado!', 'success');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setUsernameErr('Nome de usuário já está em uso.');
      else showToast('Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setDialog(null);
    leavingRef.current = true;
    await encerrarSessao();
    router.replace('/login');
  }

  if (!conta) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Perfil" onBack={() => router.back()} />
        <View style={{ padding: 16 }}><Btn label="Entrar ou criar conta" kind="primary" onPress={() => router.replace('/login')} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Perfil" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Alterar foto de perfil">
            <Avatar uri={avatar} name={conta.apelido} size={92} />
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
              <MaterialIcons name="photo-camera" size={16} color={COLORS.onPrimary} />
            </View>
          </Pressable>
          <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(22) }}>{conta.apelido}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>Toque na foto para alterar</Text>
          {!!avatar && <Btn label="Remover foto" onPress={() => setAvatar(undefined)} />}
        </View>

        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>Informações</Text>
        <FormGroup label="Nome de usuário" hint="3–20 caracteres. Letras, números e _ apenas." error={usernameErr}>
          <TextInput value={username} onChangeText={(t) => { setUsername(t); setUsernameErr(''); }} maxLength={20} autoCapitalize="none" autoCorrect={false}
            accessibilityLabel="Nome de usuário" style={inputStyle(!!usernameErr)} />
        </FormGroup>
        <FormGroup label="E-mail" hint="Para trocar o e-mail ou a senha, use a seção Conta abaixo.">
          <TextInput value={conta.email} editable={false} accessibilityLabel="E-mail" style={[inputStyle(), { opacity: 0.7 }]} />
        </FormGroup>
        <Btn label={saving ? '…' : 'Salvar'} kind="primary" disabled={saving} onPress={save} />

        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20), marginTop: 6 }}>Conta</Text>
        <Row title="Alterar e-mail" sub="Exige a sua senha atual" onPress={() => setDialog('email')} />
        <Row title="Alterar senha" sub="Desconecta os outros aparelhos" onPress={() => setDialog('password')} />
        <Row title="Excluir conta" sub="Apaga fichas, mesas e imagens para sempre" danger onPress={() => setDialog('delete')} />

        <View style={{ marginTop: 8 }}><Btn label="Sair da conta" kind="primary" onPress={() => setDialog('logout')} /></View>
      </ScrollView>

      {dialog === 'email' && <ChangeEmailModal onClose={() => setDialog(null)} />}
      {dialog === 'password' && <ChangePasswordModal onClose={() => setDialog(null)} />}
      {dialog === 'delete' && <DeleteAccountModal onClose={() => setDialog(null)} onDeleted={() => { setDialog(null); leavingRef.current = true; router.replace('/login'); }} />}
      <ConfirmDialog visible={dialog === 'logout'} danger title="Sair da conta?" message="Você precisará entrar de novo para acessar suas mesas e fichas neste dispositivo."
        confirmLabel="Sair da conta" onCancel={() => setDialog(null)} onConfirm={logout} />
      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?" message="Você editou o perfil e ainda não salvou." confirmLabel="Descartar" cancelLabel="Continuar editando"
        onCancel={() => setLeaveAction(null)} onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
    </SafeAreaView>
  );
}
