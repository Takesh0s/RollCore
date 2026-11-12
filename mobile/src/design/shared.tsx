import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { FugazOne_400Regular } from '@expo-google-fonts/fugaz-one';
import { KumarOneOutline_400Regular } from '@expo-google-fonts/kumar-one-outline';
import { SourceSerif4_600SemiBold, SourceSerif4_700Bold } from '@expo-google-fonts/source-serif-4';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { Image, Pressable as NativePressable, StyleSheet, TextInputProps, View } from 'react-native';
import { imageSrc } from '../lib/mapImage';
import { useContaAtiva } from '../store/conta';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { Appearance } from 'react-native';
import { NavIcon } from '../components/NavIcon';
import { OutlineText } from '../components/OutlineText';
import { appColors, getTheme, type ThemeMode } from '../lib/theme';
import { DaltonismType, getAcessibilidade, setPaletteApplier } from '../store/acessibilidade';

const NORMAL_COLORS = {
  background: '#353E43', surface: '#353E43', surfaceContainer: '#3B454B', surfaceContainerLowest: '#353E43',
  surfaceContainerHigh: '#3B454B', surfaceContainerHighest: '#6A89A7', surfaceBright: '#6A89A7',
  onSurface: '#FFFFFF', onSurfaceVariant: '#C0C0C0', outline: '#C0C0C0', outlineVariant: '#6C757A',
  primary: '#70B596', onPrimary: '#252525', primaryContainer: '#1E1E1E', onPrimaryContainer: '#70B596',
  primaryFixedDim: '#70B596', secondary: '#C0C0C0',
  canvas: '#587E9D', btn: '#252525', btnText: '#6A89A7', sapphire: '#8FB8DE', field: '#6A89A7', fieldText: '#10202E', placeholder: 'rgba(16,32,46,0.65)', tile: 'rgba(0,0,0,0.2)',
} as const;
const ACCESSIBLE_BASE = {
  background: '#0B1020', surface: '#0B1020', surfaceContainer: '#121D31', surfaceContainerLowest: '#0B1020',
  surfaceContainerHigh: '#172A43', surfaceContainerHighest: '#253B5B', surfaceBright: '#2A4868',
  onSurface: '#FFFFFF', onSurfaceVariant: '#E2EDF7', outline: '#F2F7FB', outlineVariant: '#B9D6E9',
} as const;
const NORMAL_AUTH = { canvas: '#353E43', panel: '#353E43', profilePanel: '#353E43', field: '#6A89A7', mint: '#70B596', white: '#FFFFFF', button: '#252525', gray: '#C0C0C0', typed: '#10202E', placeholder: 'rgba(16,32,46,0.65)' } as const;
const TYPE_ACCENTS: Record<DaltonismType, { primary: string; onPrimary: string; primaryContainer: string; onPrimaryContainer: string; secondary: string }> = {
  protanopia: { primary: '#56B4E9', onPrimary: '#071522', primaryContainer: '#204A68', onPrimaryContainer: '#FFFFFF', secondary: '#E69F00' },
  deuteranopia: { primary: '#0072B2', onPrimary: '#FFFFFF', primaryContainer: '#164C70', onPrimaryContainer: '#FFFFFF', secondary: '#F0E442' },
  tritanopia: { primary: '#D55E00', onPrimary: '#FFFFFF', primaryContainer: '#663820', onPrimaryContainer: '#FFFFFF', secondary: '#CC79A7' },
  acromatopsia: { primary: '#FFFFFF', onPrimary: '#111111', primaryContainer: '#555555', onPrimaryContainer: '#FFFFFF', secondary: '#BDBDBD' },
};
const ACCESSIBLE_AUTH_BASE = { canvas: '#0B1020', panel: '#172A43', profilePanel: '#0B1020', field: '#253B5B', mint: '#65DEFF', white: '#FFFFFF', button: '#23466B', gray: '#E2EDF7', typed: '#FFFFFF', placeholder: 'rgba(255,255,255,0.72)' } as const;

// Mantém a interface dos tokens estável e atualiza os valores em tempo de execução.
export const COLORS = { ...NORMAL_COLORS } as { -readonly [K in keyof typeof NORMAL_COLORS]: string };
export const AUTH_COLORS = { ...NORMAL_AUTH } as { -readonly [K in keyof typeof NORMAL_AUTH]: string };
let appliedPalette = 'normal|medieval|dark';

/** Claro ou escuro de fato: com "Sistema", o do aparelho. */
export function resolvedThemeMode(): ThemeMode {
  const { modoTema } = getAcessibilidade();
  return modoTema === 'system' ? (Appearance.getColorScheme() === 'light' ? 'light' : 'dark') : modoTema;
}

/**
 * Aplica as cores do app. O modo daltônico tem prioridade (paleta própria de alto contraste);
 * sem ele valem o tema e o modo escolhidos em Tema e paleta. Medieval escuro é a paleta original.
 */
export function applyAccessibilityPalette(enabled: boolean, type: DaltonismType = 'deuteranopia') {
  const { tema } = getAcessibilidade();
  const mode = resolvedThemeMode();
  const paletteId = enabled ? `${type}` : `normal|${tema}|${mode}`;
  if (appliedPalette === paletteId) return;
  let palette: Record<string, string>;
  let authPalette: Record<string, string>;
  if (enabled) {
    const accents = TYPE_ACCENTS[type];
    palette = { ...ACCESSIBLE_BASE, ...accents, primaryFixedDim: accents.primary, canvas: '#0B1020', btn: accents.primaryContainer, btnText: '#FFFFFF', sapphire: accents.primary, field: '#253B5B', fieldText: '#FFFFFF', placeholder: 'rgba(255,255,255,0.72)', tile: 'rgba(0,0,0,0.25)' };
    authPalette = { ...ACCESSIBLE_AUTH_BASE, mint: accents.primary, button: accents.primaryContainer };
  } else if (tema === 'medieval' && mode === 'dark') {
    palette = NORMAL_COLORS;
    authPalette = NORMAL_AUTH;
  } else {
    ({ colors: palette, auth: authPalette } = appColors(getTheme(tema)[mode], mode));
  }
  Object.assign(COLORS, palette);
  Object.assign(AUTH_COLORS, authPalette);
  appliedPalette = paletteId;
}
setPaletteApplier(() => { const a = getAcessibilidade(); applyAccessibilityPalette(a.daltonico, a.tipoDaltonismo); });

/** Estilos que usam cores do tema: recriados quando a paleta muda (StyleSheet.create congelaria as cores do primeiro render). */
export const paletteKey = () => appliedPalette;

export function themedStyles<T extends StyleSheet.NamedStyles<T>>(make: () => T, key: () => string): T {
  let cached: T | null = null;
  let cachedKey = '';
  return new Proxy({} as T, {
    get(_, name) {
      const k = key();
      if (!cached || cachedKey !== k) { cached = StyleSheet.create(make()) as T; cachedKey = k; }
      return (cached as Record<string | symbol, unknown>)[name];
    },
  });
}

export function appFontSize(size: number): number {
  // Mantido como utilitário de compatibilidade; a escala é aplicada globalmente
  // pelos wrappers AccessibleText e AccessibleTextInput durante cada render.
  return Math.max(10, Math.round(size));
}

export function useAppFonts() {
  const [loaded] = useFonts({ SourceSerif4_700Bold, SourceSerif4_600SemiBold, Inter_400Regular, Inter_500Medium, Inter_700Bold, FugazOne_400Regular, KumarOneOutline_400Regular });
  return loaded;
}

export function Logo({ size = 96 }: { size?: number }) {
  return <View style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2, borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}18` }]}><MaterialIcons name="casino" size={size * 0.5} color={COLORS.primary} /></View>;
}

export function Header({ title, onMenu, onBack, rightIcon = 'person', onRightPress }: { title: string; onMenu?: () => void; onBack?: () => void; rightIcon?: keyof typeof MaterialIcons.glyphMap; onRightPress?: () => void }) {
  const leftAction = onMenu ?? onBack;
  const conta = useContaAtiva();
  const avatar = rightIcon === 'person' ? imageSrc(conta?.avatarUrl) : null;
  // Cabeçalho do web no celular: botão (46 px) à esquerda, título em Kumar One Outline no centro e o perfil à direita, com um filete embaixo.
  // A moldura já reserva 40 px do topo e 18 px dos lados; o cabeçalho começa 6 px abaixo da linha e a 13 px dela (31 px da borda, como no Figma).
  const icon = COLORS.onSurfaceVariant;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginHorizontal: 13, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(192,192,192,0.7)' }}>
      <Pressable onPress={leftAction} disabled={!leftAction} style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={onMenu ? 'Abrir menu' : 'Voltar'}>
        {leftAction ? <NavIcon name={onMenu ? 'menu' : 'back'} size={34} color={icon} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}><OutlineText size={appFontSize(30)} color={COLORS.primary}>{title}</OutlineText></View>
      <Pressable onPress={onRightPress} disabled={!onRightPress} style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={rightIcon === 'person' ? 'Meu perfil' : rightIcon}>
        {avatar
          ? <Image source={{ uri: avatar }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(192,192,192,0.85)' }} />
          : rightIcon === 'person'
            ? <NavIcon name="user" size={46} color={icon} />
            : <MaterialIcons name={rightIcon} size={30} color={icon} />}
      </Pressable>
    </View>
  );
}
export function Screen({ children }: { children: React.ReactNode }) { return <View style={[styles.outer, { backgroundColor: COLORS.background }]}><View style={[styles.main, { backgroundColor: COLORS.background }]}>{children}</View></View>; }
export function Card({ children }: { children: React.ReactNode }) { return <View style={[styles.card, { backgroundColor: COLORS.surfaceContainerHigh, borderColor: COLORS.outlineVariant }]}>{children}</View>; }
interface FieldProps extends TextInputProps { label: string; icon?: keyof typeof MaterialIcons.glyphMap; isPassword?: boolean }
export function Field({ label, icon, isPassword, style, ...rest }: FieldProps) {
  const [hidden, setHidden] = useState(true);
  return <View style={styles.fieldWrapper}><Text style={[styles.fieldLabel, { color: COLORS.onSurface, fontSize: appFontSize(14) }]}>{label}</Text><View style={styles.fieldRow}>
    {icon && <MaterialIcons name={icon} size={20} color={COLORS.outlineVariant} style={styles.fieldIcon} />}
    <TextInput style={[styles.fieldInput, { backgroundColor: COLORS.surfaceContainerLowest, borderColor: COLORS.outlineVariant, color: COLORS.onSurface, fontSize: appFontSize(16) }, icon ? { paddingLeft: 44 } : null, style]} placeholderTextColor={COLORS.placeholder} autoCapitalize="none" secureTextEntry={isPassword ? hidden : rest.secureTextEntry} {...rest} />
    {isPassword && <Pressable onPress={() => setHidden((v) => !v)} style={styles.fieldTrailingIcon} accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}><MaterialIcons name={hidden ? 'visibility-off' : 'visibility'} size={20} color={COLORS.outlineVariant} /></Pressable>}
  </View></View>;
}
export function PrimaryButton({ title, onPress, icon }: { title: string; onPress?: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) {
  return <Pressable style={[styles.primaryButton, { backgroundColor: COLORS.primary }]} onPress={onPress}><Text style={[styles.primaryButtonText, { color: COLORS.onPrimary, fontSize: appFontSize(15) }]}>{title}</Text>{icon && <MaterialIcons name={icon} size={20} color={COLORS.onPrimary} />}</Pressable>;
}
export function SecondaryButton({ title, onPress, icon }: { title: string; onPress?: () => void; icon?: React.ReactNode }) { return <Pressable style={[styles.secondaryButton, { backgroundColor: COLORS.surfaceContainerHigh, borderColor: COLORS.outlineVariant }]} onPress={onPress}>{icon}<Text style={[styles.secondaryButtonText, { color: COLORS.onSurface, fontSize: appFontSize(15) }]}>{title}</Text></Pressable>; }
export function LinkText({ children, onPress, align = 'left' }: { children: React.ReactNode; onPress?: () => void; align?: 'left' | 'right' | 'center' }) {
  return <Pressable onPress={onPress} style={{ alignSelf: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}><Text style={[styles.linkText, { color: COLORS.primary, fontSize: appFontSize(14) }]}>{children}</Text></Pressable>;
}
export function PasswordStrength({ strength, label, hint = 'Mín. 8 caracteres' }: { strength: number; label: string; hint?: string }) {
  return <View style={{ gap: 4 }}><View style={{ flexDirection: 'row', gap: 4, height: 6 }}>{[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: i < strength ? COLORS.primary : 'rgba(112,181,150,0.25)' }} />)}</View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MaterialIcons name="shield" size={14} color={COLORS.primary} /><Text style={[styles.passwordStrength, { fontSize: appFontSize(12) }]}>{label}</Text></View><Text style={[styles.passwordHint, { fontSize: appFontSize(11) }]}>{hint}</Text></View></View>;
}
export function Toggle({ label, description, value, onValueChange }: { label: string; description?: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <Pressable onPress={() => onValueChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 48 }}><View style={{ flex: 1, gap: 3 }}><Text style={{ color: COLORS.onSurface, fontFamily: 'Inter_700Bold', fontSize: appFontSize(15) }}>{label}</Text>{description ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: appFontSize(12) }}>{description}</Text> : null}</View><View style={{ width: 48, height: 28, borderRadius: 15, padding: 3, justifyContent: 'center', backgroundColor: value ? COLORS.primary : COLORS.surfaceContainerHighest }}><View style={{ width: 22, height: 22, borderRadius: 11, alignSelf: value ? 'flex-end' : 'flex-start', backgroundColor: value ? COLORS.onPrimary : COLORS.onSurfaceVariant }} /></View></Pressable>;
}
export function SegmentedControl({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 9, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>{options.map((option) => { const active = option === selected; return <Pressable key={option} onPress={() => onSelect(option)} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 6, paddingHorizontal: 4, backgroundColor: active ? COLORS.primaryContainer : 'transparent', borderWidth: active ? 1 : 0, borderColor: COLORS.primary }}><Text style={{ color: active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant, fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular', fontSize: appFontSize(12), textAlign: 'center' }}>{option}</Text></Pressable>; })}</View>;
}
export function Divider() { return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: COLORS.outlineVariant }} />; }

const styles = themedStyles(() => ({
  outer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  main: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: COLORS.background },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant },
  headerButton: { width: 42, height: 42, justifyContent: 'center' },
  headerTitle: { color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: 22 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoCircle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(112,181,150,0.3)', backgroundColor: 'rgba(112,181,150,0.08)' },
  card: { backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 12, padding: 16 },
  fieldWrapper: { gap: 6 },
  fieldLabel: { color: COLORS.onSurface, fontFamily: 'Inter_700Bold', fontSize: 14, paddingLeft: 4 },
  fieldRow: { position: 'relative', justifyContent: 'center' },
  fieldIcon: { position: 'absolute', left: 14, zIndex: 1 },
  fieldInput: { minHeight: 48, borderRadius: 8, borderWidth: 2, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerLowest, paddingHorizontal: 16, color: COLORS.onSurface, fontFamily: 'Inter_400Regular', fontSize: 16 },
  fieldTrailingIcon: { position: 'absolute', right: 12, padding: 6 },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, backgroundColor: COLORS.primary, paddingHorizontal: 20 },
  primaryButtonText: { color: COLORS.onPrimary, fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh, paddingHorizontal: 16 },
  secondaryButtonText: { color: COLORS.onSurface, fontFamily: 'Inter_700Bold', fontSize: 15 },
  linkText: { color: COLORS.primary, fontFamily: 'Inter_700Bold', fontSize: 14, textDecorationLine: 'underline' },
  passwordStrength: { color: COLORS.onSurfaceVariant, fontFamily: 'Inter_700Bold', fontSize: 12 },
  passwordHint: { color: COLORS.outline, fontFamily: 'Inter_400Regular', fontSize: 11 },
}), () => appliedPalette);
