import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { ChangeEmailModal, ChangePasswordModal, DeleteAccountModal } from '../components/AccountModals';
import { Image } from 'react-native';
import { ConfirmDialog } from '../components/Controls';
import { FAIL, PillBtn, RuleTitle } from '../components/tables/parts';
import { COLORS, Header, appFontSize } from '../design/shared';
import { pickAvatarDataUrl } from '../lib/mapImage';
import { ApiError } from '../services/api';
import { useAcessibilidade } from '../store/acessibilidade';
import { encerrarSessao, salvarPerfil, useContaAtiva } from '../store/conta';
import { showToast } from '../store/useToast';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

/** `.acct-row`: cartão da seção Conta. */
function Row({ title, sub, danger, onPress }: { title: string; sub: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
        backgroundColor: COLORS.background, borderColor: COLORS.outlineVariant }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: danger ? FAIL : COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>{title}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{sub}</Text>
      </View>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(22) }}>›</Text>
    </Pressable>
  );
}

/** `.form-label` / `.form-input` / `.field-hint` do web. */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>{label}</Text>
      {children}
      {hint ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{hint}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: FAIL, fontFamily: BODY, fontSize: appFontSize(12) }}>{error}</Text> : null}
    </View>
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
        <View style={{ padding: 16 }}><PillBtn block kind="primary" pill={false} label="Entrar ou criar conta" onPress={() => router.replace('/login')} /></View>
      </SafeAreaView>
    );
  }

  const fld = (error?: boolean) => ({ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.field, color: COLORS.fieldText,
    fontFamily: BODY, fontSize: appFontSize(15), borderWidth: 1, borderColor: error ? FAIL : 'transparent' }) as const;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Perfil" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 4, paddingTop: 4 }}>
          <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Alterar foto de perfil">
            {avatar
              ? <Image source={{ uri: avatar }} accessibilityIgnoresInvertColors style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.ruleSoft }} />
              : (
                <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary,
                  shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}>
                  <Text style={{ color: COLORS.btn, fontFamily: SERIF, fontSize: appFontSize(30) }}>{(conta.apelido.charAt(0) || '?').toUpperCase()}</Text>
                </View>
              )}
          </Pressable>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14), marginTop: 8 }}>{conta.apelido}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12), textAlign: 'center' }}>Toque na foto para alterar · Máx. 2 MB</Text>
        </View>

        <RuleTitle>Informações</RuleTitle>
        <Field label="Nome de usuário" hint="3–20 caracteres. Letras, números e _ apenas." error={usernameErr}>
          <TextInput value={username} onChangeText={(t) => { setUsername(t); setUsernameErr(''); }} maxLength={20} autoCapitalize="none" autoCorrect={false}
            accessibilityLabel="Nome de usuário" style={fld(!!usernameErr)} />
        </Field>
        <Field label="E-mail" hint="Para trocar o e-mail ou a senha, use a seção Conta abaixo.">
          <TextInput value={conta.email} editable={false} accessibilityLabel="E-mail" style={fld()} />
        </Field>
        <View style={{ alignItems: 'center' }}>
          <PillBtn kind="primary" pill={false} label={saving ? '…' : 'Salvar'} disabled={saving} onPress={save} />
        </View>

        <RuleTitle>Conta</RuleTitle>
        <View style={{ gap: 8 }}>
          <Row title="Alterar e-mail" sub="Exige a sua senha atual" onPress={() => setDialog('email')} />
          <Row title="Alterar senha" sub="Desconecta os outros aparelhos" onPress={() => setDialog('password')} />
          <Row title="Excluir conta" sub="Apaga fichas, mesas e imagens para sempre" danger onPress={() => setDialog('delete')} />
        </View>

        <View style={{ alignItems: 'center', paddingTop: 22 }}>
          <PillBtn kind="primary" pill={false} label="Sair da conta" onPress={() => setDialog('logout')} />
        </View>
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
