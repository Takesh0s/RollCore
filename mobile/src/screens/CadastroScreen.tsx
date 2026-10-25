import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUTH_COLORS, useAppFonts, appFontSize } from '../design/shared';
import { mensagemDeErro } from '../services/api';
import { SLOW_HINT_TEXT, useSlowHint } from '../services/useSlowHint';
import { cadastrarConta } from '../store/conta';
import { useAcessibilidade } from '../store/acessibilidade';

type FieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  passwordVisible?: boolean;
  onToggleVisibility?: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
};

function FigmaField({ label, hint, value, onChangeText, secureTextEntry, passwordVisible, onToggleVisibility, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 9, borderWidth: 1.5, borderColor: AUTH_COLORS.gray, backgroundColor: AUTH_COLORS.field }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry ? !passwordVisible : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (keyboardType === 'email-address' ? 'none' : 'sentences')}
          autoCorrect={false}
          placeholder={hint}
          placeholderTextColor={AUTH_COLORS.placeholder}
          accessibilityLabel={label}
          style={{ flex: 1, minHeight: 50, paddingHorizontal: 13, paddingRight: secureTextEntry ? 4 : 13, color: AUTH_COLORS.typed, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}
        />
        {secureTextEntry && <Pressable onPress={onToggleVisibility} accessibilityRole="button" accessibilityLabel={passwordVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} style={{ width: 48, minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={passwordVisible ? 'visibility' : 'visibility-off'} size={21} color={AUTH_COLORS.white} />
        </Pressable>}
      </View>
    </View>
  );
}

export default function CadastroScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const lento = useSlowHint(carregando);

  if (!fontsLoaded) return null;

  const criarConta = async () => {
    if (carregando) return;
    const apelidoLimpo = apelido.trim();
    const emailLimpo = email.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(apelidoLimpo)) {
      setErro('O nome de usuário deve ter de 3 a 20 caracteres: letras sem acento, números ou _.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErro('Informe um e-mail válido para continuar.');
      return;
    }
    if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro('A senha precisa ter ao menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('A confirmação precisa ser igual à senha. Confira os dois campos.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await cadastrarConta({ apelido: apelidoLimpo, email: emailLimpo, senha });
      router.replace('/mesas');
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  };

  const regras = [
    { label: '8 caracteres', ok: senha.length >= 8 },
    { label: 'Maiúscula', ok: /[A-Z]/.test(senha) },
    { label: 'Minúscula', ok: /[a-z]/.test(senha) },
    { label: 'Número', ok: /[0-9]/.test(senha) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AUTH_COLORS.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: 420 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, backgroundColor: AUTH_COLORS.panel, borderWidth: 1, borderColor: AUTH_COLORS.gray, borderRadius: 14 }}>
              <View style={{ alignItems: 'center', marginBottom: 22, gap: 4 }}>
                <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: `${AUTH_COLORS.mint}20` }}>
                  <MaterialIcons name="casino" size={40} color={AUTH_COLORS.mint} />
                </View>
                <Text style={{ marginTop: 5, color: AUTH_COLORS.mint, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(26) }}>Criar sua conta</Text>
                <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), textAlign: 'center' }}>Entre na aventura com um perfil só seu.</Text>
              </View>

              <View style={{ gap: 15 }}>
                <FigmaField label="Nome de usuário" hint="3–20 caracteres: letras, números e _" value={apelido} onChangeText={(value) => { setApelido(value); setErro(''); }} autoCapitalize="none" />
                <FigmaField label="E-mail" hint="seu@email.com" value={email} onChangeText={(value) => { setEmail(value); setErro(''); }} keyboardType="email-address" />
                <FigmaField label="Senha" hint="Crie uma senha segura" value={senha} onChangeText={(value) => { setSenha(value); setErro(''); }} secureTextEntry passwordVisible={mostrarSenha} onToggleVisibility={() => setMostrarSenha((visible) => !visible)} autoCapitalize="none" />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }} accessibilityLabel="Requisitos da senha">
                  {regras.map((regra) => <View key={regra.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: regra.ok ? `${AUTH_COLORS.mint}24` : AUTH_COLORS.canvas, borderWidth: 1, borderColor: regra.ok ? AUTH_COLORS.mint : AUTH_COLORS.gray }}>
                    <MaterialIcons name={regra.ok ? 'check-circle' : 'radio-button-unchecked'} size={13} color={regra.ok ? AUTH_COLORS.mint : AUTH_COLORS.gray} />
                    <Text style={{ color: regra.ok ? AUTH_COLORS.white : AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>{regra.label}</Text>
                  </View>)}
                </View>

                <FigmaField label="Confirmar senha" hint="Digite a senha novamente" value={confirmarSenha} onChangeText={(value) => { setConfirmarSenha(value); setErro(''); }} secureTextEntry passwordVisible={mostrarConfirmacao} onToggleVisibility={() => setMostrarConfirmacao((visible) => !visible)} autoCapitalize="none" />
              </View>

              {erro ? <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: 11, borderRadius: 8, backgroundColor: '#542D35', borderWidth: 1, borderColor: '#FF9BA3' }}>
                <MaterialIcons name="error-outline" size={19} color="#FFD7DA" />
                <Text style={{ flex: 1, color: '#FFFFFF', fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>{erro}</Text>
              </View> : null}

              <Pressable onPress={criarConta} disabled={carregando} accessibilityRole="button" accessibilityState={{ busy: carregando, disabled: carregando }} style={({ pressed }) => ({ minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 10, backgroundColor: AUTH_COLORS.button, borderWidth: 1, borderColor: AUTH_COLORS.mint, opacity: carregando ? 0.6 : pressed ? 0.78 : 1 })}>
                <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(17) }}>{carregando ? 'Criando conta…' : 'Criar conta e continuar'}</Text>
              </Pressable>
              {lento ? <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, textAlign: 'center', color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>{SLOW_HINT_TEXT}</Text> : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 5, marginTop: 16 }}>
                <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>Já tem uma conta?</Text>
                <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
                  <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13), textDecorationLine: 'underline' }}>Entrar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
