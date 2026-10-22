import { useAcessibilidade } from '../../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text } from '../../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, appFontSize } from '../../design/shared';

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
  useAcessibilidade();
  // O cabeçalho (hambúrguer, título e perfil) vem do _layout.tsx do grupo (tabs).
  // Por isso a área segura do topo não é aplicada aqui (edges sem 'top').
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.primary, fontSize: appFontSize(20), fontFamily: 'SourceSerif4_700Bold' }}>
            Feitiços
          </Text>
          <Text style={{ color: COLORS.secondary, fontSize: appFontSize(13), fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
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
                <Text style={{ color: COLORS.onSurface, fontSize: appFontSize(16), fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
                  {item.titulo}
                </Text>
                <Text style={{ color: COLORS.secondary, fontSize: appFontSize(13), fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
                  {item.subtitulo}
                </Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(12), fontFamily: 'AtkinsonHyperlegible_400Regular', fontStyle: 'italic' }}>
                  {item.fonte}
                </Text>
              </View>
            </View>
            {i < FEITICOS.length - 1 && (
              <View style={{ height: 1, backgroundColor: 'rgba(192,192,192,0.15)' }} />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
