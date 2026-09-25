// PlaceholderScreen.tsx — RollCore
//
// Tela temporária para abas ainda não implementadas (Ficha de Atributos,
// Grimório, Inventário). Substituir cada uso por uma tela real conforme
// forem construídas.

import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, useAppFonts } from '../design/shared';

export default function PlaceholderScreen({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
        <MaterialIcons name={icon} size={48} color={COLORS.outline} />
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 22 }}>
          {title}
        </Text>
        <Text
          style={{
            color: COLORS.onSurfaceVariant,
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: 14,
            textAlign: 'center',
          }}>
          Em breve.
        </Text>
      </View>
    </SafeAreaView>
  );
}
