import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { Btn, ConfirmDialog, FormGroup, Select, StateBlock, inputStyle } from '../components/Controls';
import { COLORS, Header, appFontSize } from '../design/shared';
import { COLOR_NAMES, COLOR_ORDER, EVENT_COLORS, REPEAT_LABELS, type EventColor, type Repeat } from '../lib/calendar';
import { brToISO, isoToBR, maskDate, maskTime, parseTime } from '../lib/dateInput';
import { toISO } from '../lib/calendar';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCalendar } from '../store/useCalendar';
import { useTables } from '../store/useTables';
import { showToast } from '../store/useToast';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Criar evento" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <FormGroup label="Nome do evento:" error={errors.title}>
          <TextInput value={title} onChangeText={setTitle} maxLength={100} placeholder="Ex.: Sessão 13" placeholderTextColor={COLORS.placeholder} accessibilityLabel="Nome do evento" style={inputStyle(!!errors.title)} />
        </FormGroup>
        <FormGroup label="Mesa / comunidade" error={errors.table}>
          <Select title="Mesa / comunidade" value={chosen?.name ?? ''} options={names} onChange={setTableName} />
        </FormGroup>
        <FormGroup label="Data do evento" error={errors.date}>
          <TextInput value={date} onChangeText={(t) => setDate(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" placeholderTextColor={COLORS.placeholder} maxLength={10} accessibilityLabel="Data do evento" style={inputStyle(!!errors.date)} />
        </FormGroup>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormGroup label="Início" error={errors.time}>
              <TextInput value={start} onChangeText={(t) => setStart(maskTime(t))} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} maxLength={5} accessibilityLabel="Início" style={inputStyle(!!errors.time)} />
            </FormGroup>
          </View>
          <View style={{ flex: 1 }}>
            <FormGroup label="Fim">
              <TextInput value={end} onChangeText={(t) => setEnd(maskTime(t))} keyboardType="number-pad" placeholder="HH:MM" placeholderTextColor={COLORS.placeholder} maxLength={5} accessibilityLabel="Fim" style={inputStyle(!!errors.time)} />
            </FormGroup>
          </View>
        </View>
        <FormGroup label="Repetir">
          <Select title="Repetir" value={REPEAT_LABELS[repeat]} options={REPEATS.map((r) => REPEAT_LABELS[r])} onChange={(v) => setRepeat(REPEATS.find((r) => REPEAT_LABELS[r] === v) ?? 'none')} />
        </FormGroup>
        <FormGroup label="Descrição do evento (Opcional)">
          <TextInput value={description} onChangeText={setDescription} maxLength={500} multiline numberOfLines={4} accessibilityLabel="Descrição do evento"
            style={[inputStyle(), { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' }]} />
        </FormGroup>

        <FormGroup label="Cor do evento">
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {COLOR_ORDER.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} accessibilityRole="radio" accessibilityLabel={COLOR_NAMES[c]} accessibilityState={{ checked: color === c }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: EVENT_COLORS[c], borderWidth: 3, borderColor: color === c ? COLORS.onSurface : 'transparent' }} />
            ))}
          </View>
        </FormGroup>

        <Pressable onPress={() => setAskRsvp((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: askRsvp }} accessibilityLabel="Pedir confirmação de presença dos jogadores"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
          <View style={{ width: 46, height: 26, borderRadius: 13, padding: 3, backgroundColor: askRsvp ? COLORS.primary : COLORS.surfaceContainerHighest, alignItems: askRsvp ? 'flex-end' : 'flex-start' }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: askRsvp ? COLORS.onPrimary : COLORS.outline }} />
          </View>
          <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>Pedir confirmação de presença dos jogadores</Text>
        </Pressable>

        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
          Todos os jogadores da mesa veem o evento e podem confirmar ou recusar a presença. A data e a hora valem como você digitou, sem conversão de fuso.
        </Text>

        <Btn label={saving ? 'Salvando…' : 'Salvar'} kind="primary" disabled={saving} onPress={save} />
        <Btn label="Cancelar" onPress={() => router.back()} />
      </ScrollView>

      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?" message={`Você começou a criar ${title.trim() || 'um evento'} e ainda não salvou.`}
        confirmLabel="Descartar" cancelLabel="Continuar editando" onCancel={() => setLeaveAction(null)}
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
    </SafeAreaView>
  );
}
