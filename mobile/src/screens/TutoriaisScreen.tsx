import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';

type TutorialCategory = 'Começando' | 'Personagens' | 'Mesas' | 'Ferramentas';
type Tutorial = {
  id: string;
  title: string;
  category: TutorialCategory;
  icon: keyof typeof MaterialIcons.glyphMap;
  summary: string;
  steps: string[];
  actionLabel: string;
  route: string;
};

const TUTORIALS: Tutorial[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos',
    category: 'Começando',
    icon: 'explore',
    summary: 'Prepare seu perfil de jogo e entre no mundo de RollCore.',
    steps: ['Crie um personagem ou escolha uma ficha que já tenha.', 'Crie uma mesa para sua campanha ou entre usando um código.', 'Use o menu lateral para acessar dados, inventário, comunidade e outras ferramentas.'],
    actionLabel: 'Criar personagem',
    route: '/criar-personagem',
  },
  {
    id: 'criar-personagem',
    title: 'Criar seu personagem',
    category: 'Personagens',
    icon: 'person-add',
    summary: 'Monte uma ficha inicial com nome, classe, nível e atributos.',
    steps: ['Abra a tela de criação e informe o nome do personagem.', 'Adicione classe e nível; se deixar a classe vazia, ela começa como Aventureiro.', 'Ajuste os seis atributos com os botões de + e − e confira os modificadores.', 'Salve para abrir sua lista de personagens.'],
    actionLabel: 'Abrir criação',
    route: '/criar-personagem',
  },
  {
    id: 'mesa',
    title: 'Criar ou entrar em uma mesa',
    category: 'Mesas',
    icon: 'groups',
    summary: 'Organize uma campanha ou use o código de convite de outra mesa.',
    steps: ['Na aba Criar, escolha um nome e o sistema de RPG.', 'Preencha a descrição se quiser dar contexto à campanha.', 'Para entrar em uma mesa existente, selecione Entrar e informe o código.', 'Ao concluir, a mesa aparece na sua lista.'],
    actionLabel: 'Abrir mesas',
    route: '/mesa',
  },
  {
    id: 'ficha',
    title: 'Consultar sua ficha',
    category: 'Personagens',
    icon: 'assignment-ind',
    summary: 'Encontre seus heróis e consulte os atributos principais.',
    steps: ['Abra Fichas pelo menu lateral.', 'Toque no personagem para acessar a ficha.', 'Use a ação de rolagem em um atributo para testar o valor com um d20.'],
    actionLabel: 'Ver fichas',
    route: '/skills',
  },
  {
    id: 'dados',
    title: 'Rolar dados',
    category: 'Ferramentas',
    icon: 'casino',
    summary: 'Faça rolagens rápidas e acompanhe o resultado no histórico.',
    steps: ['Escolha o dado desejado: d4, d6, d8, d10, d12, d20 ou d100.', 'O resultado aparece na tela e é adicionado ao histórico.', 'No d20, os resultados 20 e 1 recebem indicação de sucesso ou falha crítica.'],
    actionLabel: 'Abrir dados',
    route: '/dados',
  },
  {
    id: 'inventario',
    title: 'Usar o inventário',
    category: 'Personagens',
    icon: 'inventory-2',
    summary: 'Organize itens carregados pelo personagem e acompanhe quantidades.',
    steps: ['Abra Inventário no menu lateral.', 'Pesquise ou filtre itens por categoria.', 'Use os controles da tela para adicionar, equipar ou remover itens.'],
    actionLabel: 'Abrir inventário',
    route: '/vault',
  },
  {
    id: 'gm-tools',
    title: 'Preparar uma sessão como mestre',
    category: 'Ferramentas',
    icon: 'auto-fix-high',
    summary: 'Acesse os painéis para organizar mapas, NPCs, lojas, itens, monstros e ambientes.',
    steps: ['Abra GM Tools pelo menu lateral.', 'Escolha uma ferramenta e preencha os campos disponíveis.', 'Os exemplos salvos aparecem em Recentes do mestre enquanto a tela permanecer aberta.'],
    actionLabel: 'Abrir GM Tools',
    route: '/gmtools',
  },
];

const CATEGORIES: Array<'Todos' | TutorialCategory> = ['Todos', 'Começando', 'Personagens', 'Mesas', 'Ferramentas'];

export default function TutoriaisScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Todos');
  const [expandedId, setExpandedId] = useState<string | null>('primeiros-passos');

  const visibleTutorials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return TUTORIALS.filter((tutorial) => {
      const matchesCategory = category === 'Todos' || tutorial.category === category;
      const matchesSearch = `${tutorial.title} ${tutorial.summary} ${tutorial.steps.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Tutoriais" />
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, backgroundColor: COLORS.surfaceContainer, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant }}>
          <MaterialIcons name="search" size={21} color={COLORS.onSurfaceVariant} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Buscar tutorial..." placeholderTextColor={COLORS.outline} accessibilityLabel="Buscar tutorial" style={{ flex: 1, height: 42, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }} />
          {search.length > 0 && <Pressable onPress={() => setSearch('')} accessibilityLabel="Limpar busca"><MaterialIcons name="close" size={19} color={COLORS.onSurfaceVariant} /></Pressable>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 8, columnGap: 8, rowGap: 8 }}>
        {CATEGORIES.map((option) => {
          const active = category === option;
          return (
            <Pressable key={option} onPress={() => setCategory(option)} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: active ? COLORS.primaryContainer : COLORS.surfaceContainer, borderWidth: 1, borderColor: active ? COLORS.primaryContainer : COLORS.outlineVariant }}>
              <Text style={{ color: active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13), lineHeight: 18 }}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 28, gap: 10 }}>
        {visibleTutorials.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <MaterialIcons name="search-off" size={36} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>Nenhum tutorial encontrado.</Text>
          </View>
        ) : visibleTutorials.map((tutorial) => {
          const expanded = expandedId === tutorial.id;
          return (
            <View key={tutorial.id} style={{ overflow: 'hidden', borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Pressable onPress={() => setExpandedId(expanded ? null : tutorial.id)} accessibilityRole="button" accessibilityState={{ expanded }} style={{ minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerLowest }}>
                  <MaterialIcons name={tutorial.icon} size={23} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>{tutorial.title}</Text>
                  <Text numberOfLines={2} style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12), lineHeight: 16 }}>{tutorial.summary}</Text>
                </View>
                <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
              </Pressable>
              {expanded && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
                  <View style={{ height: 1, backgroundColor: COLORS.outlineVariant }} />
                  {tutorial.steps.map((step, index) => (
                    <View key={`${tutorial.id}-${index}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHighest }}>
                        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(11) }}>{index + 1}</Text>
                      </View>
                      <Text style={{ flex: 1, color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), lineHeight: 19 }}>{step}</Text>
                    </View>
                  ))}
                  <Pressable onPress={() => router.push(tutorial.route as any)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, borderRadius: 8, backgroundColor: COLORS.primary }}>
                    <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{tutorial.actionLabel}</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={COLORS.onPrimary} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
