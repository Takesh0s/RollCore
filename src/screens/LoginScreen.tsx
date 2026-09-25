// LoginScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (login_e_cadastro/code.html),
// usando os componentes/tokens de src/design/shared.tsx.

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  COLORS,
  Divider,
  Field,
  LinkText,
  Logo,
  PrimaryButton,
  Screen,
  SecondaryButton,
  useAppFonts,
} from '../design/shared';

function GoogleIcon() {
  // Ícone simples do "G" do Google (aproximação; sem depender de asset extra)
  return (
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  if (!fontsLoaded) return null;

  const goToCadastro = () => router.push('/cadastro');
  const goToMesas = () => router.push('/mesas'); // ajuste quando a rota existir

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Screen>
        {/* Header / Logo */}
        <Logo size={80} />
        <Text
          style={{
            color: COLORS.primary,
            fontFamily: 'SourceSerif4_700Bold',
            fontSize: 30,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: -16,
          }}>
          RollCore
        </Text>
        <Text
          style={{
            color: COLORS.onSurfaceVariant,
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: 16,
            textAlign: 'center',
            marginTop: -24,
          }}>
          Aventure-se além do limite.
        </Text>

        {/* Card do formulário */}
        <Card>
          <Field
            label="E-mail"
            icon="email"
            placeholder="heroi@guilda.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Field
            label="Senha"
            icon="lock"
            isPassword
            placeholder="••••••••"
            value={senha}
            onChangeText={setSenha}
          />

          <LinkText align="right" onPress={() => router.push('/recuperar-senha')}>Esqueceu a senha?</LinkText>

          <Divider label="ou" />

          <PrimaryButton title="Entrar" icon="login" onPress={goToMesas} />

          <SecondaryButton title="Continuar com Google" icon={<GoogleIcon />} onPress={goToMesas} />

          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
            }}>
            Novo no RollCore?{' '}
            <Text
              onPress={goToCadastro}
              style={{
                color: COLORS.primary,
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                textDecorationLine: 'underline',
              }}>
              Criar Conta
            </Text>
          </Text>
        </Card>
      </Screen>
    </SafeAreaView>
  );
}
