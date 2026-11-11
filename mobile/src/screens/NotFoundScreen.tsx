import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText as Text } from '../components/accessible-text';
import { Btn } from '../components/Controls';
import { COLORS, Header, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';

/** Página não encontrada (mesma do web): link expirado, mesa removida ou rota que não existe. */
export default function NotFoundScreen() {
  useAcessibilidade();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Não encontrada" onBack={() => (router.canGoBack() ? router.back() : router.replace('/inicio' as any))} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh }}>
          <MaterialIcons name="explore-off" size={44} color={COLORS.outline} />
        </View>
        <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(22), textAlign: 'center' }}>Página não encontrada</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: appFontSize(15), textAlign: 'center' }}>O link pode ter expirado ou a mesa foi removida.</Text>
        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 8 }}>
          <Btn label="Voltar ao início" kind="primary" onPress={() => router.replace('/inicio' as any)} />
          <Btn label="Ver minhas mesas" onPress={() => router.replace('/mesas' as any)} />
        </View>
      </View>
    </SafeAreaView>
  );
}
