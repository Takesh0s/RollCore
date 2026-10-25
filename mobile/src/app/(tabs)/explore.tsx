import { useAcessibilidade } from '../../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, appFontSize } from '../../design/shared';

interface ResultadoBusca {
  id: string;
  titulo: string;
  categoria: 'Livro' | 'Feitiço' | 'Monstro';
  descricao: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const CATALOGO: ResultadoBusca[] = [
  { id: 'manual-jogador', titulo: 'Manual do Jogador', categoria: 'Livro', descricao: 'Raças, Classes, Magias e Regras', icon: 'menu-book' },
  { id: 'guia-mestre', titulo: 'Guia do Mestre', categoria: 'Livro', descricao: 'Criação de Mundos e Tesouros', icon: 'shield' },
  { id: 'manual-monstros', titulo: 'Manual dos Monstros', categoria: 'Livro', descricao: 'Bestiário completo D&D 5e', icon: 'auto-stories' },
  { id: 'bola-de-fogo', titulo: 'Bola de Fogo', categoria: 'Feitiço', descricao: '3º Nível · Evocação', icon: 'local-fire-department' },
  { id: 'curar-feridas', titulo: 'Curar Feridas', categoria: 'Feitiço', descricao: '1º Nível · Evocação', icon: 'healing' },
  { id: 'projetil-magico', titulo: 'Projétil Mágico', categoria: 'Feitiço', descricao: '1º Nível · Evocação', icon: 'auto-awesome' },
  { id: 'dragao-vermelho', titulo: 'Dragão Vermelho Jovem', categoria: 'Monstro', descricao: 'Desafio 10 · Enorme dragão', icon: 'pets' },
  { id: 'goblin', titulo: 'Goblin', categoria: 'Monstro', descricao: 'Desafio 1/4 · Pequeno humanoide', icon: 'pets' },
  { id: 'strahd', titulo: 'Strahd von Zarovich', categoria: 'Monstro', descricao: 'Desafio 15 · Vampiro médio', icon: 'pets' },
];

const CORES_CATEGORIA: Record<ResultadoBusca['categoria'], string> = {
  Livro: COLORS.primary,
  Feitiço: '#93C5FD',
  Monstro: '#F87171',
};

export default function ExploreScreen() {
  useAcessibilidade();
  const [query, setQuery] = useState('');

  const resultados = useMemo(() => {
    const termo = query.trim().toLowerCase();
    if (!termo) return [];
    return CATALOGO.filter(
      (item) =>
        item.titulo.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo)
    );
  }, [query]);

  // O cabeçalho (hambúrguer, título e perfil) vem do _layout.tsx do grupo (tabs).
  // Por isso a área segura do topo não é aplicada aqui (edges sem 'top').
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ padding: 24, paddingBottom: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: COLORS.surfaceContainerHighest,
            borderWidth: 2,
            borderColor: COLORS.outlineVariant,
            borderRadius: 8,
            paddingHorizontal: 16,
            height: 48,
          }}
        >
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Pesquisar manuais, feitiços, monstros..."
            placeholderTextColor="rgba(192,192,192,0.5)"
            style={{
              flex: 1,
              color: COLORS.onSurface,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Limpar busca">
              <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        {query.trim() === '' ? (
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            Digite algo pra buscar manuais, feitiços e monstros.
          </Text>
        ) : resultados.length === 0 ? (
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            Nenhum resultado para "{query}".
          </Text>
        ) : (
          resultados.map((item) => (
            <Card key={item.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.surfaceContainerHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={item.icon} size={22} color={CORES_CATEGORIA[item.categoria]} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.onSurfaceVariant,
                      fontSize: appFontSize(11),
                      fontFamily: 'AtkinsonHyperlegible_700Bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.categoria}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.primary,
                      fontSize: appFontSize(17),
                      fontFamily: 'SourceSerif4_700Bold',
                    }}
                  >
                    {item.titulo}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.secondary,
                      fontSize: appFontSize(13),
                      fontFamily: 'AtkinsonHyperlegible_400Regular',
                      marginTop: 2,
                    }}
                  >
                    {item.descricao}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}