// CadastroScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (code.html do Cadastro),
// usando os componentes/tokens de src/design/shared.tsx. Substitui a
// versão antiga (pixel-perfect, cores diferentes).

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  COLORS,
  Divider,
  Field,
  Header,
  Logo,
  PasswordStrength,
  PrimaryButton,
  SecondaryButton,
  useAppFonts,
} from '../design/shared';

function GoogleIcon() {
  return <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4285F4' }}>G</Text>;
}

export default function CadastroScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  if (!fontsLoaded) return null;

  const goToLogin = () => router.push('/login');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Cadastro" onBack={goToLogin} rightIcon="person" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 32 }}>
        {/* Branding */}
        <Logo size={64} />
        <Text
          style={{
            color: COLORS.primary,
            fontFamily: 'SourceSerif4_700Bold',
            fontSize: 24,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: -20,
          }}>
          RollCore
        </Text>
        <Text
          style={{
            color: COLORS.secondary,
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: 16,
            textAlign: 'center',
            marginTop: -24,
          }}>
          Crie sua lenda nas mesas e comece sua jornada.
        </Text>

        {/* Card do formulário */}
        <Card>
          <Field
            label="Nome de Aventureiro"
            icon="person"
            placeholder="Ex: SirValerius"
            value={username}
            onChangeText={setUsername}
          />

          <Field
            label="E-mail"
            icon="email"
            placeholder="aventureiro@guilda.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Field label="Senha" icon="lock" isPassword value={senha} onChangeText={setSenha} />

          <PasswordStrength strength={3} label="Força: Forte" />

          <Field
            label="Confirmar Senha"
            icon="lock"
            isPassword
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          <PrimaryButton title="Criar Conta" icon="person-add" onPress={goToLogin} />

          <Divider label="ou" />

          <SecondaryButton title="Cadastrar com Google" icon={<GoogleIcon />} onPress={goToLogin} />

          <Text
            style={{
              color: COLORS.secondary,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
            }}>
            Já tem uma conta?{' '}
            <Text
              onPress={goToLogin}
              style={{
                color: COLORS.primary,
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                textDecorationLine: 'underline',
              }}>
              Entrar
            </Text>
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
