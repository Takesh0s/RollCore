// PlaceholderWithNavScreen.tsx — RollCore
//
// Como skills.tsx e vault.tsx saíram do grupo (tabs), cada tela agora
// precisa desenhar sua própria BottomNavBar. Este componente genérico
// serve pra essas duas (e qualquer outra futura) enquanto o conteúdo
// real não é construído.

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavBar, COLORS, useAppFonts } from '../design/shared';

export default function PlaceholderWithNavScreen({
  title,
  icon,
  active,
}: {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active: string;
}) {
  const router = useRouter();
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
      <BottomNavBar active={active} onNavigate={(route) => router.push(route as any)} />
    </SafeAreaView>
  );
}
