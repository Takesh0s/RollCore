import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text as NativeText, View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header, PrimaryButton } from '../design/shared';
import { carregarDetalhe, getMesaById, useMesas } from '../store/mesas';

export default function SessaoAtivaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  useMesas(); // re-render when the invite code arrives
  const mesa = getMesaById(id);
  useEffect(() => { if (id) carregarDetalhe(id).catch(() => undefined); }, [id]);

  if (!mesa) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Mesa" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.onSurfaceVariant }}>Mesa não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={mesa.titulo} onBack={() => router.back()} />

      <View style={{ padding: 24, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="casino" size={20} color={COLORS.primary} />
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{mesa.sistema}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, marginLeft: 8 }}>· {mesa.papel}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="event" size={18} color={COLORS.onSurfaceVariant} />
          <Text style={{ color: COLORS.secondary }}>Próxima Sessão: {mesa.proximaSessao}</Text>
        </View>

        {mesa.codigoConvite ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="vpn-key" size={18} color={COLORS.onSurfaceVariant} />
            <Text selectable style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', letterSpacing: 2 }}>Código de convite: {mesa.codigoConvite}</Text>
          </View>
        ) : null}

        {mesa.descricao ? (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', lineHeight: 20 }}>
            {mesa.descricao}
          </Text>
        ) : null}

        <View style={{ marginTop: 24, gap: 12 }}>
          <PrimaryButton title="Ver Ficha de Personagem" icon="badge" onPress={() => router.push('/personagens')} />
          <PrimaryButton title="Rolar Dados" icon="casino" onPress={() => router.push('/dados')} />
        </View>
      </View>
    </SafeAreaView>
  );
}