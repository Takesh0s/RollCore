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

// Corrigido: adicionada a tipagem ': string' para o TypeScript e ajustado o Regex de caracteres especiais
function obterForcaSenha(senha: string) {
  if (!senha) return { strength: 0, label: 'Força: Digite uma senha' };

  let pontuacao = 0;

  // Critérios de validação
  if (senha.length >= 8) pontuacao++;
  if (/[A-Z]/.test(senha)) pontuacao++; // Letra maiúscula
  if (/[0-9]/.test(senha)) pontuacao++; // Número
  if (/[^A-Za-z0-9]/.test(senha)) pontuacao++; // Caractere especial

  // Mapeamento para os níveis do seu componente
  if (pontuacao <= 1) return { strength: 1, label: 'Força: Fraca' };
  if (pontuacao === 2) return { strength: 2, label: 'Força: Média' };
  return { strength: 3, label: 'Força: Forte' };
}

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

  // Calcula os dados da senha atual em tempo de renderização
  const infoSenha = obterForcaSenha(senha);

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

          {/* Passando as propriedades dinâmicas aqui */}
          <PasswordStrength strength={infoSenha.strength} label={infoSenha.label} />

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