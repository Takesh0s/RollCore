// AcessibilidadeVisualScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (acessibilidade_visual/code.html).
// Acessada a partir de Configurações (link adicionado em ConfiguracoesScreen).

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS,
  Header,
  PrimaryButton,
  SegmentedControl,
  Toggle,
  useAppFonts,
} from '../design/shared';

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
      <MaterialIcons name={icon} size={20} color={COLORS.primary} />
      <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 18 }}>{children}</Text>
    </View>
  );
}

export default function AcessibilidadeVisualScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  const [narracao, setNarracao] = useState(true);
  const [velocidade, setVelocidade] = useState('Normal');
  const [descreverVisuais, setDescreverVisuais] = useState(false);
  const [feedbackSonoro, setFeedbackSonoro] = useState(true);

  if (!fontsLoaded) return null;

  const goBack = () => router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Acessibilidade Visual" onBack={goBack} rightIcon="person" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, flexGrow: 1 }}>
        {/* Narração */}
        <View>
          <SectionTitle icon="record-voice-over">Narração</SectionTitle>
          <View style={{ gap: 12 }}>
            <Toggle
              label="Narração por Áudio"
              description="Lê em voz alta o conteúdo e as ações na tela."
              value={narracao}
              onValueChange={setNarracao}
            />

            <View
              style={{
                backgroundColor: COLORS.surfaceContainer,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(158,143,120,0.3)',
                padding: 16,
                gap: 8,
              }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
                Velocidade da Narração
              </Text>
              <SegmentedControl
                options={['Lenta', 'Normal', 'Rápida']}
                selected={velocidade}
                onSelect={setVelocidade}
              />
            </View>

            <Toggle
              label="Descrever elementos visuais"
              description="Narração de ícones, imagens e elementos gráficos."
              value={descreverVisuais}
              onValueChange={setDescreverVisuais}
            />
          </View>
        </View>

        {/* Sons e Feedback */}
        <View>
          <SectionTitle icon="volume-up">Sons e Feedback</SectionTitle>
          <Toggle
            label="Feedback sonoro de ações"
            description="Sons ao rolar dados, receber mensagens e interações."
            value={feedbackSonoro}
            onValueChange={setFeedbackSonoro}
          />
        </View>

        <View style={{ flex: 1 }} />

        <PrimaryButton title="Testar Narração" icon="play-arrow" />
      </ScrollView>
    </SafeAreaView>
  );
}
