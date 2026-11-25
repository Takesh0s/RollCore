import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { NavIcon } from '../NavIcon';
import { COLORS, appFontSize } from '../../design/shared';
import { BODY, SERIF } from '../tables/parts';

/** `.search-box` do web: campo em pílula com a lupa. */
export function SearchBox({ value, onChangeText, placeholder, label }: { value: string; onChangeText: (t: string) => void; placeholder: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: COLORS.fill }}>
      <NavIcon name="search" size={22} color={COLORS.onSurfaceVariant} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.outline} accessibilityLabel={label} returnKeyType="search"
        style={{ flex: 1, minWidth: 0, paddingVertical: 8, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }} />
    </View>
  );
}

/** `.map-card`: cartão da biblioteca e da Oficina (prévia, nome, resumo e ações). */
export function MapCardFrame({ label, thumb, name, meta, children }: { label: string; thumb: ReactNode; name: string; meta: string[]; children: ReactNode }) {
  return (
    <View accessibilityLabel={label} style={{ gap: 6, padding: 10, borderRadius: 12, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <View style={{ alignItems: 'center', borderRadius: 8, overflow: 'hidden' }}>{thumb}</View>
      <Text numberOfLines={2} style={{ marginTop: 6, color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(17) }}>{name}</Text>
      {meta.map((m) => <Text key={m} style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{m}</Text>)}
      <View style={{ gap: 8, marginTop: 4 }}>{children}</View>
    </View>
  );
}
