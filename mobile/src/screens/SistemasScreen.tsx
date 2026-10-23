import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';
import { usePagante } from '../store/eventos';

type SystemCategory = 'Proprietários' | 'Independentes' | 'Autorais';
type GameSystem = {
  id: string;
  name: string;
  category: SystemCategory;
  description: string;
  book: string;
};

const INITIAL_SYSTEMS: GameSystem[] = [
  { id: 'dnd5e', name: 'Dungeon & Dragons 5 Edition', category: 'Proprietários', description: 'Um RPG de fantasia sobre exploração, interpretação e aventuras épicas em mundos imaginários.', book: 'Livro do Jogador · Livro do Mestre · Manual dos Monstros' },
  { id: 'pathfinder2', name: 'Pathfinder 2 Edition', category: 'Proprietários', description: 'RPG de fantasia tática com personagens personalizáveis, encontros estratégicos e um cenário rico.', book: 'Livro Básico · Bestiário' },
  { id: 'ordem', name: 'Ordem Paranormal', category: 'Proprietários', description: 'Investigadores enfrentam mistérios e ameaças sobrenaturais em um mundo próximo do nosso.', book: 'Livro de Regras · Sobrevivendo ao Horror' },
  { id: 'city-of-mist', name: 'City of Mist', category: 'Independentes', description: 'Investigue mistérios de noir com deuses e monstros em uma metrópole inundada pelo Nevoeiro onde lendas ancestrais encarnam em pessoas comuns todos os dias.', book: 'Livro básico · Guia de investigação' },
  { id: 'daggerheart', name: 'DaggerHeart', category: 'Independentes', description: 'Uma aventura cooperativa de fantasia focada em personagens, escolhas dramáticas e histórias compartilhadas.', book: 'Core Rulebook · Character Guide' },
  { id: 'quilombo-zero', name: 'Quilombo Zero', category: 'Independentes', description: 'Um cenário e sistema brasileiro para narrativas de aventura, resistência e ancestralidade.', book: 'Livro básico' },
  { id: 'mojuba', name: 'Mojubá RPG', category: 'Independentes', description: 'RPG brasileiro inspirado por mitos, culturas e tradições afro-brasileiras.', book: 'Livro básico' },
  { id: 'nax', name: 'NAX', category: 'Autorais', description: 'Sistema autoral da comunidade. Expanda para conhecer as regras e materiais disponíveis.', book: 'Material da comunidade' },
];

const CATEGORIES: Array<'Todos' | SystemCategory> = ['Todos', 'Proprietários', 'Independentes', 'Autorais'];

function CategoryDivider({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, marginBottom: 2 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(13) }}>{title}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
    </View>
  );
}

export default function SistemasScreen() {
  useAcessibilidade();
  const fontsLoaded = useAppFonts();
  const pagante = usePagante();
  const [systems, setSystems] = useState(INITIAL_SYSTEMS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('Todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('city-of-mist');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<SystemCategory>('Autorais');
  const [bookSystem, setBookSystem] = useState<GameSystem | null>(null);

  const groups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const filtered = systems.filter((system) => {
      const matchesSearch = `${system.name} ${system.description} ${system.category}`.toLocaleLowerCase('pt-BR').includes(query);
      return matchesSearch && (selectedCategory === 'Todos' || system.category === selectedCategory);
    });
    return (CATEGORIES.slice(1) as SystemCategory[])
      .map((category) => ({ category, systems: filtered.filter((system) => system.category === category) }))
      .filter((group) => group.systems.length > 0);
  }, [search, selectedCategory, systems]);

  if (!fontsLoaded) return null;

  const addSystem = () => {
    const name = newName.trim();
    if (!name || !pagante) return;
    setSystems((current) => [...current, {
      id: `custom-${Date.now()}`,
      name,
      category: newCategory,
      description: newDescription.trim() || 'Sistema adicionado à sua biblioteca.',
      book: 'Material adicionado pela comunidade',
    }]);
    setSelectedCategory('Todos');
    setNewName('');
    setNewDescription('');
    setCreateOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Sistemas" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
        <MaterialIcons name="search" size={22} color={COLORS.onSurfaceVariant} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar sistemas..."
          placeholderTextColor={COLORS.outline}
          accessibilityLabel="Buscar sistemas"
          style={{ flex: 1, height: 42, color: COLORS.onSurface, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}
        />
        <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="Filtrar sistemas" style={{ padding: 8 }}>
          <MaterialIcons name="filter-list" size={24} color={selectedCategory === 'Todos' ? COLORS.onSurfaceVariant : COLORS.primary} />
        </Pressable>
      </View>

      {selectedCategory !== 'Todos' && (
        <Pressable onPress={() => setSelectedCategory('Todos')} style={{ alignSelf: 'flex-start', marginLeft: 16, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHighest }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{selectedCategory}  × Limpar</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <MaterialIcons name="search-off" size={36} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>Nenhum sistema encontrado.</Text>
          </View>
        ) : groups.map((group) => (
          <View key={group.category}>
            <CategoryDivider title={group.category} />
            {group.systems.map((system) => {
              const expanded = expandedId === system.id;
              return (
                <View key={system.id} style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(192,192,192,0.18)' }}>
                  <Pressable onPress={() => setExpandedId(expanded ? null : system.id)} accessibilityRole="button" accessibilityState={{ expanded }} style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 }}>
                    <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>{system.name}</Text>
                    <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={20} color={COLORS.onSurfaceVariant} />
                  </Pressable>
                  {expanded && (
                    <View style={{ paddingHorizontal: 8, paddingBottom: 12, gap: 10 }}>
                      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), lineHeight: 19 }}>{system.description}</Text>
                      <Pressable onPress={() => setBookSystem(system)} style={{ alignSelf: 'center', minHeight: 36, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 999, backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Abrir Livro</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {pagante && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, alignItems: 'center' }}>
          <Pressable onPress={() => setCreateOpen(true)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 999, backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <MaterialIcons name="add" size={19} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Adicionar Sistema</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable onPress={() => setFilterOpen(false)} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ padding: 20, gap: 10, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20), marginBottom: 4 }}>Filtrar sistemas</Text>
            {CATEGORIES.map((category) => (
              <Pressable key={category} onPress={() => { setSelectedCategory(category); setFilterOpen(false); }} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 8, backgroundColor: selectedCategory === category ? COLORS.surfaceContainerHighest : 'transparent' }}>
                <Text style={{ color: selectedCategory === category ? COLORS.primary : COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>{category}</Text>
                {selectedCategory === category ? <MaterialIcons name="check" size={20} color={COLORS.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <View style={{ padding: 20, paddingBottom: 28, gap: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: COLORS.surfaceContainerHigh }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(21) }}>Adicionar sistema</Text>
              <Pressable onPress={() => setCreateOpen(false)} accessibilityLabel="Fechar formulário"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
            </View>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Nome do sistema" placeholderTextColor={COLORS.outline} style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular' }} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Categoria</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(CATEGORIES.slice(1) as SystemCategory[]).map((category) => (
                <Pressable key={category} onPress={() => setNewCategory(category)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: newCategory === category ? COLORS.primaryContainer : COLORS.surfaceContainerLowest }}>
                  <Text style={{ color: newCategory === category ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{category}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={newDescription} onChangeText={setNewDescription} placeholder="Descrição (opcional)" placeholderTextColor={COLORS.outline} multiline style={{ minHeight: 82, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', textAlignVertical: 'top' }} />
            <Pressable onPress={addSystem} disabled={!newName.trim()} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: newName.trim() ? COLORS.primary : COLORS.surfaceContainerHighest }}>
              <Text style={{ color: newName.trim() ? COLORS.onPrimary : COLORS.outline, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Salvar Sistema</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={bookSystem !== null} transparent animationType="fade" onRequestClose={() => setBookSystem(null)}>
        <Pressable onPress={() => setBookSystem(null)} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ padding: 20, gap: 12, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(21) }}>{bookSystem?.name}</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), lineHeight: 20 }}>{bookSystem?.description}</Text>
            <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Livros e materiais</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>{bookSystem?.book}</Text>
            <Pressable onPress={() => setBookSystem(null)} style={{ minHeight: 44, marginTop: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: COLORS.primary }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
