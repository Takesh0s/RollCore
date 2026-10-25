import { useAcessibilidade } from '../../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, appFontSize } from '../../design/shared';
import { removePersonagem, selectPersonagem, usePersonagens } from '../../store/personagem';

export default function CharactersScreen() {
  useAcessibilidade();
  const router = useRouter();
  const personagens = usePersonagens();

  const abrir = (id: string) => {
    selectPersonagem(id);
    router.push(`/personagens?id=${id}` as any);
  };
  const editar = (id: string) => router.push(`/criar-personagem?id=${id}` as any);
  const excluir = (id: string, nome: string) => Alert.alert('Excluir personagem?', `A ficha de “${nome}” será removida deste aparelho.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => removePersonagem(id) },
  ]);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 104, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: appFontSize(20), fontFamily: 'SourceSerif4_700Bold' }}>Os Meus Heróis</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(13), fontFamily: 'AtkinsonHyperlegible_400Regular' }}>{personagens.length} {personagens.length === 1 ? 'personagem' : 'personagens'}</Text>
        </View>

        {personagens.map((personagem) => (
          <Card key={personagem.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => abrir(personagem.id)} accessibilityLabel={`Abrir ficha de ${personagem.nome}`} style={{ width: 62, height: 62, borderRadius: 31, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                {personagem.imagemUri ? <Image source={{ uri: personagem.imagemUri }} style={{ width: '100%', height: '100%' }} /> : <MaterialIcons name="person" size={32} color={COLORS.onSurfaceVariant} />}
              </Pressable>
              <Pressable onPress={() => abrir(personagem.id)} style={{ flex: 1 }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(11), fontFamily: 'AtkinsonHyperlegible_700Bold', textTransform: 'uppercase' }}>Nível {personagem.nivel} · {personagem.raca || 'Aventureiro'} {personagem.classe}</Text>
                <Text numberOfLines={1} style={{ color: COLORS.primary, fontSize: appFontSize(19), fontFamily: 'SourceSerif4_700Bold', marginTop: 3 }}>{personagem.nome}</Text>
                <Text style={{ color: COLORS.secondary, fontSize: appFontSize(12), fontFamily: 'AtkinsonHyperlegible_400Regular', marginTop: 4 }}>PV {personagem.pontosVida ?? '—'} · CA {personagem.classeArmadura ?? '—'}</Text>
              </Pressable>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Pressable onPress={() => editar(personagem.id)} accessibilityLabel={`Editar ${personagem.nome}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.primaryContainer }}>
                  <MaterialIcons name="edit" size={15} color={COLORS.onPrimaryContainer} />
                  <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>Editar</Text>
                </Pressable>
                <Pressable onPress={() => excluir(personagem.id, personagem.nome)} accessibilityLabel={`Excluir ${personagem.nome}`} style={{ padding: 3 }}><MaterialIcons name="delete-outline" size={19} color={COLORS.onSurfaceVariant} /></Pressable>
              </View>
            </View>
          </Card>
        ))}

        {personagens.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 46, gap: 10 }}>
            <MaterialIcons name="badge" size={46} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>Sua primeira ficha começa aqui</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), textAlign: 'center' }}>Crie um herói, escolha uma foto e mantenha atributos e detalhes salvos neste aparelho.</Text>
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => router.push('/criar-personagem')} accessibilityLabel="Criar novo personagem" style={{ position: 'absolute', right: 16, bottom: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8 }}>
        <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}
