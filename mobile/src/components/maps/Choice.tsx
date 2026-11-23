import { View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

/** `.map-choice`: botão de escolha (tipo de mapa, formato, tamanho…) com título e uma linha de apoio. */
export function Choice({ title, hint, on, disabled, onPress, width }: { title: string; hint?: string; on?: boolean; disabled?: boolean; onPress: () => void; width: `${number}%` }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={hint ? `${title}. ${hint}` : title} accessibilityState={{ selected: !!on, disabled: !!disabled }}
      style={{ width, minHeight: 58, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: disabled ? 0.5 : 1,
        backgroundColor: COLORS.surfaceContainerHigh, borderWidth: on ? 2 : 1, borderColor: on ? COLORS.btnText : COLORS.outlineVariant }}>
      <Text style={{ textAlign: 'center', color: on ? COLORS.btnText : '#FFFFFF', fontFamily: on ? BOLD : BODY, fontSize: appFontSize(13) }}>{title}</Text>
      {hint ? <Text style={{ textAlign: 'center', color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11) }}>{hint}</Text> : null}
    </Pressable>
  );
}

export function ChoiceRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{children}</View>;
}
