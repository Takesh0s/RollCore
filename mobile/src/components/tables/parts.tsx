import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize, resolvedThemeMode } from '../../design/shared';
import { useAcessibilidade } from '../../store/acessibilidade';

export const BODY = 'Inter_400Regular';
export const BOLD = 'Inter_700Bold';
export const SERIF = 'SourceSerif4_700Bold';
export const BTN = 'FugazOne_400Regular';
export const FAIL = '#FF8A80';

/** `.section-title` do web: serifa branca centralizada com um filete prateado de cada lado. */
export function RuleTitle({ children }: { children: string }) {
  const { tema } = useAcessibilidade();
  const cyber = tema === 'cyberpunk';
  const line = { flex: 1, height: 1, backgroundColor: COLORS.rule } as const;
  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 10 }}>
      <View style={line} />
      <Text style={{ color: cyber ? (resolvedThemeMode() === 'light' ? '#00717F' : '#02D7F2') : COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(14), ...(cyber ? { textTransform: 'uppercase', letterSpacing: 2 } : null) }}>{children}</Text>
      <View style={line} />
    </View>
  );
}

/**
 * Botões do web em Fugaz One: `primary` = `.btn-primary` (escuro, brilho branco), `outline` = `.btn-outline`
 * (vidro com borda prateada), `danger` = `.btn-danger` (contorno vermelho). `pill` = `.btn-pill` (13 px, 999 de raio).
 */
export function PillBtn({ label, onPress, kind = 'outline', pill = true, block, disabled, accessibilityLabel }: {
  label: string; onPress: () => void; kind?: 'primary' | 'outline' | 'danger'; pill?: boolean; block?: boolean; disabled?: boolean; accessibilityLabel?: string;
}) {
  const primary = kind === 'primary';
  const danger = kind === 'danger';
  // Cyberpunk (cyberpunk.css): botões primários e em pílula ficam amarelos, com texto preto, cantos retos e caixa alta.
  const cyber = useAcessibilidade().tema === 'cyberpunk' && !danger && (primary || pill);
  // Neon (desktop.css): primário com borda rosa e brilho rosa/roxo.
  const neon = useAcessibilidade().tema === 'neon' && primary;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      style={{
        alignSelf: block ? 'stretch' : 'auto', alignItems: 'center', justifyContent: 'center', minWidth: pill ? 0 : 132,
        paddingVertical: pill ? 5 : 10, paddingHorizontal: pill ? 16 : 26, borderRadius: cyber ? 0 : pill ? 999 : 14,
        backgroundColor: cyber ? '#FCEE0A' : primary ? COLORS.btn : kind === 'outline' ? COLORS.fill : 'transparent',
        borderWidth: neon ? 1.5 : primary || cyber ? 0 : 1, borderColor: neon ? '#FF2E97' : danger ? FAIL : COLORS.ruleSoft,
        opacity: disabled ? 0.55 : 1,
        ...(primary && !disabled && !cyber ? { shadowColor: neon ? '#FF2E97' : COLORS.glow, shadowOpacity: neon ? 0.6 : pill ? 0.3 : 0.35, shadowRadius: pill ? 5 : 7, shadowOffset: { width: 0, height: 0 }, elevation: 4 } : null),
      }}>
      <Text style={{ color: cyber ? '#050505' : primary ? COLORS.btnText : danger ? FAIL : COLORS.sapphire, fontFamily: BTN, fontSize: appFontSize(pill ? 13 : 15), ...(cyber ? { textTransform: 'uppercase', letterSpacing: 1 } : null) }}>{label}</Text>
    </Pressable>
  );
}

/** `.profile-row`: rótulo à esquerda, valor à direita. */
export function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 6 }}>
      <Text style={{ flexShrink: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>{label}</Text>
      {children}
    </View>
  );
}

/** Degradê diagonal do banner sem capa (`linear-gradient(135deg, #3d5a73, #2a3a46 55%, #3b6b59)`). */
export function Gradient({ colors, stops, vertical }: { colors: string[]; stops: number[]; vertical?: boolean }) {
  // id único: no web os ids do SVG são globais no documento e dois degradês com o mesmo id se sobrepõem
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2="1">
          {colors.map((c, i) => <Stop key={i} offset={stops[i]} stopColor={c.split('|')[0]} stopOpacity={Number(c.split('|')[1] ?? 1)} />)}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
