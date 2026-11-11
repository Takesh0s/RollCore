import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { Btn, ConfirmDialog, FormGroup, Select, StateBlock, inputStyle } from '../components/Controls';
import { TableLimitModal } from '../components/tables/TableModals';
import { COLORS, Header, appFontSize } from '../design/shared';
import { imageSrc, pickImage, type PreparedImage } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { showToast } from '../store/useToast';
import { useTables } from '../store/useTables';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';
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
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Editar mesa" onBack={() => router.back()} />
        <StateBlock icon="hourglass-empty" title="Carregando mesa…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={isEdit ? 'Editar mesa' : 'Criação de Mesa'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <FormGroup label="Nome da campanha:" error={nameErr}>
          <TextInput value={name} onChangeText={(t) => { setName(t); setNameErr(''); }} maxLength={100} accessibilityLabel="Nome da campanha" style={inputStyle(!!nameErr)} />
        </FormGroup>
        <FormGroup label="Sistema">
          <Select title="Sistema" value={system} options={systems} onChange={setSystem} />
        </FormGroup>
        <FormGroup label="Descrição da campanha (Opcional):">
          <TextInput value={description} onChangeText={setDescription} maxLength={2000} multiline numberOfLines={6} accessibilityLabel="Descrição da campanha"
            style={[inputStyle(), { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' }]} />
        </FormGroup>
        <FormGroup label="Número de jogadores">
          <Select title="Número de jogadores" value={String(maxPlayers)} options={Array.from({ length: 20 }, (_, i) => String(i + 1))} onChange={(v) => setMaxPlayers(Number(v))} />
        </FormGroup>

        <FormGroup label={`${shownCover ? 'Capa' : 'Adicionar Capa'} (Opcional)`} hint="A capa fica salva na mesa e aparece para todos os jogadores. Máx. 2 MB.">
          <Pressable onPress={pickCover} accessibilityRole="button" accessibilityLabel="Escolher capa da mesa"
            style={{ height: 130, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh }}>
            {shownCover ? <Image source={{ uri: shownCover }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(32) }}>+</Text>}
          </Pressable>
          {shownCover ? <View style={{ marginTop: 8 }}><Btn label="Remover capa" onPress={() => { setCover(null); setRemoveCover(true); }} /></View> : null}
        </FormGroup>

        <Btn label={loading ? '…' : isEdit ? 'Salvar alterações' : 'Salvar'} kind="primary" disabled={loading} onPress={save} />

        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20), marginTop: 8 }}>Mapas</Text>
        <Btn label="Adicionar mapa" kind="primary" onPress={() => router.push('/mapas' as any)} />
      </ScrollView>

      {!!limit && <TableLimitModal message={limit} onClose={() => setLimit('')} onManage={() => { setLimit(''); leavingRef.current = true; router.replace('/mesas' as any); }} />}
      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?"
        message={`Você ${current ? 'editou' : 'começou a criar'} ${name.trim() || 'a mesa'} e ainda não salvou.`} confirmLabel="Descartar" cancelLabel="Continuar editando"
        onCancel={() => setLeaveAction(null)}
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
    </SafeAreaView>
  );
}
