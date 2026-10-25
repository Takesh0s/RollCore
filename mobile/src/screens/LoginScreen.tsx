import { useAcessibilidade } from '../store/acessibilidade';
// LoginScreen.tsx — RollCore

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path, Polygon } from 'react-native-svg';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { AUTH_COLORS, appFontSize } from '../design/shared';
import { mensagemDeErro } from '../services/api';
import { SLOW_HINT_TEXT, useSlowHint } from '../services/useSlowHint';
import { autenticarConta } from '../store/conta';

const C = {
  blue: AUTH_COLORS.canvas,
  card: AUTH_COLORS.panel,
  field: AUTH_COLORS.field,
  green: AUTH_COLORS.mint,
  gold: AUTH_COLORS.mint,
  white: AUTH_COLORS.white,
  button: AUTH_COLORS.button,
  gray: AUTH_COLORS.gray,
  checkbox: '#D9D9D9',
  typed: AUTH_COLORS.typed,
  placeholder: AUTH_COLORS.placeholder,
};

// Logo: dado d20 simplificado, desenhado em SVG (substitui a imagem do Figma, cuja URL expira)
function DiceLogo({ size = 72 }: { size?: number }) {
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G fill="none" stroke={C.gold} strokeWidth={4} strokeLinejoin="round">
          <Polygon points="50,6 90,28 90,72 50,94 10,72 10,28" />
          <Polygon points="50,28 72,66 28,66" />
          <Path d="M50 6 L50 28 M90 28 L72 66 M10 28 L28 66 M50 94 L50 66 M90 72 L72 66 M10 72 L28 66 M90 28 L50 28 M10 28 L50 28" />
        </G>
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  useAcessibilidade();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manter, setManter] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const lento = useSlowHint(carregando);

  const goToMesas = async () => {
    if (carregando) return;
    if (!email.trim() || !senha) {
      Alert.alert('Preencha seus dados', 'Informe o e-mail e a senha cadastrados.');
      return;
    }
    setCarregando(true);
    try {
      await autenticarConta(email, senha);
      router.replace('/mesas');
    } catch (error) {
      Alert.alert('Não foi possível entrar', mensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  };
  const goToCadastro = () => router.push('/cadastro');
  const goToRecuperar = () => router.push('/recuperar-senha');
  const googleIndisponivel = () => Alert.alert('Login Google indisponível', 'A integração com Google ainda não está configurada.');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: AUTH_COLORS.canvas }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.wrapper}>
            <View style={[styles.card, { backgroundColor: AUTH_COLORS.panel }]}>
              <View style={[styles.topLine, { backgroundColor: AUTH_COLORS.gray }]} />

              <View style={styles.center}>
                <DiceLogo />
                <Text style={[styles.title, { color: AUTH_COLORS.mint, fontSize: appFontSize(32) }]} accessibilityRole="header">
                  RollCore
                </Text>
                <Text style={[styles.subtitle, { color: AUTH_COLORS.white, fontSize: appFontSize(16) }]}>Login</Text>
              </View>

              <Text style={[styles.label, { color: AUTH_COLORS.white, fontSize: appFontSize(14) }]}>e-mail</Text>
              <TextInput
                style={[styles.input, { backgroundColor: AUTH_COLORS.field, color: AUTH_COLORS.typed, borderColor: AUTH_COLORS.gray, fontSize: appFontSize(16) }]}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={AUTH_COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="E-mail"
              />

              <Text style={[styles.label, { color: AUTH_COLORS.white, fontSize: appFontSize(14) }]}>senha</Text>
              <TextInput
                style={[styles.input, { backgroundColor: AUTH_COLORS.field, color: AUTH_COLORS.typed, borderColor: AUTH_COLORS.gray, fontSize: appFontSize(16) }]}
                value={senha}
                onChangeText={setSenha}
                placeholder="••••••••"
                placeholderTextColor={AUTH_COLORS.placeholder}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={goToMesas}
                accessibilityLabel="Senha"
              />

              <Pressable
                style={styles.checkRow}
                onPress={() => setManter((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: manter }}
                accessibilityLabel="Mantenha conectado">
                <View style={[styles.checkbox, { backgroundColor: AUTH_COLORS.gray }, manter && [styles.checkboxOn, { backgroundColor: AUTH_COLORS.mint }]]}>
                  {manter && <Text style={[styles.checkMark, { color: AUTH_COLORS.typed, fontSize: appFontSize(16) }]}>✓</Text>}
                </View>
                <Text style={[styles.small, { color: AUTH_COLORS.white, fontSize: appFontSize(14) }]}>Mantenha conectado</Text>
              </Pressable>

              <Pressable onPress={goToRecuperar} accessibilityRole="link" style={styles.linkBox}>
                <Text style={[styles.small, styles.underline, { color: AUTH_COLORS.white, fontSize: appFontSize(14) }]}>esqueci minha senha</Text>
              </Pressable>

              <Pressable onPress={goToMesas} disabled={carregando} accessibilityRole="button" accessibilityState={{ busy: carregando, disabled: carregando }} style={[styles.button, { backgroundColor: AUTH_COLORS.button, opacity: carregando ? 0.7 : 1 }]} >
                <Text style={[styles.buttonText, { color: AUTH_COLORS.white, fontSize: appFontSize(19) }]}>{carregando ? 'Entrando…' : 'Entrar'}</Text>
              </Pressable>
              {lento ? <Text accessibilityLiveRegion="polite" style={[styles.small, { color: AUTH_COLORS.white, textAlign: 'center', fontSize: appFontSize(13) }]}>{SLOW_HINT_TEXT}</Text> : null}

              <Pressable onPress={goToCadastro} accessibilityRole="link" style={styles.linkBox}>
                <Text style={[styles.small, styles.underline, { color: AUTH_COLORS.white, textAlign: 'center', fontSize: appFontSize(14) }]}>criar conta</Text>
              </Pressable>

              <Pressable onPress={googleIndisponivel} accessibilityRole="button" style={styles.google}>
                <View style={[styles.gBadge, { backgroundColor: AUTH_COLORS.white }]}>
                  <Text style={[styles.gText, { fontSize: appFontSize(16) }]}>G</Text>
                </View>
                <Text style={[styles.small, { color: AUTH_COLORS.white, fontSize: appFontSize(14) }]}>Login com o google</Text>
              </Pressable>

              <View style={[styles.bottomLine, { backgroundColor: AUTH_COLORS.gray }]} />
            </View>

            {/* "Dentes" decorativos do Figma */}
            <View style={styles.teeth} aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.tooth, { backgroundColor: AUTH_COLORS.panel }]} />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.blue },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  wrapper: { width: '100%', maxWidth: 380 },
  card: { backgroundColor: C.card, paddingTop: 8, paddingBottom: 12, paddingHorizontal: 20 },
  topLine: { height: 1, backgroundColor: C.gray, marginBottom: 16, marginHorizontal: -20 },
  bottomLine: { height: 1, backgroundColor: C.gray, marginTop: 8, marginHorizontal: -20 },
  center: { alignItems: 'center', marginBottom: 16 },
  title: { color: C.green, fontSize: appFontSize(32), fontWeight: '700', marginTop: 8 },
  subtitle: { color: C.white, fontSize: appFontSize(16), marginTop: 4 },
  label: { color: C.white, fontSize: appFontSize(14), marginBottom: 6, marginTop: 8 },
  input: {
    minHeight: 48,
    backgroundColor: C.field,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: appFontSize(16),
    color: C.typed,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    backgroundColor: C.checkbox,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.green },
  checkMark: { color: C.typed, fontSize: appFontSize(16), fontWeight: '700' },
  small: { color: C.white, fontSize: appFontSize(14) },
  underline: { textDecorationLine: 'underline' },
  linkBox: { minHeight: 44, justifyContent: 'center' },
  button: {
    backgroundColor: C.button,
    borderRadius: 10,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: appFontSize(19), fontWeight: '700' },
  google: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, marginTop: 4 },
  gBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gText: { color: '#4285F4', fontSize: appFontSize(16), fontWeight: '700' },
  teeth: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  tooth: { width: 23, height: 28, backgroundColor: C.card },
});
