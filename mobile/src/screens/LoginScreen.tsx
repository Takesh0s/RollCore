import { useAcessibilidade } from '../store/acessibilidade';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AuthButton, AuthField, AuthLink, AuthShell } from '../components/AuthParts';
import { AUTH_COLORS, appFontSize } from '../design/shared';
import { ApiError, mensagemDeErro } from '../services/api';
import { googleConfiguradoNestaPlataforma } from '../services/googleAuth';
import { SLOW_HINT_TEXT, useSlowHint } from '../services/useSlowHint';
import { autenticarComGoogle, autenticarConta } from '../store/conta';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

/** Login, no mesmo fluxo do web: erros por campo, "Mantenha conectado" e "Esqueci minha senha" na mesma linha. */
export default function LoginScreen() {
  useAcessibilidade();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manter, setManter] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [senhaErr, setSenhaErr] = useState('');
  const [carregando, setCarregando] = useState(false);
  const lento = useSlowHint(carregando);
  const googleConfigurado = googleConfiguradoNestaPlataforma();

  const validarEmail = (v: string) => {
    if (!v.trim()) { setEmailErr('E-mail é obrigatório.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setEmailErr('Formato de e-mail inválido.'); return false; }
    setEmailErr(''); return true;
  };

  const entrar = async () => {
    if (carregando) return;
    const emailOk = validarEmail(email);
    if (!senha.trim()) { setSenhaErr('Senha é obrigatória.'); return; }
    setSenhaErr('');
    if (!emailOk) return;
    setCarregando(true);
    try {
      await autenticarConta(email.trim(), senha);
      router.replace('/inicio');
    } catch (error) {
      // Credenciais recusadas: mesma frase do web. Falha de rede ou servidor mostra a mensagem real.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) { setSenhaErr('E-mail ou senha incorretos.'); setSenha(''); }
      else Alert.alert('Não foi possível entrar', mensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  };

  const entrarComGoogle = async (idToken: string) => {
    if (carregando) return;
    setCarregando(true);
    try {
      await autenticarComGoogle(idToken);
      router.replace('/inicio');
    } catch (error) {
      Alert.alert('Não foi possível entrar com o Google', mensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  };

  const googleStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, marginTop: 14 } as const;
  const badge = { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: AUTH_COLORS.white } as const;

  return (
    <AuthShell subtitle="Login">
      <AuthField label="E-mail" value={email} onChangeText={(v) => { setEmail(v); if (emailErr) validarEmail(v); }} onBlur={() => validarEmail(email)}
        error={emailErr} valid={!!email && !emailErr} placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" returnKeyType="next" />
      <AuthField label="Senha" password value={senha} onChangeText={(v) => { setSenha(v); setSenhaErr(''); }} error={senhaErr}
        placeholder="••••••••" autoComplete="current-password" returnKeyType="done" onSubmitEditing={entrar} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
        <Pressable onPress={() => setManter((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: manter }} accessibilityLabel="Mantenha conectado"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
          <View style={{ width: 22, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AUTH_COLORS.gray, backgroundColor: manter ? AUTH_COLORS.mint : 'transparent' }}>
            {manter && <Text style={{ color: AUTH_COLORS.typed, fontFamily: BOLD, fontSize: appFontSize(14) }}>✓</Text>}
          </View>
          <Text style={{ color: AUTH_COLORS.white, opacity: 0.85, fontFamily: BODY, fontSize: appFontSize(14) }}>Mantenha conectado</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/recuperar-senha')} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: AUTH_COLORS.mint, fontFamily: BOLD, fontSize: appFontSize(14), textDecorationLine: 'underline' }}>Esqueci minha senha</Text>
        </Pressable>
      </View>

      <AuthButton label="Entrar" onPress={entrar} disabled={!email.trim() || !senha.trim()} busy={carregando} />
      {lento ? <Text accessibilityLiveRegion="polite" style={{ color: AUTH_COLORS.white, textAlign: 'center', fontFamily: BODY, fontSize: appFontSize(13), marginTop: 8 }}>{SLOW_HINT_TEXT}</Text> : null}

      <AuthLink hint="Ainda não tem conta?" label="Criar conta" onPress={() => router.push('/cadastro')} />

      {googleConfigurado ? (
        <GoogleLoginButton disabled={carregando} onIdToken={entrarComGoogle} onError={(m) => Alert.alert('Login Google', m)}
          style={googleStyle} badgeStyle={badge} badgeTextStyle={{ color: '#4285F4', fontFamily: BOLD, fontSize: appFontSize(16) }} />
      ) : (
        <Pressable onPress={() => Alert.alert('Login Google indisponível', 'A integração com Google ainda não está configurada neste dispositivo.')} accessibilityRole="button" style={googleStyle}>
          <View style={badge}><Text style={{ color: '#4285F4', fontFamily: BOLD, fontSize: appFontSize(16) }}>G</Text></View>
          <Text style={{ color: AUTH_COLORS.white, fontFamily: BODY, fontSize: appFontSize(14) }}>Login com o google</Text>
        </Pressable>
      )}
    </AuthShell>
  );
}
