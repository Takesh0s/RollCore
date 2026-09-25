import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Divider, Header } from '../../design/shared';
import { PRODUTOS } from '../../store/produtos';


export default function LivrariaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Library" rightIcon="search" onRightPress={() => router.push('/(tabs)/explore')} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'SourceSerif4_700Bold' }}>
            Manuais e Compêndios
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 14, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
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
                  <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, fontFamily: 'AtkinsonHyperlegible_700Bold', textTransform: 'uppercase' }}>
                    {produto.categoria}
                  </Text>
                  <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'SourceSerif4_700Bold', marginTop: 2 }}>
                    {produto.titulo}
                  </Text>
                </View>
              </View>

              <View style={{ marginVertical: 8 }}>
                <Divider />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 13 }}>
                  {produto.descricaoCurta}
                </Text>
                <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 14 }}>
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