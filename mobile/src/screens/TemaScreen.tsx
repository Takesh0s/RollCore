import { useRouter } from 'expo-router';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { COLORS, Header, appFontSize, resolvedThemeMode } from '../design/shared';
import { getTheme, THEMES, type ModePref } from '../lib/theme';
import { updateAcessibilidade, useAcessibilidade } from '../store/acessibilidade';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const MODES: { id: ModePref; label: string; hint: string }[] = [
  { id: 'dark', label: 'Escuro', hint: 'Fundo escuro' },
  { id: 'light', label: 'Claro', hint: 'Fundo claro' },
  { id: 'system', label: 'Sistema', hint: 'Segue o dispositivo' },
];

/** Tema e paleta: escolhe entre os seis temas e o modo claro, escuro ou do sistema. Vale na hora e fica salvo. */
export default function TemaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { tema, modoTema, daltonico } = useAcessibilidade();
  // A prévia das amostras acompanha o modo aplicado: no "Sistema", o do aparelho.
  const preview = resolvedThemeMode();
  const success = getTheme(tema)[preview].green;
  // Como no web: abaixo de 420 px os três modos ficam empilhados.
  const stacked = width <= 420;

  const cardBase = (on: boolean) => ({
    alignItems: 'flex-start' as const, gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: on ? 2 : 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh,
  });
  const title = { color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(17) };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Tema e paleta" onBack={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        {daltonico && (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>
            O Modo Daltônico está ligado e usa a paleta dele. O tema escolhido volta a valer quando ele for desligado.
          </Text>
        )}
        <Text accessibilityRole="header" style={title}>Modo de exibição</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: stacked ? 'column' : 'row', gap: 10 }}>
          {MODES.map((m) => {
            const on = modoTema === m.id;
            return (
              <Pressable key={m.id} onPress={() => updateAcessibilidade({ modoTema: m.id })} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${m.label}. ${m.hint}`}
                style={[cardBase(on), stacked ? null : { flex: 1 }]}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(15) }}>{m.label}</Text>
                <Text style={{ color: COLORS.outline, fontFamily: BODY, fontSize: appFontSize(12.5) }}>{m.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text accessibilityRole="header" style={title}>Tema do app</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          {THEMES.map((t) => {
            const on = tema === t.id;
            const p = getTheme(t.id)[preview];
            return (
              <Pressable key={t.id} onPress={() => updateAcessibilidade({ tema: t.id })} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${t.label}. ${on ? 'Em uso' : 'Usar este tema'}`}
                style={[cardBase(on), { width: '48%' }]}>
                <View style={{ flexDirection: 'row', gap: 6 }} importantForAccessibility="no-hide-descendants">
                  {[p.body, p.accent, p.green].map((c, i) => <View key={i} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, borderWidth: 1, borderColor: COLORS.outlineVariant }} />)}
                </View>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(15) }}>{t.label}</Text>
                <Text style={{ color: on ? success : COLORS.outline, fontFamily: BODY, fontSize: appFontSize(12.5) }}>{on ? 'Em uso' : 'Usar este tema'}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
