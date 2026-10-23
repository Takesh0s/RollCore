import { useAcessibilidade } from '../store/acessibilidade';
// RecuperarSenhaScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (recupera_o_de_senha/code.html).
// Ao enviar, navega para EmailEnviadoScreen passando o e-mail digitado.

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text as NativeText, View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Card,
  COLORS,
  Field,
  Header,
  PrimaryButton,
  useAppFonts, appFontSize } from '../design/shared';

export default function RecuperarSenhaScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [email, setEmail] = useState('');

  if (!fontsLoaded) return null;

  const goToLogin = () => router.push('/login');
  const handleSubmit = () => {
    if (!email) return;
    router.push({ pathname: '/email-enviado', params: { email } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Recuperar Senha" onBack={goToLogin} rightIcon="person" />
      <View style={{ flex: 1, padding: 24, gap: 24 }}>
        {/* Selo/Talismã */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.surfaceContainerHigh,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
            <MaterialIcons name="lock-reset" size={36} color={COLORS.primary} />
          </View>
          <Text
            style={{
              color: COLORS.primary,
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: appFontSize(12),
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
            Talisman de Acesso
          </Text>
          <Text
            style={{
              color: COLORS.onSurface,
              fontFamily: 'SourceSerif4_600SemiBold',
              fontSize: appFontSize(24),
              textAlign: 'center',
            }}>
            Recupere seu Acesso
          </Text>
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              maxWidth: 280,
            }}>
            Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
          </Text>
        </View>

        {/* Card */}
        <Card>
          <Field
            label="E-mail de Aventureiro"
            icon="email"
            placeholder="aventureiro@guilda.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="shield" size={14} color={COLORS.primary} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>
              Enviaremos instruções seguras para sua guilda.
            </Text>
          </View>

          <PrimaryButton title="Enviar Link de Recuperação" icon="mark-email-read" onPress={handleSubmit} />
        </Card>

        {/* Dica */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            padding: 16,
            borderRadius: 12,
            backgroundColor: COLORS.surfaceContainer,
          }}>
          <MaterialIcons name="info" size={20} color={COLORS.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>
              Não recebeu o e-mail?
            </Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>
              Verifique sua caixa de spam ou solicite auxílio ao Mestre de Taverna pelo suporte da guilda.
            </Text>
          </View>
        </View>

        <Text
          onPress={goToLogin}
          style={{
            color: COLORS.onSurfaceVariant,
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: appFontSize(14),
            textAlign: 'center',
          }}>
          Lembrou a senha?{' '}
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', textDecorationLine: 'underline' }}>
            Entrar
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
