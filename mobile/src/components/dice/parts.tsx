import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';

export const BODY = 'Inter_400Regular';
export const BOLD = 'Inter_700Bold';
export const SERIF = 'SourceSerif4_700Bold';
export const BTN = 'FugazOne_400Regular';
export const CRIT = '#6dbf94';
export const FAIL = '#e8878a';

/** `.section-title` (figma.css) com o ajuste do dice.css: serifa 14 branca, centralizada, filete de cada lado. */
export function DiceTitle({ children }: { children: string }) {
  const line = { flex: 1, height: 1, backgroundColor: 'rgba(192,192,192,0.7)' } as const;
  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 10 }}>
      <View style={line} />
      <Text style={{ color: '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(14) }}>{children}</Text>
      <View style={line} />
    </View>
  );
}

/** `.dice-chip`: pílula 12px com contorno; ativa = safira preenchida. */
export function DiceChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on, selected: on }} accessibilityLabel={label}
      style={{ paddingHorizontal: 15, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: on ? COLORS.sapphire : COLORS.outlineVariant, backgroundColor: on ? COLORS.sapphire : 'transparent' }}>
      <Text numberOfLines={1} style={{ color: on ? '#10202E' : '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(12) }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: scroll ? 'nowrap' : 'wrap', gap: 8, marginBottom: 8 }}>{children}</View>;
}

/** `.badge-crit` / `.badge-fail`. */
export function DiceBadge({ kind }: { kind: 'crit' | 'fail' }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: kind === 'crit' ? CRIT : FAIL }}>
      <Text style={{ color: kind === 'crit' ? '#0f2a1c' : '#3a1010', fontFamily: BOLD, fontSize: appFontSize(10), letterSpacing: 0.5 }}>{kind === 'crit' ? 'CRÍTICO' : 'FALHA'}</Text>
    </View>
  );
}

/** `.form-input` do web: fundo --field, texto --field-text, raio 12. */
export function fieldStyle(error?: boolean) {
  return { height: 42, borderRadius: 12, paddingHorizontal: 12, fontFamily: BODY, fontSize: appFontSize(14), backgroundColor: COLORS.field, color: COLORS.fieldText,
    borderWidth: 1, borderColor: error ? '#e8878a' : 'transparent' } as const;
}
