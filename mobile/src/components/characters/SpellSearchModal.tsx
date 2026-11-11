import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { addSpellToCharacter, fetchSpells } from '../../lib/characters';
import { mensagemDeErro } from '../../services/api';
import { showToast } from '../../store/useToast';
import { LEVEL_LABELS, SCHOOL_COLORS, type Spell } from '../../types';
import { SpellDetail } from './SpellDetail';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const LEVELS: (number | null)[] = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Compêndio de magias (SRD) com busca, filtro de nível e botão de adicionar à ficha. */
export function SpellSearchModal({ characterId, characterClass, knownSpellIds, onAdded, onClose }: {
  characterId: string;
  characterClass: string;
  knownSpellIds: Set<string>;
  onAdded: (spell: Spell) => void;
  onClose: () => void;
}) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // busca com um pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      fetchSpells({ className: characterClass, level, search })
        .then((r) => { if (alive) { setSpells(r); setFailed(false); } })
        .catch(() => { if (alive) { setSpells([]); setFailed(true); } })
        .finally(() => { if (alive) setLoading(false); });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [characterClass, level, search]);

  async function add(spell: Spell) {
    if (knownSpellIds.has(spell.id)) { showToast('Personagem já conhece essa magia.', 'error'); return; }
    setAdding(spell.id);
    try {
      await addSpellToCharacter(characterId, spell.id);
      onAdded(spell);
      showToast(`${spell.name} adicionada!`, 'success');
      setExpanded(null);
    } catch (e) {
      showToast(mensagemDeErro(e), 'error');
    } finally {
      setAdding(null);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(21) }}>Compêndio de Magias</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{characterClass} · {spells.length} magias encontradas</Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Fechar compêndio" style={{ padding: 6 }}><MaterialIcons name="close" size={26} color={COLORS.onSurface} /></Pressable>
          </View>
          <TextInput value={search} onChangeText={setSearch} placeholder="Buscar magia…" placeholderTextColor={COLORS.placeholder}
            style={inputStyle()} returnKeyType="search" autoCapitalize="none" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LEVELS.map((lv) => {
              const on = lv === level;
              return (
                <Pressable key={lv ?? 'all'} onPress={() => setLevel(on ? null : lv)} accessibilityState={{ selected: on }}
                  style={{ paddingHorizontal: 14, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: on ? COLORS.primary : 'transparent', borderWidth: 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant }}>
                  <Text style={{ color: on ? COLORS.onPrimary : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(13) }}>
                    {lv === null ? 'Todos' : lv === 0 ? 'Truque' : `${LEVEL_LABELS[lv]}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
          {loading && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, textAlign: 'center', paddingVertical: 24 }}>Carregando…</Text>}
          {!loading && failed && <Text style={{ color: '#e57373', fontFamily: BODY, textAlign: 'center', paddingVertical: 24 }}>Não foi possível carregar o compêndio. Tente de novo.</Text>}
          {!loading && !failed && spells.length === 0 && (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, textAlign: 'center', paddingVertical: 24 }}>Nenhuma magia encontrada para esses filtros.</Text>
          )}
          {!loading && spells.map((spell) => {
            const open = expanded === spell.id;
            const known = knownSpellIds.has(spell.id);
            const color = spell.level === 0 ? '#888' : SCHOOL_COLORS[spell.school] ?? '#888';
            return (
              <View key={spell.id} style={{ gap: 8 }}>
                <Pressable onPress={() => setExpanded(open ? null : spell.id)} accessibilityRole="button" accessibilityState={{ expanded: open }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: open ? COLORS.primary : COLORS.outlineVariant }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: color }}>
                    <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(13) }}>{spell.level === 0 ? '✦' : spell.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{spell.name}</Text>
                    <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
                      {spell.school}{spell.concentration ? ' · ◎' : ''}{spell.damageDice ? ` · ${spell.damageDice} ${spell.damageType ?? ''}` : ''}
                    </Text>
                  </View>
                  {known && <MaterialIcons name="check-circle" size={20} color={COLORS.primary} />}
                  <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
                </Pressable>
                {open && (
                  <SpellDetail spell={spell}
                    action={known ? undefined : { label: 'Adicionar ao personagem', onPress: () => add(spell), loading: adding === spell.id }} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
