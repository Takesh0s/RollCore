import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { DiceStage } from '../components/dice/DiceStage';
import { BODY, BOLD, BTN, CRIT, FAIL, SERIF, ChipRow, DiceBadge, DiceChip, DiceTitle, fieldStyle } from '../components/dice/parts';
import { AppHeader } from '../components/AppHeader';
import { ShortcutsSection } from '../components/dice/ShortcutsSection';
import { COLORS, appFontSize } from '../design/shared';
import { FORMULA_REGEX, VALID_SIDES, validateFormula } from '../lib/dice';
import { useAcessibilidade } from '../store/acessibilidade';
import { useTables } from '../store/useTables';
import { useCharacters } from '../store/useCharacters';
import { useDice } from '../store/useDice';
import { showToast } from '../store/useToast';
import type { DiceMode, HistoryEntry } from '../types';


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

/** Tela de Dados (mesma do web): dados, atalhos, rolador, última rolagem e histórico. */
export default function DadosScreen() {
  useAcessibilidade();
  const { characters, loaded, load } = useCharacters();
  const { history, shortcuts, loadHistory, loadShortcuts, roll, addShortcut, removeShortcut } = useDice();
  const mesas = useTables((s) => s.tables);
  const carregarMesas = useTables((s) => s.load);

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

  /** Troca o tipo de dado mantendo quantidade e bônus: 2d6+3 → 2d20+3. */
  function pickSides(s: number) {
    const m = valid ? clean.match(FORMULA_REGEX)! : null;
    setFormula(`${m ? m[1] : 1}d${s}${m?.[3] ?? ''}`);
  }

  async function doRoll(f: string, label?: string) {
    if (rolling) return;
    setRolling(true);
    const table = mesas.find((m) => m.id === tableId);
    const res = await roll({ formula: normalize(f), label, mode, tableId: tableId || undefined, tableName: table?.name });
    setRolling(false);
    if (!res.ok) showToast(res.error, 'error');
  }

  async function createShortcut(name: string, f: string) {
    const res = await addShortcut(name, f);
    if (res.ok) showToast('Atalho salvo!', 'success'); else showToast(res.error, 'error');
    return res.ok;
  }

  const box = { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 14 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Dados" />
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 14, paddingBottom: 18 }} keyboardShouldPersistTaps="handled">
        <DiceTitle>Dados</DiceTitle>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          {VALID_SIDES.map((s) => (
            <Pressable key={s} onPress={() => pickSides(s)} accessibilityRole="radio" accessibilityState={{ checked: sides === s }} accessibilityLabel={`Dado d${s}`}
              style={{ width: '22.5%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                backgroundColor: sides === s ? COLORS.sapphire : 'transparent', borderColor: sides === s ? COLORS.sapphire : COLORS.outlineVariant }}>
              <Text style={{ color: sides === s ? '#10202E' : '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(22) }}>d{s}</Text>
            </Pressable>
          ))}
        </View>

        <ShortcutsSection characters={characters} shortcuts={shortcuts} rolling={rolling} currentFormula={formula}
          onRoll={(f, label) => { setFormula(f); void doRoll(f, label); }} onCreate={createShortcut} onRemove={(id) => { void removeShortcut(id).then((r) => { if (!r.ok) showToast(r.error, 'error'); }); }} />

        <View style={{ ...box, padding: 14, paddingBottom: 16, marginTop: 12, marginBottom: 14, gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(12) }}>Fórmula</Text>
            <TextInput value={formula} onChangeText={setFormula} placeholder="1d20 + 5" placeholderTextColor={COLORS.placeholder} autoCapitalize="none" autoCorrect={false}
              accessibilityLabel="Fórmula de dados" onSubmitEditing={() => valid && doRoll(formula)} returnKeyType="go" style={fieldStyle(!!formula && !valid)} />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(12) }}>Modo</Text>
            <ChipRow>{MODES.map((m) => <DiceChip key={m.id} label={m.label} on={mode === m.id} onPress={() => setMode(m.id)} />)}</ChipRow>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(12) }}>Mesa</Text>
            <ChipRow>
              <DiceChip label="Sem mesa" on={!tableId} onPress={() => setTableId('')} />
              {mesas.map((t) => <DiceChip key={t.id} label={t.name} on={tableId === t.id} onPress={() => setTableId(t.id)} />)}
            </ChipRow>
          </View>
          <Pressable onPress={() => doRoll(formula)} disabled={!valid || rolling} accessibilityRole="button" accessibilityLabel="Rolar dados"
            style={{ height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btn, opacity: !valid || rolling ? 0.55 : 1,
              shadowColor: '#fff', shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: !valid || rolling ? 0 : 4 }}>
            <Text style={{ color: COLORS.btnText, fontFamily: BTN, fontSize: appFontSize(15) }}>{rolling ? 'Rolando…' : 'Rolar dados'}</Text>
          </Pressable>
          {formula && !valid ? <Text style={{ color: FAIL, fontFamily: BODY, fontSize: appFontSize(12) }}>Fórmula inválida. Use NdX, NdX+M ou NdX-M (ex: 2d6+3).</Text> : null}
        </View>

        <View accessibilityLiveRegion="polite" style={{ ...box, alignItems: 'center', gap: 8, padding: 16, marginBottom: 14 }}>
          <Text style={{ alignSelf: 'stretch', textAlign: 'center', color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(12) }}>
            Última rolagem{last?.tableName ? ` · ${last.tableName}` : ''}
          </Text>
          <DiceStage sides={sides ?? 20} rolling={rolling} edge={COLORS.sapphire}
            result={last ? { id: last.timestamp, sides: last.result.sides, rolls: last.result.rolls, total: last.result.total, tone: lastCrit ?? '' } : null} />
          {last && lastCrit ? <DiceBadge kind={lastCrit} /> : null}
          <Text style={{ color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(13), textAlign: 'center' }}>
            {last ? `${baseOf(last.formula)} → ${breakdownOf(last)}${last.discarded && last.discarded.length > 0 ? ` (descartado: ${last.discarded.join(' + ')})` : ''}${last.label ? ` · ${last.label}` : ''}` : 'Nenhuma rolagem ainda.'}
          </Text>
        </View>

        <DiceTitle>Histórico</DiceTitle>
        <ChipRow>
          <DiceChip label="Todas" on={!filter} onPress={() => setFilter('')} />
          {tableNames.map((n) => <DiceChip key={n} label={n} on={filter === n} onPress={() => setFilter(n)} />)}
        </ChipRow>
        <View style={{ gap: 8, marginTop: 6 }}>
          {visible.length === 0 && <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(14), paddingVertical: 12 }}>Nenhuma rolagem ainda.</Text>}
          {visible.map((h, i) => {
            const c = critOf(h);
            const multi = h.result.rolls.length > 1 && h.result.mod === 0;
            const meta = [h.label, h.tableName].filter(Boolean).join(' · ');
            return (
              <View key={`${h.timestamp}-${i}`} accessible
                accessibilityLabel={`${baseOf(h.formula)}, total ${h.result.total}${c ? (c === 'crit' ? ', crítico' : ', falha') : ''}, ${whenOf(h.timestamp)}${meta ? `, ${meta}` : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: '#FFFFFF', fontFamily: BOLD, fontSize: appFontSize(13) }}>
                    {baseOf(h.formula)}{h.result.mod ? (h.result.mod > 0 ? `+${h.result.mod}` : h.result.mod) : ''} → {multi ? `[${h.result.rolls.join(', ')}]` : h.result.total}
                  </Text>
                  <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(10), marginTop: 3 }}>{whenOf(h.timestamp)}{meta ? ` · ${meta}` : ''}</Text>
                </View>
                {c ? <DiceBadge kind={c} /> : null}
                <Text style={{ color: c === 'fail' ? FAIL : COLORS.sapphire, fontFamily: SERIF, fontSize: appFontSize(24), minWidth: 36, textAlign: 'right' }}>{h.result.total}</Text>
              </View>
            );
          })}
        </View>
        {shown.length > HISTORY_PREVIEW && (
          <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button"
            style={{ marginTop: 14, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.sapphire }}>
            <Text style={{ color: COLORS.sapphire, fontFamily: BOLD, fontSize: appFontSize(14) }}>{showAll ? 'Mostrar menos' : 'Ver histórico completo'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
