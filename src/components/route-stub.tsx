import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text as NativeText, TouchableOpacity as NativeTouchableOpacity, View } from 'react-native';
import { AccessibleText as Text, AccessibleTouchableOpacity as TouchableOpacity } from './accessible-text';
import { COLORS, appFontSize } from '../design/shared';

interface RouteStubProps {
  title: string;
  icon?: string;
}

export default function RouteStub({ title, icon = 'hammer-wrench' }: RouteStubProps) {
  useAcessibilidade();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.onSurface} />
      </TouchableOpacity>

      <View style={styles.content}>
        <MaterialCommunityIcons name={icon as any} size={64} color={COLORS.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Em construção</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceContainerHigh },
  backButton: { padding: 20 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: COLORS.onSurface, fontSize: appFontSize(22), fontFamily: 'SourceSerif4_700Bold' },
  subtitle: { color: COLORS.onSurfaceVariant, fontSize: appFontSize(16) },
});