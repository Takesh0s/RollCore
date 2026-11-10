import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { SpellDetail } from '../components/characters/SpellDetail';
import { SpellSearchModal } from '../components/characters/SpellSearchModal';
import { InventoryTab } from '../components/characters/InventoryTab';
import { Avatar, StateBlock, inputStyle } from '../components/Controls';
import { COLORS, Header, appFontSize } from '../design/shared';
import {
  ATTR_KEYS, ATTR_LABELS, SKILLS, calcMod, formatMod, getMaxSpellSlots, getRaceTraits, getSkillBonus,
  getSpellAttackBonus, getSpellSaveDC, profBonus, resolveCasterType,
} from '../lib/engine';
import { fetchCharacterSpells, removeSpellFromCharacter } from '../lib/characters';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCharacters } from '../store/useCharacters';
import { showToast } from '../store/useToast';
import { LEVEL_LABELS, SCHOOL_COLORS, type Character, type Spell, type SpellSlots } from '../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

type Tab = 'combat' | 'skills' | 'inventory' | 'spells' | 'traits';

function Section({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{title}</Text>
      {right}
    </View>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}, ${sub}`}
      style={{ width: '30%', alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 2, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(11), textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(26) }}>{value}</Text>
      <Text style={{ color: COLORS.primary, fontFamily: BODY, fontSize: appFontSize(12) }}>{sub}</Text>
    </View>
  );
}

function Pip({ available, onPress, label }: { available: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={6}
      style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: available ? COLORS.primary : 'transparent' }} />
  );
}

function ghost(label: string, onPress: () => void) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 10, minHeight: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(12) }}>{label}</Text>
    </Pressable>
  );
}

/** Ficha do personagem (mesma do web): PV com dano/cura, atributos, perícias, magias e traços raciais. */
export default function FichaScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { id, tab: tabParam } = useLocalSearchParams<{ id?: string; tab?: string }>();
  const { characters, loaded, load, update, patchLocal } = useCharacters();
  const char = characters.find((c) => c.id === id);

  const [tab, setTab] = useState<Tab>(tabParam === 'inventory' ? 'inventory' : 'combat');
  const [hpDelta, setHpDelta] = useState('');
  const [knownSpells, setKnownSpells] = useState<Spell[]>([]);
  const [spellsLoaded, setSpellsLoaded] = useState(false);
  const [loadingSpells, setLoadingSpells] = useState(false);
  const [spellsFailed, setSpellsFailed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  // Abrindo direto na ficha (link ou volta ao app), a lista ainda pode não ter sido carregada
  useEffect(() => { if (!loaded) void load(); }, [loaded, load]);

  const casterType = char ? resolveCasterType(char.class, char.subclass) : 'none';

  function loadSpells() {
    if (!char) return;
    setLoadingSpells(true); setSpellsFailed(false);
    fetchCharacterSpells(char.id)
      .then((r) => { setKnownSpells(r); setSpellsLoaded(true); })
      .catch(() => setSpellsFailed(true))
      .finally(() => setLoadingSpells(false));
  }
  useEffect(() => {
    if (tab === 'spells' && char && casterType !== 'none' && !spellsLoaded && !loadingSpells && !spellsFailed) loadSpells();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, char?.id, casterType, spellsLoaded]);

  const raceTraits = useMemo(() => (char ? getRaceTraits(char.race) : []), [char?.race]);
  const spellsByLevel = useMemo(() => knownSpells.reduce<Record<number, Spell[]>>((acc, s) => {
    (acc[s.level] ??= []).push(s);
    return acc;
  }, {}), [knownSpells]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/skills'));

  if (!char) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Ficha" onBack={back} />
        <StateBlock icon={loaded ? 'search-off' : 'hourglass-empty'} title={loaded ? 'Ficha não encontrada' : 'Carregando a ficha…'}
          text={loaded ? 'Ela pode ter sido excluída em outro aparelho.' : undefined}
          actionLabel={loaded ? 'Voltar às fichas' : undefined} onAction={back} />
      </SafeAreaView>
    );
  }

  const c: Character = char;
  const maxHp = c.max_hp ?? c.hp;
  const hpPct = Math.max(0, Math.min(100, (c.hp / Math.max(1, maxHp)) * 100));
  const hpColor = hpPct > 60 ? COLORS.primary : hpPct > 30 ? '#e8a020' : '#e57373';
  const maxSlots = getMaxSpellSlots(c.class, c.level, c.subclass);
  const spellDC = getSpellSaveDC(c.class, c.level, c.attributes, c.subclass);
  const spellAtk = getSpellAttackBonus(c.class, c.level, c.attributes, c.subclass);
  const slots = c.spell_slots ?? null;
  const wSlots = c.warlock_slots ?? null;

  async function persist(patch: Partial<Character>) {
    const { id: _id, ...rest } = c;
    const res = await update(c.id, { ...rest, ...patch });
    if (!res.ok) showToast(`Não foi possível salvar: ${res.error}`, 'error');
  }

  const amount = () => { const n = parseInt(hpDelta, 10); return isNaN(n) || n <= 0 ? null : n; };

  function applyDamage() {
    const n = amount(); if (n === null) return;
    let rest = n, temp = c.temp_hp;
    if (temp > 0) { const abs = Math.min(temp, rest); temp -= abs; rest -= abs; }
    const hp = Math.max(0, c.hp - rest);
    setHpDelta(''); void persist({ hp, temp_hp: temp });
    showToast(`${n} de dano aplicado${c.temp_hp > 0 && temp < c.temp_hp ? ' (HP temporário absorveu parte)' : ''}`);
  }
  function applyHeal() {
    const n = amount(); if (n === null) return;
    setHpDelta(''); void persist({ hp: Math.min(maxHp, c.hp + n) });
    showToast(`${n} HP recuperado`, 'success');
  }
  function addTemp() {
    const n = amount(); if (n === null) return;
    const temp = Math.max(c.temp_hp, n);
    setHpDelta(''); void persist({ temp_hp: temp });
    showToast(`HP temporário: ${temp}`, 'success');
  }
  function resetHp() { void persist({ hp: maxHp, temp_hp: 0 }); showToast('HP restaurado ao máximo', 'success'); }

  function toggleSlot(level: number, index: number, current: number) {
    if (!slots || !maxSlots) return;
    const k = level as keyof SpellSlots;
    const next = { ...slots, [k]: index < current ? slots[k] - 1 : Math.min(maxSlots[k], slots[k] + 1) };
    patchLocal(c.id, { spell_slots: next });
    if (index < current) showToast(`Espaço de ${level}° nível gasto`);
  }
  function restoreAllSlots() { if (maxSlots) { patchLocal(c.id, { spell_slots: maxSlots }); showToast('Espaços recuperados (Descanso Longo)', 'success'); } }
  function toggleWarlock(index: number) {
    if (!wSlots) return;
    if (index >= wSlots.used) { patchLocal(c.id, { warlock_slots: { ...wSlots, used: wSlots.used + 1 } }); showToast('Espaço de Pacto gasto'); }
    else restoreWarlock();
  }
  function restoreWarlock() { if (wSlots) { patchLocal(c.id, { warlock_slots: { ...wSlots, used: 0 } }); showToast('Espaços de Pacto recuperados (Descanso Curto)', 'success'); } }

  async function removeSpell(spell: Spell) {
    setRemoving(spell.id);
    try {
      await removeSpellFromCharacter(c.id, spell.id);
      setKnownSpells((prev) => prev.filter((s) => s.id !== spell.id));
      setExpanded(null);
      showToast(`${spell.name} removida.`);
    } catch {
      showToast('Erro ao remover magia.', 'error');
    } finally {
      setRemoving(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'combat', label: 'Combate' },
    { id: 'skills', label: 'Perícias' },
    { id: 'inventory', label: 'Inventário' },
    ...(casterType !== 'none' ? [{ id: 'spells' as Tab, label: 'Magias' }] : []),
    ...(raceTraits.length > 0 ? [{ id: 'traits' as Tab, label: 'Traços' }] : []),
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Ficha" onBack={back} rightIcon="edit" onRightPress={() => router.push(`/criar-personagem?id=${c.id}` as any)} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar uri={c.avatar_url} name={c.name} size={72} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(24) }}>{c.name}</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>
              {c.class}{c.subclass ? ` · ${c.subclass}` : ''} · {c.race} · Nível {c.level}
            </Text>
          </View>
        </View>

        {/* Pontos de vida */}
        <View style={{ gap: 10, padding: 14, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <View accessible accessibilityLabel={`Pontos de vida: ${c.hp} de ${maxHp}${c.temp_hp > 0 ? `, mais ${c.temp_hp} temporários` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ color: hpColor, fontFamily: SERIF, fontSize: appFontSize(40) }}>{c.hp}</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(22) }}>/ {maxHp}</Text>
            {c.temp_hp > 0 && <Text style={{ color: '#64b5f6', fontFamily: BOLD, fontSize: appFontSize(14), marginLeft: 6 }}>+{c.temp_hp} temp</Text>}
          </View>
          <View accessibilityElementsHidden style={{ height: 10, borderRadius: 5, backgroundColor: COLORS.surfaceContainerLowest, overflow: 'hidden' }}>
            <View style={{ width: `${hpPct}%`, height: '100%', backgroundColor: hpColor }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={hpDelta} onChangeText={(t) => setHpDelta(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Valor"
              placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel="Valor de dano, cura ou HP temporário" style={[inputStyle(), { width: 84, textAlign: 'center' }]} />
            {([['− Dano', '#c0392b', applyDamage], ['+ Cura', '#2e8b57', applyHeal], ['⚡ Temp', '#2f6fa8', addTemp]] as const).map(([label, bg, fn]) => (
              <Pressable key={label} onPress={fn} accessibilityLabel={label.replace('−', 'Aplicar').replace('+', 'Aplicar').replace('⚡', 'Aplicar HP')}
                style={{ flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
                <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(13) }}>{label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={resetHp} accessibilityLabel="Restaurar HP máximo" style={{ width: 48, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <MaterialIcons name="restore" size={22} color={COLORS.onSurface} />
            </Pressable>
          </View>
        </View>

        {/* Abas */}
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map((t) => {
            const on = t.id === tab;
            return (
              <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(t.id)}
                style={{ paddingHorizontal: 16, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? COLORS.primary : 'transparent', borderWidth: 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant }}>
                <Text style={{ color: on ? COLORS.onPrimary : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>
                  {t.label}{t.id === 'spells' && knownSpells.length > 0 ? ` (${knownSpells.length})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'combat' && (
          <>
            <Section title="Atributos" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
              {ATTR_KEYS.map((k) => <StatBox key={k} label={ATTR_LABELS[k]} value={c.attributes[k]} sub={formatMod(calcMod(c.attributes[k]))} />)}
            </View>
            <Section title="Combate" />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
              <StatBox label="Proficiência" value={`+${profBonus(c.level)}`} sub="bônus" />
              <StatBox label="HP máx." value={maxHp} sub="pontos" />
              <StatBox label="CA" value={c.ac} sub="armadura" />
            </View>
          </>
        )}

        {tab === 'skills' && (
          <>
            <Section title="Perícias" />
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              {SKILLS.map((skill, i) => {
                const bonus = getSkillBonus(skill.name, c.attributes, c.level);
                return (
                  <View key={skill.name} accessible accessibilityLabel={`${skill.name}, ${ATTR_LABELS[skill.attr]}, bônus ${formatMod(bonus)}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.surfaceContainerHigh,
                      borderTopWidth: i === 0 ? 0 : 1, borderTopColor: COLORS.outlineVariant }}>
                    <Text style={{ width: 36, color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(11) }}>{ATTR_LABELS[skill.attr]}</Text>
                    <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>{skill.name}</Text>
                    <Text style={{ color: bonus >= 0 ? COLORS.primary : '#e57373', fontFamily: BOLD, fontSize: appFontSize(15) }}>{formatMod(bonus)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {tab === 'inventory' && <InventoryTab char={c} />}

        {tab === 'spells' && (
          <>
            {spellDC !== null && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><StatBoxWide label="CD das magias" value={spellDC} /></View>
                <View style={{ flex: 1 }}><StatBoxWide label="Ataque mágico" value={formatMod(spellAtk ?? 0)} /></View>
              </View>
            )}

            {(casterType === 'full' || casterType === 'half') && slots && maxSlots && (
              <>
                <Section title="Espaços de magia" right={ghost('↺ Descanso longo', restoreAllSlots)} />
                <View style={{ gap: 10 }}>
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((lvl) => {
                    const max = maxSlots[lvl];
                    if (max === 0) return null;
                    const cur = slots[lvl];
                    return (
                      <View key={lvl} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={{ width: 64, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>{lvl}° nível</Text>
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {Array.from({ length: max }).map((_, j) => (
                            <Pip key={j} available={j < cur} onPress={() => toggleSlot(lvl, j, cur)} label={j < cur ? `Gastar espaço de ${lvl}° nível` : `Recuperar espaço de ${lvl}° nível`} />
                          ))}
                        </View>
                        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{cur}/{max}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {casterType === 'warlock' && wSlots && (
              <>
                <Section title="Magia de pacto" right={ghost('↺ Descanso curto', restoreWarlock)} />
                <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                  <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>
                    Nível do espaço: <Text style={{ fontFamily: BOLD }}>{wSlots.level}°</Text> — recupera em descanso curto ou longo
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from({ length: wSlots.total }).map((_, j) => (
                      <Pip key={j} available={j >= wSlots.used} onPress={() => toggleWarlock(j)} label={j >= wSlots.used ? 'Gastar espaço de pacto' : 'Recuperar espaços de pacto'} />
                    ))}
                  </View>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>{wSlots.total - wSlots.used} / {wSlots.total} espaços disponíveis</Text>
                </View>
              </>
            )}

            <Section title={`Magias conhecidas${knownSpells.length > 0 ? ` (${knownSpells.length})` : ''}`}
              right={
                <Pressable onPress={() => setShowSearch(true)} accessibilityLabel="Adicionar magia"
                  style={{ paddingHorizontal: 14, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
                  <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(13) }}>+ Adicionar</Text>
                </Pressable>
              } />
            {loadingSpells && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, textAlign: 'center', paddingVertical: 16 }}>Carregando magias…</Text>}
            {spellsFailed && !loadingSpells && <StateBlock icon="cloud-off" title="Não foi possível carregar as magias" actionLabel="Tentar de novo" onAction={() => { setSpellsFailed(false); loadSpells(); }} />}
            {spellsLoaded && !loadingSpells && knownSpells.length === 0 && (
              <StateBlock icon="auto-stories" title="Nenhuma magia adicionada ainda" actionLabel="Navegar no compêndio" onAction={() => setShowSearch(true)} />
            )}
            {Object.entries(spellsByLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([lvlStr, list]) => {
              const lvl = Number(lvlStr);
              return (
                <View key={lvl} style={{ gap: 8 }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(13), textTransform: 'uppercase', marginTop: 6 }}>
                    {lvl === 0 ? 'Truques' : `${LEVEL_LABELS[lvl]} nível`} · {list.length}
                  </Text>
                  {list.map((spell) => {
                    const open = expanded === spell.id;
                    return (
                      <View key={spell.id} style={{ gap: 8 }}>
                        <Pressable onPress={() => setExpanded(open ? null : spell.id)} accessibilityRole="button" accessibilityState={{ expanded: open }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: open ? COLORS.primary : COLORS.outlineVariant }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: lvl === 0 ? '#888' : SCHOOL_COLORS[spell.school] ?? '#888' }}>
                            <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(13) }}>{lvl === 0 ? '✦' : lvl}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{spell.name}</Text>
                            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
                              {spell.school}{spell.concentration ? ' · ◎' : ''}{spell.damageDice ? ` · ${spell.damageDice} ${spell.damageType ?? ''}` : ''}
                            </Text>
                          </View>
                          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
                        </Pressable>
                        {open && <SpellDetail spell={spell} action={{ label: 'Remover do personagem', danger: true, loading: removing === spell.id, onPress: () => removeSpell(spell) }} />}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {tab === 'traits' && (
          <>
            <Section title={`Traços raciais — ${c.race}`} />
            <View style={{ gap: 10 }}>
              {raceTraits.map((t) => (
                <View key={t.name} style={{ gap: 6, padding: 14, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{t.name}</Text>
                    <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(11), textTransform: 'uppercase' }}>
                      {t.type === 'stat_bonus' ? 'Bônus' : t.type === 'choice' ? 'Escolha' : 'Passivo'}
                    </Text>
                  </View>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{t.description}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {showSearch && (
        <SpellSearchModal characterId={c.id} characterClass={c.class} knownSpellIds={new Set(knownSpells.map((s) => s.id))}
          onAdded={(spell) => setKnownSpells((prev) => [...prev, spell])} onClose={() => setShowSearch(false)} />
      )}
    </SafeAreaView>
  );
}

function StatBoxWide({ label, value }: { label: string; value: string | number }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`}
      style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 2, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(11), textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(26) }}>{value}</Text>
    </View>
  );
}
