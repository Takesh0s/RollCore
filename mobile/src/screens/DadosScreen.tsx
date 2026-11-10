import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { ShortcutsSection } from '../components/dice/ShortcutsSection';
import { Chip, inputStyle } from '../components/Controls';
import { COLORS, appFontSize } from '../design/shared';
import { FORMULA_REGEX, VALID_SIDES, validateFormula } from '../lib/dice';
import { useAcessibilidade } from '../store/acessibilidade';
import { carregarMesas, useMesas } from '../store/mesas';
import { useCharacters } from '../store/useCharacters';
import { useDice } from '../store/useDice';
import { showToast } from '../store/useToast';
import type { DiceMode, HistoryEntry } from '../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const MODES: { id: DiceMode; label: string }[] = [
  { id: 'normal', label: 'Normal' }, { id: 'advantage', label: 'Vantagem' }, { id: 'disadvantage', label: 'Desvantagem' },
];
const HISTORY_PREVIEW = 8;

/** "1d20 + 5" → "1d20+5" (o servidor só aceita a fórmula sem espaços). */
const normalize = (f: string) => f.replace(/\s+/g, '').toLowerCase();
/** "1d20+5" → "1d20" */
const baseOf = (f?: string) => (f ?? '').replace(/[+-]\d+$/, '');

function critOf(e: HistoryEntry): 'crit' | 'fail' | null {
  const r = e.result;
  if (r.sides !== 20 || r.rolls.length !== 1) return null;
  return r.rolls[0] === 20 ? 'crit' : r.rolls[0] === 1 ? 'fail' : null;
}

/** "hoje 00:40" para hoje; "30/04 23:33" para os outros dias. */
function whenOf(ts: number): string {
  const d = new Date(ts), now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return d.toDateString() === now.toDateString() ? `hoje ${hm}` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm}`;
}

/** "15 + 5", "9 − 2" ou "1 + 6 + 6". */
function breakdownOf(e: HistoryEntry): string {
  const { rolls, mod } = e.result;
  let t = rolls.join(' + ');
  if (mod > 0) t += ` + ${mod}`;
  if (mod < 0) t += ` − ${Math.abs(mod)}`;
  return t;
}

function Badge({ kind }: { kind: 'crit' | 'fail' }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: kind === 'crit' ? '#2e8b57' : '#c0392b' }}>
      <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(11) }}>{kind === 'crit' ? 'CRÍTICO' : 'FALHA'}</Text>
    </View>
  );
}

/** Tela de Dados (mesma do web): dados, atalhos, rolador, última rolagem e histórico. */
export default function DadosScreen() {
  useAcessibilidade();
  const { characters, loaded, load } = useCharacters();
  const { history, shortcuts, loadHistory, loadShortcuts, roll, addShortcut, removeShortcut } = useDice();
  const mesas = useMesas();

  const [formula, setFormula] = useState('1d20');
  const [mode, setMode] = useState<DiceMode>('normal');
  const [tableId, setTableId] = useState('');
  const [rolling, setRolling] = useState(false);
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    void loadHistory(); void loadShortcuts(); void carregarMesas();
    if (!loaded) void load();
  }, [loadHistory, loadShortcuts, loaded, load]);

  const clean = normalize(formula);
  const valid = validateFormula(clean);
  const sides = valid ? Number(clean.match(FORMULA_REGEX)![2]) : null;
  const last = history[0];
  const lastCrit = last ? critOf(last) : null;

  const tableNames = useMemo(() => Array.from(new Set(history.map((h) => h.tableName).filter((n): n is string => !!n))).slice(0, 4), [history]);
  const shown = history.filter((h) => !filter || h.tableName === filter);
  const visible = showAll ? shown : shown.slice(0, HISTORY_PREVIEW);

  // O número da última rolagem "salta" a cada nova rolagem
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!last) return;
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [last?.timestamp, last?.result.total, pop]);

  /** Troca o tipo de dado mantendo quantidade e bônus: 2d6+3 → 2d20+3. */
  function pickSides(s: number) {
    const m = valid ? clean.match(FORMULA_REGEX)! : null;
    setFormula(`${m ? m[1] : 1}d${s}${m?.[3] ?? ''}`);
  }

  async function doRoll(f: string, label?: string) {
    if (rolling) return;
    setRolling(true);
    const table = mesas.find((m) => m.id === tableId);
    const res = await roll({ formula: normalize(f), label, mode, tableId: tableId || undefined, tableName: table?.titulo });
    setRolling(false);
    if (!res.ok) showToast(res.error, 'error');
  }

  async function createShortcut(name: string, f: string) {
    const res = await addShortcut(name, f);
    if (res.ok) showToast('Atalho salvo!', 'success'); else showToast(res.error, 'error');
    return res.ok;
  }

  const section = (t: string) => <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{t}</Text>;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Dados" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        {section('Dados')}
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {VALID_SIDES.map((s) => (
            <Pressable key={s} onPress={() => pickSides(s)} accessibilityRole="radio" accessibilityState={{ checked: sides === s }} accessibilityLabel={`Dado d${s}`}
              style={{ width: 68, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: sides === s ? COLORS.primary : COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: sides === s ? COLORS.primary : COLORS.outlineVariant }}>
              <Text style={{ color: sides === s ? COLORS.onPrimary : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(17) }}>d{s}</Text>
            </Pressable>
          ))}
        </View>

        <ShortcutsSection characters={characters} shortcuts={shortcuts} rolling={rolling} currentFormula={formula}
          onRoll={(f, label) => { setFormula(f); void doRoll(f, label); }} onCreate={createShortcut} onRemove={(id) => { void removeShortcut(id).then((r) => { if (!r.ok) showToast(r.error, 'error'); }); }} />

        <View style={{ gap: 12, padding: 14, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Fórmula</Text>
          <TextInput value={formula} onChangeText={setFormula} placeholder="1d20 + 5" placeholderTextColor={COLORS.onSurfaceVariant} autoCapitalize="none" autoCorrect={false}
            accessibilityLabel="Fórmula de dados" onSubmitEditing={() => valid && doRoll(formula)} returnKeyType="go" style={inputStyle(!!formula && !valid, valid)} />
          {formula && !valid ? <Text style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(12) }}>Fórmula inválida. Use NdX, NdX+M ou NdX-M (ex: 2d6+3).</Text> : null}

          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Modo</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MODES.map((m) => <Chip key={m.id} label={m.label} on={mode === m.id} onPress={() => setMode(m.id)} />)}
          </View>

          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Mesa</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="Sem mesa" on={!tableId} onPress={() => setTableId('')} />
            {mesas.map((t) => <Chip key={t.id} label={t.titulo} on={tableId === t.id} onPress={() => setTableId(t.id)} />)}
          </View>

          <Pressable onPress={() => doRoll(formula)} disabled={!valid || rolling} accessibilityRole="button"
            style={{ minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: COLORS.primary, opacity: !valid || rolling ? 0.5 : 1 }}>
            <MaterialIcons name="casino" size={22} color={COLORS.onPrimary} />
            <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(17) }}>{rolling ? 'Rolando…' : 'Rolar dados'}</Text>
          </Pressable>
        </View>

        <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 8, padding: 18, borderRadius: 14, backgroundColor: COLORS.surfaceContainer, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(12), textTransform: 'uppercase' }}>
            Última rolagem{last?.tableName ? ` · ${last.tableName}` : ''}
          </Text>
          {last ? (
            <>
              <Animated.Text accessibilityLabel={`Resultado ${last.result.total}`}
                style={{ transform: [{ scale: pop }], color: lastCrit === 'crit' ? COLORS.primary : lastCrit === 'fail' ? '#e57373' : COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(72), lineHeight: appFontSize(80) }}>
                {last.result.total}
              </Animated.Text>
              {lastCrit ? <Badge kind={lastCrit} /> : null}
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13), textAlign: 'center' }}>
                {baseOf(last.formula)} → {breakdownOf(last)}
                {last.discarded && last.discarded.length > 0 ? ` (descartado: ${last.discarded.join(' + ')})` : ''}
                {last.label ? ` · ${last.label}` : ''}
              </Text>
            </>
          ) : <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Nenhuma rolagem ainda.</Text>}
        </View>

        {section('Histórico')}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="radiogroup">
          <Chip label="Todas" on={!filter} onPress={() => setFilter('')} />
          {tableNames.map((n) => <Chip key={n} label={n} on={filter === n} onPress={() => setFilter(n)} />)}
        </ScrollView>
        <View style={{ gap: 8 }}>
          {visible.length === 0 && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Nenhuma rolagem ainda.</Text>}
          {visible.map((h, i) => {
            const c = critOf(h);
            const multi = h.result.rolls.length > 1 && h.result.mod === 0;
            const meta = [h.label, h.tableName].filter(Boolean).join(' · ');
            return (
              <View key={`${h.timestamp}-${i}`} accessible
                accessibilityLabel={`${baseOf(h.formula)}, total ${h.result.total}${c ? (c === 'crit' ? ', crítico' : ', falha') : ''}, ${whenOf(h.timestamp)}${meta ? `, ${meta}` : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1,
                  borderColor: c === 'crit' ? COLORS.primary : c === 'fail' ? '#c0392b' : COLORS.outlineVariant }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>
                    {baseOf(h.formula)}{h.result.mod ? (h.result.mod > 0 ? `+${h.result.mod}` : h.result.mod) : ''} → {multi ? `[${h.result.rolls.join(', ')}]` : h.result.total}
                  </Text>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{whenOf(h.timestamp)}{meta ? ` · ${meta}` : ''}</Text>
                </View>
                {c ? <Badge kind={c} /> : null}
                <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(22), minWidth: 36, textAlign: 'right' }}>{h.result.total}</Text>
              </View>
            );
          })}
        </View>
        {shown.length > HISTORY_PREVIEW && (
          <Pressable onPress={() => setShowAll((v) => !v)} style={{ minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{showAll ? 'Mostrar menos' : 'Ver histórico completo'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
