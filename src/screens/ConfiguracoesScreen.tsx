// ConfiguracoesScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (configura_es/code.html),
// com uma linha adicional na seção Acessibilidade linkando para a tela
// dedicada de Acessibilidade Visual (resolve a conexão que faltava).

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header, SegmentedControl, Toggle, useAppFonts } from '../design/shared';

function SectionTitle({ icon, children }: { icon: keyof typeof MaterialIcons.glyphMap; children: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(158,143,120,0.3)',
        paddingBottom: 8,
        marginBottom: 12,
      }}>
      <MaterialIcons name={icon} size={20} color={COLORS.outline} />
      <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 18 }}>{children}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: COLORS.surfaceContainer,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(158,143,120,0.3)',
        padding: 16,
        gap: 16,
      }}>
      {children}
    </View>
  );
}

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  const [notificacoes, setNotificacoes] = useState(true);
  const [daltonico, setDaltonico] = useState(false);
  const [fonte, setFonte] = useState('Padrão');

  if (!fontsLoaded) return null;

  const goBack = () => router.back();
  const goToAcessibilidadeVisual = () => router.push('/acessibilidade-visual');
  const goToLogin = () => router.push('/login');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Configurações" onBack={goBack} rightIcon="person" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        {/* Geral */}
        <View>
          <SectionTitle icon="tune">Geral</SectionTitle>
          <Card>
            <Toggle
              label="Notificações"
              description="Alertas de campanhas e atualizações"
              value={notificacoes}
              onValueChange={setNotificacoes}
            />
          </Card>
        </View>

        {/* Acessibilidade */}
        <View>
          <SectionTitle icon="accessibility-new">Acessibilidade</SectionTitle>
          <Card>
            <Toggle
              label="Modo Daltônico"
              description="Ajusta paletas de cores e texturas"
              value={daltonico}
              onValueChange={setDaltonico}
            />

            <View style={{ gap: 8 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
                Tamanho de Fonte
              </Text>
              <SegmentedControl options={['Pequeno', 'Padrão', 'Grande']} selected={fonte} onSelect={setFonte} />
            </View>

            {/* Link novo: Acessibilidade Visual e Áudio */}
            <Pressable
              onPress={goToAcessibilidadeVisual}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="record-voice-over" size={20} color={COLORS.primary} />
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
                  Acessibilidade Visual e Áudio
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
            </Pressable>
          </Card>
        </View>

        {/* Conta */}
        <View>
          <SectionTitle icon="account-circle">Conta</SectionTitle>
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={goToLogin}
              style={{
                minHeight: 48,
                backgroundColor: COLORS.surfaceContainerHigh,
                borderWidth: 2,
                borderColor: COLORS.outline,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <MaterialIcons name="logout" size={20} color={COLORS.onSurface} />
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
                Sair da Conta (Logout)
              </Text>
            </Pressable>

            <Pressable
              style={{
                minHeight: 48,
                backgroundColor: 'rgba(255,180,171,0.08)',
                borderWidth: 2,
                borderColor: 'rgba(255,180,171,0.5)',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <MaterialIcons name="delete-forever" size={20} color="#ffb4ab" />
              <Text style={{ color: '#ffb4ab', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
                Excluir Conta
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
