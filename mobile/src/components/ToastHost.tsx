import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, appFontSize } from '../design/shared';
import { useToast } from '../store/useToast';
import { AccessibleText as Text } from './accessible-text';

const ICON = { info: 'info-outline', success: 'check-circle-outline', error: 'error-outline' } as const;

/** Renders the current toast above everything; mounted once in the root layout. */
export function ToastHost() {
  const { message, kind } = useToast();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  const color = kind === 'error' ? '#e57373' : kind === 'success' ? COLORS.primary : COLORS.onSurface;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 20, alignItems: 'center' }}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, maxWidth: 520,
          backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: color }}>
        <MaterialIcons name={ICON[kind]} size={18} color={color} />
        <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), flexShrink: 1 }}>{message}</Text>
      </View>
    </View>
  );
}
