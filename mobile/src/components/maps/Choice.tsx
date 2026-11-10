import { View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

/** Botão de escolha (tipo de mapa, formato, tamanho…) com título e uma linha de apoio. */
export function Choice({ title, hint, on, disabled, onPress, width }: { title: string; hint?: string; on?: boolean; disabled?: boolean; onPress: () => void; width: `${number}%` }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={hint ? `${title}. ${hint}` : title} accessibilityState={{ selected: !!on, disabled: !!disabled }}
      style={{ width, minHeight: 64, padding: 12, borderRadius: 12, justifyContent: 'center', gap: 2, opacity: disabled ? 0.45 : 1,
        backgroundColor: on ? COLORS.primaryContainer ?? COLORS.surfaceContainerHigh : 'transparent', borderWidth: on ? 2 : 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant }}>
      <Text style={{ color: on ? COLORS.primary : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{title}</Text>
      {hint ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11) }}>{hint}</Text> : null}
    </Pressable>
  );
}

export function ChoiceRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}
