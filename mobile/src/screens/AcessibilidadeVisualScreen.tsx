import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { ScrollView, Text as NativeText, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header, PrimaryButton, SegmentedControl, Toggle, useAppFonts, appFontSize } from '../design/shared';
import { NarrationSpeed, updateAcessibilidade, useAcessibilidade } from '../store/acessibilidade';
import { falar, pararLeitura, textoTesteNarração, feedbackDeAcao } from '../utils/acessibilidadeAudio';
import { textoNarracaoDaTela } from '../utils/screenNarration';

function SectionTitle({ icon, children }: { icon: keyof typeof MaterialIcons.glyphMap; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, paddingBottom: 8, marginBottom: 12 }}>
      <MaterialIcons name={icon} size={20} color={COLORS.primary} />
      <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>{children}</Text>
    </View>
  );
}

export default function AcessibilidadeVisualScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const fontsLoaded = useAppFonts();
  const { narracao, velocidadeNarracao, descreverVisuais, feedbackSonoro } = useAcessibilidade();

  if (!fontsLoaded) return null;

  const testarNarração = () => falar(textoTesteNarração(), true);
  const lerTela = () => {
    const text = textoNarracaoDaTela(pathname, descreverVisuais);
    falar(text || 'Não encontrei conteúdo para ler nesta tela.', true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Acessibilidade Visual" onBack={() => router.back()} rightIcon="person" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, flexGrow: 1 }}>
        <View>
          <SectionTitle icon="record-voice-over">Narração por voz</SectionTitle>
          <View style={{ gap: 12, padding: 16, backgroundColor: COLORS.surfaceContainer, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Toggle
              label="Narração automática"
              description="Lê o conteúdo quando você abre uma tela e os rótulos ao acionar controles."
              value={narracao}
              onValueChange={(value) => {
                updateAcessibilidade({ narracao: value });
                if (value) falar('Narração automática ativada.', true);
                else pararLeitura();
              }}
            />
            <View style={{ gap: 8 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Velocidade da narração</Text>
              <SegmentedControl
                options={['Lenta', 'Normal', 'Rápida']}
                selected={velocidadeNarracao}
                onSelect={(value) => {
                  const speed = value as NarrationSpeed;
                  updateAcessibilidade({ velocidadeNarracao: speed });
                  if (narracao) falar(`Velocidade da narração: ${speed.toLocaleLowerCase('pt-BR')}.`, true);
                }}
              />
            </View>
            <Toggle
              label="Descrever elementos visuais"
              description="Inclui rótulos acessíveis de botões, ícones e imagens identificadas."
              value={descreverVisuais}
              onValueChange={(value) => {
                updateAcessibilidade({ descreverVisuais: value });
                if (narracao) falar(value ? 'Descrição de elementos visuais ativada.' : 'Descrição de elementos visuais desativada.', true);
              }}
            />
            <View style={{ gap: 9, marginTop: 4 }}>
              <PrimaryButton title="Testar narração" icon="play-arrow" onPress={testarNarração} />
              <Pressable onPress={lerTela} accessibilityRole="button" accessibilityLabel="Ler conteúdo desta tela" style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh, paddingHorizontal: 14 }}>
                <MaterialIcons name="menu-book" size={19} color={COLORS.primary} />
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Ler conteúdo desta tela</Text>
              </Pressable>
              <Pressable onPress={pararLeitura} accessibilityRole="button" accessibilityLabel="Parar narração" style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 14 }}>
                <MaterialIcons name="stop-circle" size={19} color={COLORS.onSurfaceVariant} />
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Parar narração</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View>
          <SectionTitle icon="volume-up">Sons e feedback</SectionTitle>
          <View style={{ gap: 10, padding: 16, backgroundColor: COLORS.surfaceContainer, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Toggle
              label="Feedback falado e vibração"
              description="Lê o rótulo dos controles acionados e envia um toque tátil nos dispositivos compatíveis."
              value={feedbackSonoro}
              onValueChange={(value) => {
                updateAcessibilidade({ feedbackSonoro: value });
                if (value) feedbackDeAcao('Feedback falado e vibração ativados.', 'Configuração');
              }}
            />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>
              A leitura usa a voz instalada no sistema e funciona nas telas e botões que têm rótulos acessíveis. O idioma e a disponibilidade da voz dependem do dispositivo.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
