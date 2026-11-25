import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { SpellDetail } from '../components/characters/SpellDetail';
import { SpellSearchModal } from '../components/characters/SpellSearchModal';
import { InventoryTab } from '../components/characters/InventoryTab';
import { StateBlock, inputStyle } from '../components/Controls';
import { BTN, FAIL, PillBtn, RuleTitle } from '../components/tables/parts';
import { imageSrc } from '../lib/mapImage';
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

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const SERIF = 'SourceSerif4_700Bold';

type Tab = 'info' | 'inventory' | 'spells';

/** `.section-title` com botão à direita (cabeçalho de seção das magias). */
function Section({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, marginBottom: 10 }}>
      <Text accessibilityRole="header" style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(14) }}>{title}</Text>
      {right}
    </View>
  );
}

/** `.attr-box`: cartão com rótulo, valor grande e complemento (modificador / unidade). */
function StatBox({ label, value, sub, wide }: { label: string; value: string | number; sub?: string; wide?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
      style={{ width: wide ? '100%' : '48%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SERIF, fontSize: appFontSize(9), letterSpacing: 2, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(26), marginTop: 6, marginBottom: 3 }}>{value}</Text>
      {sub ? <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(13) }}>{sub}</Text> : null}
    </View>
  );
}

/** Pena do "Editar ficha" (`IconFeather` do web). */
function Feather({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 4c-8 0-13 4-13 11l-2 5 5-2c7 0 10-5 10-14z" />
      <Line x1="8" y1="16" x2="15" y2="9" />
    </Svg>
  );
}

function Pip({ available, onPress, label }: { available: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={6}
      style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: COLORS.primary, backgroundColor: available ? COLORS.primary : 'transparent' }} />
  );
}

const ghost = (label: string, onPress: () => void) => <PillBtn label={label} onPress={onPress} kind="outline" />;

/** Botões de PV (`.btn-danger`, `.btn-heal`, `.btn-temp`, `.btn-ghost`): contorno colorido, Fugaz One. */
function HpBtn({ label, color, border, bg, onPress, accessibilityLabel }: { label: string; color: string; border: string; bg: string; onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={{ flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Text style={{ color, fontFamily: BTN, fontSize: appFontSize(13) }}>{label}</Text>
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

  const [tab, setTab] = useState<Tab>(tabParam === 'inventory' ? 'inventory' : 'info');
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
  const hpColor = hpPct > 60 ? COLORS.primary : hpPct > 30 ? '#e8a020' : FAIL;
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

  const tabs: { id: Tab | 'notes'; label: string }[] = [
    { id: 'info', label: 'Informações' },
    { id: 'inventory', label: 'Inventário' },
    ...(casterType !== 'none' ? [{ id: 'spells' as Tab, label: 'Grimório' }] : []),
    { id: 'notes', label: 'Anotações' },
  ];
  const portrait = imageSrc(c.avatar_url);
  const sectionPad = { paddingHorizontal: 14 } as const;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Ficha" onBack={back} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Nome, classe · raça · nível e a pena de editar (.sheet-title-row) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginHorizontal: 14 }}>
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center', paddingLeft: 34 }}>
            <Text numberOfLines={1} style={{ color: COLORS.onSurfaceVariant, fontFamily: SERIF, fontSize: appFontSize(20) }}>{c.name}</Text>
            <Text style={{ color: COLORS.outline, fontFamily: BODY, fontSize: appFontSize(12), textAlign: 'center' }}>
              {c.class}{c.subclass ? ` · ${c.subclass}` : ''} · {c.race} · Nível {c.level}
            </Text>
          </View>
          <Pressable onPress={() => router.push(`/criar-personagem?id=${c.id}` as any)} accessibilityRole="button" accessibilityLabel="Editar ficha"
            style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Feather color={COLORS.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Pontos de vida (.hp-tracker) */}
        <View style={{ marginTop: 10, marginBottom: 8, marginHorizontal: 14, padding: 16, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.16)', borderWidth: 1, borderColor: COLORS.ruleFaint }}>
          <View accessible accessibilityLabel={`Pontos de vida: ${c.hp} de ${maxHp}${c.temp_hp > 0 ? `, mais ${c.temp_hp} temporários` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            {portrait && <Image source={{ uri: portrait }} style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(112,181,150,0.55)' }} />}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: hpColor, fontFamily: SERIF, fontSize: appFontSize(52) }}>{c.hp}</Text>
              <Text style={{ color: COLORS.outline, fontFamily: SERIF, fontSize: appFontSize(26) }}>/</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SERIF, fontSize: appFontSize(24) }}>{maxHp}</Text>
              {c.temp_hp > 0 && (
                <Text style={{ marginLeft: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, overflow: 'hidden', color: COLORS.sapphire, borderWidth: 1, borderColor: COLORS.sapphire, fontFamily: SERIF, fontSize: appFontSize(13) }}>+{c.temp_hp} temp</Text>
              )}
            </View>
          </View>
          <View accessibilityElementsHidden style={{ height: 8, borderRadius: 4, marginBottom: 16, backgroundColor: COLORS.fill }}>
            <View style={{ width: `${hpPct}%`, height: '100%', borderRadius: 4, backgroundColor: hpColor, shadowColor: hpColor, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
            {c.temp_hp > 0 && <View style={{ position: 'absolute', top: -2, right: 0, height: 12, borderRadius: 4, width: `${Math.min(100, (c.temp_hp / Math.max(1, maxHp)) * 100)}%`, backgroundColor: COLORS.sapphire, opacity: 0.4 }} />}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <TextInput value={hpDelta} onChangeText={(t) => setHpDelta(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Valor"
              placeholderTextColor={COLORS.placeholder} accessibilityLabel="Valor de dano, cura ou HP temporário"
              style={[inputStyle(), { width: '100%', textAlign: 'center', fontFamily: SERIF, fontSize: appFontSize(16), paddingVertical: 9 }]} />
            <HpBtn label="− Dano" color={FAIL} border={FAIL} bg="rgba(255,138,128,0.06)" onPress={applyDamage} accessibilityLabel="Aplicar dano" />
            <HpBtn label="+ Cura" color={COLORS.primary} border="rgba(112,181,150,0.55)" bg="rgba(112,181,150,0.08)" onPress={applyHeal} accessibilityLabel="Aplicar cura" />
            <HpBtn label="⚡ Temp" color={COLORS.sapphire} border={COLORS.sapphire} bg="rgba(143,184,222,0.08)" onPress={addTemp} accessibilityLabel="Aplicar HP temporário" />
            <HpBtn label="↺" color={COLORS.onSurfaceVariant} border="rgba(192,192,192,0.5)" bg="rgba(255,255,255,0.08)" onPress={resetHp} accessibilityLabel="Restaurar HP máximo" />
          </View>
        </View>

        {/* Seções da ficha (.sheet-chips) */}
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, marginHorizontal: 14 }}>
          {tabs.map((t) => {
            const on = t.id === tab;
            const soon = t.id === 'notes';
            return (
              <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on, disabled: soon }} disabled={soon}
                accessibilityLabel={soon ? `${t.label}, em breve` : t.label}
                onPress={() => setTab(t.id as Tab)}
                style={{ paddingHorizontal: 15, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: on ? COLORS.sapphire : COLORS.outlineVariant,
                  backgroundColor: on ? COLORS.sapphire : 'transparent', opacity: soon ? 0.45 : 1 }}>
                <Text style={{ color: on ? '#10202E' : COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(12) }}>
                  {t.label}{t.id === 'spells' && knownSpells.length > 0 ? ` (${knownSpells.length})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[sectionPad, { gap: 4 }]}>
        {tab === 'info' && (
          <>
            <RuleTitle>Atributos</RuleTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              {ATTR_KEYS.map((k) => <StatBox key={k} label={ATTR_LABELS[k]} value={c.attributes[k]} sub={formatMod(calcMod(c.attributes[k]))} />)}
            </View>
            <RuleTitle>Combate</RuleTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              <StatBox label="Proficiência" value={`+${profBonus(c.level)}`} sub="bônus" />
              <StatBox label="HP Máx." value={maxHp} sub="pontos" />
              <StatBox label="CA" value={c.ac} sub="armadura" />
            </View>
            <RuleTitle>Perícias</RuleTitle>
            <View style={{ gap: 4 }}>
              {SKILLS.map((skill) => {
                const bonus = getSkillBonus(skill.name, c.attributes, c.level);
                return (
                  <View key={skill.name} accessible accessibilityLabel={`${skill.name}, ${ATTR_LABELS[skill.attr]}, bônus ${formatMod(bonus)}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                    <Text numberOfLines={1} style={{ width: 32, color: COLORS.outline, fontFamily: SERIF, fontSize: appFontSize(8), letterSpacing: 1.5 }}>{ATTR_LABELS[skill.attr]}</Text>
                    <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(13) }}>{skill.name}</Text>
                    <Text style={{ minWidth: 28, textAlign: 'right', color: bonus >= 0 ? COLORS.primary : FAIL, fontFamily: SERIF, fontSize: appFontSize(13) }}>{formatMod(bonus)}</Text>
                  </View>
                );
              })}
            </View>
            {raceTraits.length > 0 && (
              <>
                <RuleTitle>{`Traços Raciais — ${c.race}`}</RuleTitle>
                <View style={{ gap: 10 }}>
                  {raceTraits.map((t) => {
                    const tone = t.type === 'choice' ? COLORS.sapphire : COLORS.primary;
                    return (
                      <View key={t.name} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant, borderLeftWidth: 3, borderLeftColor: tone }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                          <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(13) }}>{t.name}</Text>
                          <Text style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, overflow: 'hidden', color: tone, borderWidth: 1, borderColor: tone, fontFamily: SERIF, fontSize: appFontSize(8), letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            {t.type === 'stat_bonus' ? 'Bônus' : t.type === 'choice' ? 'Escolha' : 'Passivo'}
                          </Text>
                        </View>
                        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13), lineHeight: 21 }}>{t.description}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {tab === 'inventory' && <InventoryTab char={c} />}

        {tab === 'spells' && (
          <>
            {spellDC !== null && (
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 10 }}>
                <StatBox label="CD das Magias" value={spellDC} />
                <StatBox label="Ataque Mágico" value={formatMod(spellAtk ?? 0)} />
              </View>
            )}

            {(casterType === 'full' || casterType === 'half') && slots && maxSlots && (
              <>
                <Section title="Espaços de Magia" right={ghost('↺ Descanso Longo', restoreAllSlots)} />
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
                <Section title="Magia de Pacto" right={ghost('↺ Descanso Curto', restoreWarlock)} />
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

            <Section title={`Magias Conhecidas${knownSpells.length > 0 ? ` (${knownSpells.length})` : ''}`}
              right={
                <PillBtn label="+ Adicionar" kind="primary" onPress={() => setShowSearch(true)} accessibilityLabel="Adicionar magia" />
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

        </View>
      </ScrollView>

      {showSearch && (
        <SpellSearchModal characterId={c.id} characterClass={c.class} knownSpellIds={new Set(knownSpells.map((s) => s.id))}
          onAdded={(spell) => setKnownSpells((prev) => [...prev, spell])} onClose={() => setShowSearch(false)} />
      )}
    </SafeAreaView>
  );
}
