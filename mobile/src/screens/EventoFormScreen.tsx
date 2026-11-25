import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { ConfirmDialog, Select, StateBlock } from '../components/Controls';
import { FAIL, PillBtn } from '../components/tables/parts';
import { COLORS, Header, appFontSize } from '../design/shared';
import { COLOR_NAMES, COLOR_ORDER, EVENT_COLORS, REPEAT_LABELS, type EventColor, type Repeat } from '../lib/calendar';
import { brToISO, isoToBR, maskDate, maskTime, parseTime } from '../lib/dateInput';
import { toISO } from '../lib/calendar';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCalendar } from '../store/useCalendar';
import { useTables } from '../store/useTables';
import { showToast } from '../store/useToast';

const BODY = 'Inter_400Regular';

const REPEATS = Object.keys(REPEAT_LABELS) as Repeat[];

/** Criar evento: só o mestre e os moderadores de uma mesa marcam eventos (mesmas regras do web). */
export default function EventoFormScreen() {
  useAcessibilidade();
  const router = useRouter();
  const navigation = useNavigation();
  const allTables = useTables((s) => s.tables);
  const loadTables = useTables((s) => s.load);
  const tables = allTables.filter((t) => t.myRole !== 'PLAYER');
  const add = useCalendar((s) => s.add);

  const [title, setTitle] = useState('');
  const [tableName, setTableName] = useState('');
  const [date, setDate] = useState(() => isoToBR(toISO(new Date())));
  const [start, setStart] = useState('20:00');
  const [end, setEnd] = useState('23:00');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<EventColor>('blue');
  const [askRsvp, setAskRsvp] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [leaveAction, setLeaveAction] = useState<unknown>(null);

  useEffect(() => { void loadTables(); }, [loadTables]);
  const names = tables.map((t) => t.name);
  const chosen = tables.find((t) => t.name === tableName) ?? tables[0];

  const dirty = !!(title.trim() || description.trim());
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const leavingRef = useRef(false);
  useEffect(() => {
    const sub = (navigation as any).addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      if (!dirtyRef.current || leavingRef.current) return;
      e.preventDefault();
      setLeaveAction(e.data.action);
    });
    return sub;
  }, [navigation]);

  async function save() {
    const err: Record<string, string> = {};
    const name = title.trim();
    const iso = brToISO(date);
    const s = parseTime(start), f = parseTime(end);
    if (name.length < 3 || name.length > 100) err.title = 'O nome do evento deve ter de 3 a 100 caracteres.';
    if (!chosen) err.table = 'Escolha a mesa do evento.';
    if (!iso) err.date = 'Informe uma data válida (DD/MM/AAAA).';
    if (!s || !f) err.time = 'Informe o início e o fim (HH:MM).';
    else if (f <= s) err.time = 'O fim deve ser depois do início.';
    setErrors(err);
    if (Object.keys(err).length || !chosen || !iso || !s || !f) return;

    setSaving(true);
    const res = await add(chosen.id, { title: name, date: iso, start: s, end: f, repeat, description: description.trim(), color, askRsvp });
    setSaving(false);
    if (!res.ok) { showToast(res.error, 'error'); return; }
    leavingRef.current = true;
    showToast('Evento criado.', 'success');
    router.replace('/calendario' as any);
  }

  if (!tables.length) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Criar evento" onBack={() => router.back()} />
        <StateBlock icon="event-busy" title="Você ainda não pode criar eventos" text="Só o mestre ou um moderador de uma mesa cria eventos." actionLabel="Voltar" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  /** `.form-label` / `.form-input` do web. */
  const lbl = { color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14) } as const;
  const fld = (error?: boolean) => ({ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.field, color: COLORS.fieldText,
    fontFamily: BODY, fontSize: appFontSize(15), borderWidth: 1, borderColor: error ? FAIL : 'transparent' }) as const;
  const err = (t?: string) => (t ? <Text accessibilityLiveRegion="polite" style={{ color: FAIL, fontFamily: BODY, fontSize: appFontSize(12) }}>{t}</Text> : null);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Criar evento" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Text style={lbl}>Nome do evento:</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={100} placeholder="Ex.: Sessão 13" placeholderTextColor={COLORS.placeholder} accessibilityLabel="Nome do evento" style={fld(!!errors.title)} />
          {err(errors.title)}
        </View>
        <View style={{ gap: 6 }}>
          <Text style={lbl}>Mesa / comunidade</Text>
          <Select title="Mesa / comunidade" value={chosen?.name ?? ''} options={names} onChange={setTableName} />
          {err(errors.table)}
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={lbl}>Data do evento</Text>
            <TextInput value={date} onChangeText={(t) => setDate(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" placeholderTextColor={COLORS.placeholder} maxLength={10} accessibilityLabel="Data do evento" style={fld(!!errors.date)} />
            {err(errors.date)}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={lbl}>Início</Text>
            <TextInput value={start} onChangeText={(t) => setStart(maskTime(t))} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} maxLength={5} accessibilityLabel="Início" style={fld(!!errors.time)} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={lbl}>Fim</Text>
            <TextInput value={end} onChangeText={(t) => setEnd(maskTime(t))} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} maxLength={5} accessibilityLabel="Fim" style={fld(!!errors.time)} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={lbl}>Repetir</Text>
            <Select title="Repetir" value={REPEAT_LABELS[repeat]} options={REPEATS.map((r) => REPEAT_LABELS[r])} onChange={(v) => setRepeat(REPEATS.find((r) => REPEAT_LABELS[r] === v) ?? 'none')} />
          </View>
        </View>
        {err(errors.time)}
        <View style={{ gap: 6 }}>
          <Text style={lbl}>Descrição do evento (Opcional)</Text>
          <TextInput value={description} onChangeText={setDescription} maxLength={500} multiline numberOfLines={4} accessibilityLabel="Descrição do evento"
            style={[fld(), { minHeight: 84, textAlignVertical: 'top' }]} />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={lbl}>Cor do evento</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
            {COLOR_ORDER.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} accessibilityRole="radio" accessibilityLabel={COLOR_NAMES[c]} accessibilityState={{ checked: color === c }}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: EVENT_COLORS[c], borderWidth: 3, borderColor: color === c ? COLORS.background : 'transparent',
                  ...(color === c ? { shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 } : null) }}>
                {color === c ? <View pointerEvents="none" style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 24, borderWidth: 2, borderColor: '#FFFFFF' }} /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => setAskRsvp((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: askRsvp }} accessibilityLabel="Pedir confirmação de presença dos jogadores"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 }}>
          <View style={{ width: 46, height: 26, borderRadius: 13, padding: 3, borderWidth: 1, borderColor: askRsvp ? COLORS.btnText : COLORS.outlineVariant,
            backgroundColor: askRsvp ? COLORS.btnText : COLORS.surfaceContainerHigh, alignItems: askRsvp ? 'flex-end' : 'flex-start' }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: askRsvp ? COLORS.btn : COLORS.onSurfaceVariant }} />
          </View>
          <Text style={{ flex: 1, color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14) }}>Pedir confirmação de presença dos jogadores</Text>
        </Pressable>

        <View style={{ gap: 10, marginTop: 8 }}>
          <PillBtn block kind="primary" pill={false} label={saving ? 'Salvando…' : 'Salvar'} disabled={saving} onPress={save} />
          <PillBtn block pill={false} label="Cancelar" onPress={() => router.back()} />
        </View>
      </ScrollView>

      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?" message={`Você começou a criar ${title.trim() || 'um evento'} e ainda não salvou.`}
        confirmLabel="Descartar" cancelLabel="Continuar editando" onCancel={() => setLeaveAction(null)}
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
    </SafeAreaView>
  );
}
