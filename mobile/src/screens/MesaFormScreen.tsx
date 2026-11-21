import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { ConfirmDialog, Select, StateBlock } from '../components/Controls';
import { NavIcon } from '../components/NavIcon';
import { TableLimitModal } from '../components/tables/TableModals';
import { BODY, FAIL, MUTED, PillBtn, RuleTitle } from '../components/tables/parts';
import { COLORS, Header, appFontSize } from '../design/shared';
import { imageSrc, pickImage, type PreparedImage } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { showToast } from '../store/useToast';
import { useTables } from '../store/useTables';

/** `.form-input` do web: fundo --field, texto --field-text, raio 10 e 15 px. */
const field = (error?: boolean) => ({ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: COLORS.field, color: COLORS.fieldText, fontFamily: BODY, fontSize: appFontSize(15),
  borderWidth: 1, borderColor: error ? FAIL : 'transparent' }) as const;
const label = { color: '#FFFFFF', fontFamily: BODY, fontSize: appFontSize(14) } as const;

const SYSTEMS = ['D&D 5e', 'Tormenta20', 'Call of Cthulhu', 'Pathfinder 2e', 'Outro'];

/** Criar / editar mesa (mesmo fluxo do web: nome, sistema, descrição, jogadores e capa). */
export default function MesaFormScreen() {
  useAcessibilidade();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tables, detail, create, update, load } = useTables();
  const isEdit = !!id;
  const current = isEdit ? (tables.find((t) => t.id === id) ?? (detail?.table.id === id ? detail.table : undefined)) : undefined;

  useEffect(() => { if (isEdit && !current) void load(); }, [isEdit, current, load]);

  const systems = current && !SYSTEMS.includes(current.gameSystem) ? [...SYSTEMS, current.gameSystem] : SYSTEMS;
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [system, setSystem] = useState(SYSTEMS[0]);
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [cover, setCover] = useState<PreparedImage | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState('');
  const [leaveAction, setLeaveAction] = useState<unknown>(null);
  const filled = useRef(false);

  useEffect(() => {
    if (!current || filled.current) return;
    filled.current = true;
    setName(current.name); setSystem(current.gameSystem); setDescription(current.description ?? ''); setMaxPlayers(current.maxPlayers);
  }, [current]);

  const shownCover = cover?.uri ?? (removeCover || !current ? undefined : imageSrc(current.coverUrl) ?? undefined);
  const dirty = current
    ? name !== current.name || system !== current.gameSystem || description !== (current.description ?? '') || maxPlayers !== current.maxPlayers || !!cover || removeCover
    : !!(name.trim() || description.trim() || cover);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const leavingRef = useRef(false);

  // Sair (voltar, gesto ou cabeçalho) com alterações não salvas pede confirmação
  useEffect(() => {
    const sub = (navigation as any).addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      if (!dirtyRef.current || leavingRef.current) return;
      e.preventDefault();
      setLeaveAction(e.data.action);
    });
    return sub;
  }, [navigation]);

  async function pickCover() {
    const img = await pickImage({ aspect: [5, 2], maxWidth: 960 });
    if (img) { setCover(img); setRemoveCover(false); }
  }

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 100) { setNameErr('O nome da campanha deve ter de 3 a 100 caracteres.'); return; }
    setNameErr('');
    setLoading(true);
    try {
      const input = { name: trimmed, gameSystem: system, description, maxPlayers, cover, removeCover };
      if (current) {
        if (await update(current.id, input)) {
          leavingRef.current = true;
          showToast('Mesa atualizada!', 'success');
          router.back();
        }
        return;
      }
      const res = await create(input);
      if (res.ok) {
        leavingRef.current = true;
        showToast('Mesa criada!', 'success');
        router.replace(`/sessao/${res.detail.table.id}` as any);
      } else if (res.status === 409) {
        setLimit(res.error || 'Você atingiu o limite de mesas do seu plano.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (isEdit && !current) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Editar mesa" onBack={() => router.back()} />
        <StateBlock icon="hourglass-empty" title="Carregando mesa…" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={isEdit ? 'Editar mesa' : 'Criação de Mesa'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 14 }}>
          <Text style={[label, { marginBottom: 4 }]}>Nome da campanha:</Text>
          <TextInput value={name} onChangeText={(t) => { setName(t); setNameErr(''); }} maxLength={100} accessibilityLabel="Nome da campanha" style={field(!!nameErr)} />
          {nameErr ? <Text accessibilityLiveRegion="polite" style={{ marginTop: 4, color: FAIL, fontFamily: BODY, fontSize: appFontSize(12) }}>{nameErr}</Text> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Text style={label}>Sistema</Text>
          <Select compact title="Sistema" value={system} options={systems} onChange={setSystem} />
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={[label, { marginBottom: 4 }]}>Descrição da campanha (Opcional):</Text>
          <TextInput value={description} onChangeText={setDescription} maxLength={2000} multiline numberOfLines={6} accessibilityLabel="Descrição da campanha"
            style={[field(), { minHeight: 136, textAlignVertical: 'top' }]} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Text style={label}>Número de jogadores</Text>
          <Select compact title="Número de jogadores" value={String(maxPlayers)} options={Array.from({ length: 20 }, (_, i) => String(i + 1))} onChange={(v) => setMaxPlayers(Number(v))} />
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={label}>{shownCover ? 'Capa' : 'Adicionar Capa'} (Opcional)</Text>
          <Pressable onPress={pickCover} accessibilityRole="button" accessibilityLabel="Escolher capa da mesa"
            style={{ width: '100%', minHeight: shownCover ? 140 : 120, marginTop: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {shownCover ? <Image source={{ uri: shownCover }} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} /> : <NavIcon name="plus" size={44} color="#1b2226" />}
          </Pressable>
          {shownCover ? <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><PillBtn label="Remover capa" onPress={() => { setCover(null); setRemoveCover(true); }} /></View> : null}
          <Text style={{ marginTop: 4, color: MUTED, fontFamily: BODY, fontSize: appFontSize(12) }}>A capa fica salva na mesa e aparece para todos os jogadores. Máx. 2 MB.</Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <PillBtn kind="primary" pill={false} label={loading ? '…' : isEdit ? 'Salvar alterações' : 'Salvar'} disabled={loading} onPress={save} />
        </View>

        <RuleTitle>Mapas</RuleTitle>
        <View style={{ alignItems: 'center' }}>
          <PillBtn kind="primary" pill={false} label="Adicionar mapa" onPress={() => router.push('/mapas' as any)} />
        </View>
      </ScrollView>

      {!!limit && <TableLimitModal message={limit} onClose={() => setLimit('')} onManage={() => { setLimit(''); leavingRef.current = true; router.replace('/mesas' as any); }} />}
      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?"
        message={`Você ${current ? 'editou' : 'começou a criar'} ${name.trim() || 'a mesa'} e ainda não salvou.`} confirmLabel="Descartar" cancelLabel="Continuar editando"
        onCancel={() => setLeaveAction(null)}
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
    </View>
  );
}
