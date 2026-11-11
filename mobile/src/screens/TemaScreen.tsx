import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { COLORS, Header, appFontSize, resolvedThemeMode } from '../design/shared';
import { getTheme, THEMES, type ModePref } from '../lib/theme';
import { updateAcessibilidade, useAcessibilidade } from '../store/acessibilidade';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const MODES: { id: ModePref; label: string; hint: string }[] = [
  { id: 'dark', label: 'Escuro', hint: 'Fundo escuro' },
  { id: 'light', label: 'Claro', hint: 'Fundo claro' },
  { id: 'system', label: 'Sistema', hint: 'Segue o dispositivo' },
];

/** Tema e paleta: escolhe entre os seis temas e o modo claro, escuro ou do sistema. Vale na hora e fica salvo. */
export default function TemaScreen() {
  const router = useRouter();
  const { tema, modoTema, daltonico } = useAcessibilidade();
  // A prévia das amostras acompanha o modo aplicado: no "Sistema", o do aparelho.
  const preview = resolvedThemeMode();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Tema e paleta" onBack={() => (router.canGoBack() ? router.back() : router.replace('/configuracoes'))} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        {daltonico && (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>
            O Modo Daltônico está ligado e usa a paleta dele. O tema escolhido volta a valer quando ele for desligado.
          </Text>
        )}
        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>Modo de exibição</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
          {MODES.map((m) => {
            const on = modoTema === m.id;
            return (
              <Pressable key={m.id} onPress={() => updateAcessibilidade({ modoTema: m.id })} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${m.label}. ${m.hint}`}
                style={{ flex: 1, alignItems: 'center', gap: 2, padding: 12, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh }}>
                <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{m.label}</Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11), textAlign: 'center' }}>{m.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20), marginTop: 6 }}>Tema do app</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {THEMES.map((t) => {
            const on = tema === t.id;
            const p = getTheme(t.id)[preview];
            return (
              <Pressable key={t.id} onPress={() => updateAcessibilidade({ tema: t.id })} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${t.label}. ${on ? 'Em uso' : 'Usar este tema'}`}
                style={{ width: '48%', gap: 8, padding: 12, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh }}>
                <View style={{ flexDirection: 'row', gap: 6 }} importantForAccessibility="no-hide-descendants">
                  {[p.body, p.accent, p.green].map((c, i) => <View key={i} style={{ flex: 1, height: 26, borderRadius: 6, backgroundColor: c, borderWidth: 1, borderColor: COLORS.outlineVariant }} />)}
                </View>
                <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{t.label}</Text>
                <Text style={{ color: on ? COLORS.primary : COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{on ? 'Em uso' : 'Usar este tema'}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
