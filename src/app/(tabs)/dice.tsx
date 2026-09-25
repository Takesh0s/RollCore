import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header } from '../../design/shared';

interface ItemListagem {
  id: string;
  titulo: string;
  subtitulo: string;
  fonte: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  cor: string;
}

const FEITICOS: ItemListagem[] = [
  { id: '1', titulo: 'Bola de Fogo', subtitulo: '3º Nível · Evocação', fonte: 'Manual do Jogador', icon: 'local-fire-department', cor: '#F97316' },
  { id: '2', titulo: 'Curar Feridas', subtitulo: '1º Nível · Evocação', fonte: 'Manual do Jogador', icon: 'healing', cor: '#4ADE80' },
  { id: '3', titulo: 'Detectar Magia', subtitulo: '1º Nível · Adivinhação', fonte: 'Manual do Jogador', icon: 'visibility', cor: '#93C5FD' },
  { id: '4', titulo: 'Escudo Arcano', subtitulo: '1º Nível · Abjuração', fonte: 'Manual do Jogador', icon: 'shield', cor: '#93C5FD' },
  { id: '5', titulo: 'Projétil Mágico', subtitulo: '1º Nível · Evocação', fonte: 'Manual do Jogador', icon: 'auto-awesome', cor: '#C084FC' },
  { id: '6', titulo: 'Teia de Aranha', subtitulo: '2º Nível · Conjuração', fonte: 'Manual do Jogador', icon: 'blur-on', cor: '#D1D5DB' },
];

export default function ListingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Listings" rightIcon="search" onRightPress={() => router.push('/(tabs)/explore')} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'SourceSerif4_700Bold' }}>
            Feitiços
          </Text>
          <Text style={{ color: COLORS.secondary, fontSize: 13, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
            Nome: A-Z
          </Text>
        </View>

        {FEITICOS.map((item, i) => (
          <View key={item.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: COLORS.surfaceContainerHighest,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={item.icon} size={22} color={item.cor} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.onSurface, fontSize: 16, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
                  {item.titulo}
                </Text>
                <Text style={{ color: COLORS.secondary, fontSize: 13, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
                  {item.subtitulo}
                </Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, fontFamily: 'AtkinsonHyperlegible_400Regular', fontStyle: 'italic' }}>
                  {item.fonte}
                </Text>
              </View>
            </View>
            {i < FEITICOS.length - 1 && (
              <View style={{ height: 1, backgroundColor: 'rgba(158,143,120,0.15)' }} />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}