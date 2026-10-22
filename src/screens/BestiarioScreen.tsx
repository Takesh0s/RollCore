import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';

type Creature = {
  id: string;
  name: string;
  category: string;
  system: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  description: string;
  hp: string;
  threat: string;
};

const INITIAL_CREATURES: Creature[] = [
  { id: 'goblin', name: 'Goblin', category: 'Humanoides', system: 'D&D 5e', icon: 'sports-kabaddi', color: '#80CBC4', description: 'Pequeno e astuto, costuma atacar em grupo e aproveitar a cobertura.', hp: '7 (2d6)', threat: '1/4' },
  { id: 'pathfinder-2', name: 'Pathfinder 2 Edition', category: 'Humanoides', system: 'Pathfinder 2e', icon: 'person', color: '#EF9A9A', description: 'Uma referência de criatura para encontros do sistema Pathfinder 2e.', hp: '—', threat: '—' },
  { id: 'mind-flayer', name: 'Mind Flayer', category: 'Humanoides', system: 'D&D 5e', icon: 'psychology', color: '#CE93D8', description: 'Aberração telepática que se alimenta de cérebros e domina suas vítimas.', hp: '71 (13d8 + 13)', threat: '7' },
  { id: 'golem', name: 'Golem', category: 'Construtos', system: 'D&D 5e', icon: 'precision-manufacturing', color: '#C5B9A5', description: 'Construto resistente, criado para obedecer às ordens de seu criador.', hp: '178 (17d10 + 85)', threat: '10' },
  { id: 'homunculo', name: 'Homúnculo', category: 'Construtos', system: 'D&D 5e', icon: 'pets', color: '#D7CCC8', description: 'Pequeno servo mágico ligado à vontade de quem o criou.', hp: '5 (2d4)', threat: '0' },
  { id: 'armadura-animada', name: 'Armadura animada', category: 'Construtos', system: 'D&D 5e', icon: 'security', color: '#B0BEC5', description: 'Uma armadura vazia que se move por magia e protege uma área.', hp: '33 (6d8 + 6)', threat: '1' },
  { id: 'dragao-vermelho', name: 'Dragão vermelho', category: 'Dragões', system: 'D&D 5e', icon: 'local-fire-department', color: '#FF7043', description: 'Dragão cromático orgulhoso, territorial e capaz de expelir fogo devastador.', hp: '256 (19d12 + 133)', threat: '17' },
  { id: 'dracolich', name: 'Dracolich', category: 'Dragões', system: 'D&D 5e', icon: 'gpp-bad', color: '#81C784', description: 'Um dragão morto-vivo que preservou sua inteligência e poderes arcanos.', hp: '—', threat: '17' },
];

const CATEGORIES = ['Todos', 'Humanoides', 'Construtos', 'Dragões'];

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 2 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(13) }}>{title}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.outlineVariant }} />
    </View>
  );
}

export default function BestiarioScreen() {
  useAcessibilidade();
  const fontsLoaded = useAppFonts();
  const [creatures, setCreatures] = useState(INITIAL_CREATURES);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Humanoides');
  const [newDescription, setNewDescription] = useState('');

  const grouped = useMemo(() => {
    const filtered = creatures.filter((creature) => {
      const matchesSearch = `${creature.name} ${creature.system} ${creature.category}`.toLowerCase().includes(search.trim().toLowerCase());
      return matchesSearch && (selectedCategory === 'Todos' || creature.category === selectedCategory);
    });
    return CATEGORIES.slice(1)
      .map((category) => ({ category, items: filtered.filter((item) => item.category === category) }))
      .filter((group) => group.items.length > 0);
  }, [creatures, search, selectedCategory]);

  if (!fontsLoaded) return null;

  const addCreature = () => {
    const name = newName.trim();
    if (!name) return;
    setCreatures((previous) => [
      ...previous,
      {
        id: `custom-${Date.now()}`,
        name,
        category: newCategory,
        system: 'Personalizada',
        icon: 'pets',
        color: COLORS.primary,
        description: newDescription.trim() || 'Criatura adicionada ao seu Bestiário.',
        hp: '—',
        threat: '—',
      },
    ]);
    setNewName('');
    setNewDescription('');
    setCreateOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Bestiário" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 6 }}>
        <MaterialIcons name="search" size={22} color={COLORS.onSurfaceVariant} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar criatura..."
          placeholderTextColor={COLORS.outline}
          accessibilityLabel="Buscar criatura"
          style={{ flex: 1, height: 42, color: COLORS.onSurface, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}
        />
        <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="Filtrar por categoria" style={{ padding: 8 }}>
          <MaterialIcons name="filter-list" size={24} color={selectedCategory === 'Todos' ? COLORS.onSurfaceVariant : COLORS.primary} />
        </Pressable>
      </View>

      {selectedCategory !== 'Todos' && (
        <Pressable onPress={() => setSelectedCategory('Todos')} style={{ alignSelf: 'flex-start', marginLeft: 16, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHighest }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{selectedCategory}  × Limpar</Text>
        </Pressable>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {grouped.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <MaterialIcons name="search-off" size={36} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>Nenhuma criatura encontrada.</Text>
          </View>
        ) : grouped.map((group) => (
          <View key={group.category}>
            <SectionTitle title={group.category} />
            {group.items.map((creature) => {
              const expanded = expandedId === creature.id;
              return (
                <View key={creature.id} style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(192,192,192,0.18)' }}>
                  <Pressable
                    onPress={() => setExpandedId(expanded ? null : creature.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name={creature.icon} size={20} color={creature.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(16) }}>{creature.name}</Text>
                      {search.length > 0 ? <Text style={{ color: COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>{creature.system}</Text> : null}
                    </View>
                    <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
                  </Pressable>
                  {expanded && (
                    <View style={{ marginLeft: 44, marginBottom: 10, padding: 12, gap: 8, borderRadius: 10, backgroundColor: COLORS.surfaceContainer }}>
                      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), lineHeight: 19 }}>{creature.description}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>PV: {creature.hp}</Text>
                        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>ND: {creature.threat}</Text>
                        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>{creature.system}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, alignItems: 'center' }}>
        <Pressable onPress={() => setCreateOpen(true)} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 999, backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <MaterialIcons name="add" size={19} color={COLORS.primary} />
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Adicionar Criatura</Text>
        </Pressable>
      </View>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable onPress={() => setFilterOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 24 }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ padding: 20, gap: 12, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20) }}>Filtrar criaturas</Text>
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
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(21) }}>Nova criatura</Text>
              <Pressable onPress={() => setCreateOpen(false)} accessibilityLabel="Fechar formulário"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
            </View>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Nome da criatura" placeholderTextColor={COLORS.outline} style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular' }} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Categoria</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.slice(1).map((category) => (
                <Pressable key={category} onPress={() => setNewCategory(category)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: newCategory === category ? COLORS.primaryContainer : COLORS.surfaceContainerLowest }}>
                  <Text style={{ color: newCategory === category ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{category}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={newDescription} onChangeText={setNewDescription} placeholder="Descrição (opcional)" placeholderTextColor={COLORS.outline} multiline style={{ minHeight: 82, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', textAlignVertical: 'top' }} />
            <Pressable onPress={addCreature} disabled={!newName.trim()} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: newName.trim() ? COLORS.primary : COLORS.surfaceContainerHighest }}>
              <Text style={{ color: newName.trim() ? COLORS.onPrimary : COLORS.outline, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Adicionar ao Bestiário</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
