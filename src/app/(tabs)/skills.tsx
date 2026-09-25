import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Divider, Header } from '../../design/shared';

export default function CharactersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Characters" rightIcon="add" onRightPress={() => router.push('/criar-personagem')} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: 20, fontFamily: 'SourceSerif4_700Bold' }}>
            Os Meus Heróis
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 14, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
            1 Personagem
          </Text>
        </View>

        <Pressable onPress={() => router.push('/personagens')}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 12, fontFamily: 'AtkinsonHyperlegible_700Bold', textTransform: 'uppercase' }}>
                  Nível 5 • Elfo Mago
                </Text>
                <Text style={{ color: COLORS.primary, fontSize: 22, fontFamily: 'SourceSerif4_700Bold', marginTop: 2 }}>
                  Lyra Windrunner
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,220,161,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: COLORS.onPrimaryContainer, fontSize: 12, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
                  Ativa
                </Text>
              </View>
            </View>

            <View style={{ marginVertical: 8 }}>
              <Divider />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>CA</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>15</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>HP</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>38/38</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>Iniciativa</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>+3</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>Proficiência</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>+3</Text>
              </View>
            </View>
          </Card>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}