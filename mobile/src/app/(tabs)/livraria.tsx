import { useAcessibilidade } from '../../store/acessibilidade';
import { useRouter } from 'expo-router';
import { Image, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Divider, appFontSize } from '../../design/shared';
import { PRODUTOS } from '../../store/produtos';


export default function LivrariaScreen() {
  useAcessibilidade();
  const router = useRouter();

  // O cabeçalho (hambúrguer, título e perfil) vem do _layout.tsx do grupo (tabs).
  // Por isso a área segura do topo não é aplicada aqui (edges sem 'top').
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: appFontSize(20), fontFamily: 'SourceSerif4_700Bold' }}>
            Manuais e Compêndios
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(14), fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
            {PRODUTOS.length} Livros
          </Text>
        </View>

        {PRODUTOS.map((produto) => (
          <Pressable key={produto.id} onPress={() => router.push(`/campanha/${produto.id}` as any)}>
            <Card>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <Image
                  source={{ uri: produto.imagemUri }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(12), fontFamily: 'AtkinsonHyperlegible_700Bold', textTransform: 'uppercase' }}>
                    {produto.categoria}
                  </Text>
                  <Text style={{ color: COLORS.primary, fontSize: appFontSize(20), fontFamily: 'SourceSerif4_700Bold', marginTop: 2 }}>
                    {produto.titulo}
                  </Text>
                </View>
              </View>

              <View style={{ marginVertical: 8 }}>
                <Divider />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
                  {produto.descricaoCurta}
                </Text>
                <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>
                  {produto.preco}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
