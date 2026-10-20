import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Divider, Header } from '../../design/shared';
import { removeMesa, useMesas } from '../../store/mesas';

export default function MesasScreen() {
  const router = useRouter();
  const mesas = useMesas();

  const confirmarExclusao = (id: string, titulo: string) => {
    Alert.alert(
      'Excluir mesa',
      `Tem certeza que quer excluir "${titulo}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => removeMesa(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Campaigns" rightIcon="settings" onRightPress={() => router.push('/configuracoes')} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'SourceSerif4_700Bold' }}>
            Mesas Ativas
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 14, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
            {mesas.length} {mesas.length === 1 ? 'Campanha' : 'Campanhas'}
          </Text>
        </View>

        {mesas.map((mesa) => (
          <Pressable key={mesa.id} onPress={() => router.push(`/sessao/${mesa.id}` as any)}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, fontFamily: 'AtkinsonHyperlegible_700Bold', textTransform: 'uppercase' }}>
                    {mesa.sistema}
                  </Text>
                  <Text style={{ color: COLORS.primary, fontSize: 22, fontFamily: 'SourceSerif4_700Bold', marginTop: 2 }}>
                    {mesa.titulo}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    backgroundColor: mesa.papel === 'Mestre' ? 'rgba(255,220,161,0.1)' : 'rgba(255,255,255,0.05)',
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                  }}>
                    <Text style={{
                      color: mesa.papel === 'Mestre' ? COLORS.onPrimaryContainer : COLORS.secondary,
                      fontSize: 12, fontFamily: 'AtkinsonHyperlegible_700Bold',
                    }}>
                      {mesa.papel}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmarExclusao(mesa.id, mesa.titulo)}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ marginVertical: 8 }}>
                <Divider />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="event" size={18} color={COLORS.onSurfaceVariant} />
                <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 14 }}>
                  Próxima Sessão: {mesa.proximaSessao}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}

        <TouchableOpacity
          onPress={() => router.push('/mesa' as any)}
          style={{
            marginTop: 8, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12,
            paddingVertical: 14, alignItems: 'center',
          }}
        >
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 16 }}>
            + Criar ou Entrar em Mesa
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}