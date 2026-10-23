// ConfiguracoesScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (configura_es/code.html),
// com uma linha adicional na seção Acessibilidade linkando para a tela
// dedicada de Acessibilidade Visual (resolve a conexão que faltava).

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyAccessibilityPalette, COLORS, Header, SegmentedControl, Toggle, useAppFonts, appFontSize } from '../design/shared';
import { encerrarSessao } from '../store/conta';
import { DaltonismType, useAcessibilidade, updateAcessibilidade } from '../store/acessibilidade';

const DALTONISM_OPTIONS: { id: DaltonismType; label: string; detail: string }[] = [
  { id: 'protanopia', label: 'Protanopia', detail: 'Dificuldade de percepção do vermelho; paleta azul e âmbar.' },
  { id: 'deuteranopia', label: 'Deuteranopia', detail: 'Dificuldade de percepção do verde; paleta azul e amarelo.' },
  { id: 'tritanopia', label: 'Tritanopia', detail: 'Dificuldade de percepção do azul e amarelo; paleta coral e violeta.' },
  { id: 'acromatopsia', label: 'Acromatopsia', detail: 'Paleta monocromática em tons de cinza.' },
];

function SectionTitle({ icon, children }: { icon: keyof typeof MaterialIcons.glyphMap; children: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(192,192,192,0.3)',
        paddingBottom: 8,
        marginBottom: 12,
      }}>
      <MaterialIcons name={icon} size={20} color={COLORS.outline} />
      <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>{children}</Text>
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
        borderColor: 'rgba(192,192,192,0.3)',
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
  const { daltonico, tipoDaltonismo, fonte } = useAcessibilidade();

  if (!fontsLoaded) return null;

  const goBack = () => router.back();
  const goToAcessibilidadeVisual = () => router.push('/acessibilidade-visual');
  const goToLogin = () => {
    encerrarSessao();
    router.replace('/login');
  };

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
              description="Escolha uma paleta de alto contraste adaptada ao seu perfil"
              value={daltonico}
              onValueChange={(value) => { updateAcessibilidade({ daltonico: value }); applyAccessibilityPalette(value, tipoDaltonismo); }}
            />

            {daltonico && <View style={{ gap: 6, paddingTop: 2 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Perfil de daltonismo</Text>
              {DALTONISM_OPTIONS.map((option) => {
                const selected = tipoDaltonismo === option.id;
                return <Pressable key={option.id} onPress={() => { updateAcessibilidade({ tipoDaltonismo: option.id }); applyAccessibilityPalette(true, option.id); }} accessibilityRole="radio" accessibilityState={{ selected }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: selected ? 2 : 1, borderColor: selected ? COLORS.primary : COLORS.outlineVariant, backgroundColor: selected ? COLORS.primaryContainer : 'transparent' }}>
                  <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={COLORS.primary} />
                  <View style={{ flex: 1, gap: 2 }}><Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>{option.label}</Text><Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(11) }}>{option.detail}</Text></View>
                </Pressable>;
              })}
              <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(11) }}>A paleta melhora a distinção de elementos; não é uma simulação médica da visão.</Text>
            </View>}

            <View style={{ gap: 8 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
                Tamanho de Fonte
              </Text>
              <SegmentedControl options={['Pequeno', 'Padrão', 'Grande']} selected={fonte} onSelect={(value) => updateAcessibilidade({ fonte: value as 'Pequeno' | 'Padrão' | 'Grande' })} />
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
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
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
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
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
              <Text style={{ color: '#ffb4ab', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
                Excluir Conta
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
