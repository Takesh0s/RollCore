import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Header, useAppFonts, appFontSize } from '../design/shared';
import { ATRIBUTOS_BASE, modificador, removePersonagem, selectPersonagem, usePersonagem } from '../store/personagem';

export default function FichaAtributosScreen() {
  useAcessibilidade();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const fontsLoaded = useAppFonts();
  const personagem = usePersonagem(id);
  const [results, setResults] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (id && personagem.id !== 'sem-personagem') selectPersonagem(id);
    setResults({});
  }, [id]);

  if (!fontsLoaded) return null;

  const temFicha = personagem.id !== 'sem-personagem';
  const rollAttribute = (key: string, modifier: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setResults((prev) => ({ ...prev, [key]: d20 + modifier }));
  };
  const editar = () => router.push(`/criar-personagem?id=${personagem.id}` as any);
  const excluir = () => Alert.alert('Excluir ficha?', `Deseja remover a ficha de “${personagem.nome}”?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => { removePersonagem(personagem.id); router.replace('/skills' as any); } },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Ficha de Personagem" onBack={() => router.back()} rightIcon={temFicha ? 'edit' : 'person'} onRightPress={temFicha ? editar : undefined} />
      {!temFicha ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
          <MaterialIcons name="badge" size={54} color={COLORS.primary} />
          <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(21) }}>Nenhuma ficha selecionada</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, textAlign: 'center', fontFamily: 'AtkinsonHyperlegible_400Regular', lineHeight: 20 }}>Crie um personagem para guardar os atributos, a foto e os detalhes da aventura.</Text>
          <Pressable onPress={() => router.push('/criar-personagem')} style={{ minHeight: 46, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, backgroundColor: COLORS.primary }}>
            <MaterialIcons name="add" size={20} color={COLORS.onPrimary} /><Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Criar personagem</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 82, height: 82, borderRadius: 41, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 2, borderColor: COLORS.primary }}>
                {personagem.imagemUri ? <Image source={{ uri: personagem.imagemUri }} style={{ width: '100%', height: '100%' }} /> : <MaterialIcons name="person" size={42} color={COLORS.onSurfaceVariant} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12), textTransform: 'uppercase' }}>Nível {personagem.nivel}{personagem.raca ? ` · ${personagem.raca}` : ''}</Text>
                <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(23) }}>{personagem.nome}</Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>{personagem.classe}</Text>
              </View>
              <Pressable onPress={excluir} accessibilityLabel="Excluir personagem" style={{ padding: 6 }}><MaterialIcons name="delete-outline" size={22} color={COLORS.onSurfaceVariant} /></Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              {[{ label: 'PV', value: personagem.pontosVida ?? '—', icon: 'favorite' as const }, { label: 'CA', value: personagem.classeArmadura ?? '—', icon: 'shield' as const }].map((item) => (
                <View key={item.label} style={{ flex: 1, minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.surfaceContainer, borderRadius: 8 }}>
                  <MaterialIcons name={item.icon} size={19} color={COLORS.primary} /><View><Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>{item.label}</Text><Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(16) }}>{item.value}</Text></View>
                </View>
              ))}
            </View>
          </Card>

          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(19) }}>Atributos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            {ATRIBUTOS_BASE.map((atributo) => {
              const value = personagem.valores[atributo.key] ?? 10;
              const modifier = modificador(value);
              return (
                <View key={atributo.key} style={{ width: '47%', backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 2, borderTopColor: modifier >= 2 ? COLORS.primary : COLORS.outlineVariant }}>
                  <MaterialIcons name={atributo.icon} size={20} color={COLORS.primary} />
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(11), letterSpacing: 1, marginTop: 5 }}>{atributo.label}</Text>
                  <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(34) }}>{modifier >= 0 ? `+${modifier}` : modifier}</Text>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11), marginBottom: 10 }}>Valor: {value}</Text>
                  <Pressable onPress={() => rollAttribute(atributo.key, modifier)} style={{ width: '100%', minHeight: 38, backgroundColor: COLORS.primary, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <MaterialIcons name="casino" size={17} color={COLORS.onPrimary} /><Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Rolar</Text>
                  </Pressable>
                  {results[atributo.key] != null && <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12), marginTop: 6 }}>Resultado: {results[atributo.key]}</Text>}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
