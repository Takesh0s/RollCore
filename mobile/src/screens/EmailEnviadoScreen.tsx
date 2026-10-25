import { useAcessibilidade } from '../store/acessibilidade';
// EmailEnviadoScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch
// (confirma_o_de_envio_de_e_mail/code.html). Recebe o e-mail via parâmetro
// de rota (?email=...) vindo de RecuperarSenhaScreen.

import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable as NativePressable, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, COLORS, Header, useAppFonts, appFontSize } from '../design/shared';

const COOLDOWN_SECONDS = 48;

export default function EmailEnviadoScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  if (!fontsLoaded) return null;

  const goToLogin = () => router.push('/login');
  const canResend = secondsLeft <= 0;

  const handleResend = () => {
    if (!canResend) return;
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setNotice('Novo pergaminho enviado com sucesso!');
      setSecondsLeft(COOLDOWN_SECONDS);
    }, 900);
  };

  const openMailApp = () => {
    Linking.openURL('mailto:').catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Recuperar Senha" onBack={goToLogin} rightIcon="person" />
      <View style={{ flex: 1, padding: 24, gap: 20 }}>
        {/* Selo */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: COLORS.surfaceContainerHigh,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
            <MaterialIcons name="mark-email-read" size={40} color={COLORS.primary} />
          </View>
          <Text
            style={{
              color: COLORS.primary,
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: appFontSize(12),
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
            Pergaminho Enviado
          </Text>
          <Text
            style={{
              color: COLORS.primary,
              fontFamily: 'SourceSerif4_600SemiBold',
              fontSize: appFontSize(24),
              textAlign: 'center',
            }}>
            E-mail Enviado!
          </Text>
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              maxWidth: 280,
            }}>
            Enviamos um feitiço de recuperação de acesso para o endereço:
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: COLORS.surfaceContainerHigh,
              marginTop: 8,
            }}>
            <MaterialIcons name="alternate-email" size={16} color={COLORS.primary} />
            <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>
              {email || 'aventureiro@guilda.com'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <MaterialIcons name="hourglass-top" size={16} color={COLORS.primary} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
              O link de acesso mágico expira em{' '}
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>30 minutos</Text>.
            </Text>
          </View>
        </View>

        {/* Card de ações */}
        <Card>
          <Pressable
            onPress={openMailApp}
            style={{
              minHeight: 48,
              backgroundColor: COLORS.primaryContainer,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <MaterialIcons name="open-in-new" size={20} color={COLORS.onPrimaryContainer} />
            <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
              Abrir Aplicativo de E-mail
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResend}
            disabled={!canResend}
            style={{
              minHeight: 48,
              backgroundColor: canResend ? COLORS.surfaceContainerHighest : COLORS.surfaceContainerHigh,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: canResend ? 1 : 0.75,
            }}>
            <MaterialIcons
              name="refresh"
              size={20}
              color={canResend ? COLORS.primary : COLORS.onSurfaceVariant}
            />
            <Text
              style={{
                color: canResend ? COLORS.primary : COLORS.onSurfaceVariant,
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                fontSize: appFontSize(15),
              }}>
              {resending ? 'Enviando...' : 'Reenviar E-mail'}
            </Text>
          </Pressable>

          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12), textAlign: 'center' }}>
            {notice
              ? notice
              : canResend
              ? 'Pronto para enviar uma nova coruja.'
              : `Não recebeu? Aguarde ${secondsLeft}s para reenviar`}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: 8, backgroundColor: COLORS.surfaceContainerHigh }}>
            <MaterialIcons name="info" size={16} color={COLORS.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
                Caixa de Entrada Vazia?
              </Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
                Verifique a pasta de Spam ou de promoções. Corujas mensageiras às vezes tomam rotas alternativas.
              </Text>
            </View>
          </View>
        </Card>

        {/* Suporte */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            borderRadius: 8,
            backgroundColor: COLORS.surfaceContainer,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <MaterialIcons name="support-agent" size={20} color={COLORS.secondary} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
              Digitou errado ou precisa de suporte?
            </Text>
          </View>
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
            Falar com a Taverna
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
          <Pressable onPress={goToLogin} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
              Voltar para o Login
            </Text>
          </Pressable>
          <Text style={{ color: COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11), letterSpacing: 1 }}>
            ROLLCORE RPG COMPANION • GUILDA DOS MESTRES
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
