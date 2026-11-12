import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { FormGroup, inputStyle } from '../components/Controls';
import { Choice, ChoiceRow } from '../components/maps/Choice';
import { BODY, BOLD, Btn, SERIF } from '../components/maps/MapModals';
import { COLORS, Header, appFontSize } from '../design/shared';
import { pickMapImage, uploadImage, type PreparedImage } from '../lib/mapImage';
import { DEFAULT_CELL, GRID_TYPES, gridForImage, KINDS, MAX_NAME, SIZES, type GridType, type MapKind } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { imageIdOf, useMaps, type MapBody } from '../store/useMaps';

type Template = 'custom' | 'upload';
type SizeId = (typeof SIZES)[number]['id'];

/**
 * Assistente "Criar mapa": tipo, formato da grade e ponto de partida.
 * "Oficina da Comunidade" e "Continuar mapa" levam direto à outra tela; "Fazer upload" e "Personalizado"
 * são as duas formas de começar um mapa novo (imagem sua ou em branco).
 */
export default function MapaNovoScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { maps, create } = useMaps();

  const [name, setName] = useState('Novo mapa');
  const [kind, setKind] = useState<MapKind>('MEDIEVAL');
  const [gridType, setGridType] = useState<GridType>('SQUARE');
  const [template, setTemplate] = useState<Template>('custom');
  const [size, setSize] = useState<SizeId>('medium');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [cols, setCols] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const last = maps[0]; // a lista já vem do servidor com o editado por último primeiro
  const fit = image ? gridForImage(image.width, image.height, cols) : null;

  const openEditor = (id: string) => router.replace(`/mapa-editor?id=${id}` as any);

  async function pick() {
    setError('');
    const prepared = await pickMapImage();
    if (!prepared) { setError('Escolha uma imagem PNG, JPG ou WebP que o aparelho consiga abrir.'); return; }
    setImage(prepared);
  }

  async function build(body: MapBody) {
    const res = await create(body);
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    openEditor(res.map.id);
  }

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 3) { setError('Dê um nome ao mapa (mínimo de 3 letras).'); return; }
    setError('');
    setBusy(true);
    if (template === 'upload') {
      if (!image || !fit) { setError('Escolha a imagem do mapa.'); setBusy(false); return; }
      const url = await uploadImage(image);
      if (!url) { setError('Não foi possível enviar a imagem. Confira o tamanho (máx. 2 MB) e tente de novo.'); setBusy(false); return; }
      await build({ name: trimmed, kind, gridType, ...fit, imageId: imageIdOf(url), layers: '{}', gridVisible: true, fogEnabled: false });
    } else {
      const s = SIZES.find((x) => x.id === size) ?? SIZES[1];
      await build({ name: trimmed, kind, gridType, cols: s.cols, rows: s.rows, cellSize: DEFAULT_CELL, layers: '{}', gridVisible: true, fogEnabled: false });
    }
  }

  /** "Pular": um mapa em branco com o padrão (tipo e formato trocam depois, no editor). */
  async function skip() {
    setBusy(true); setError('');
    const s = SIZES[1];
    await build({ name: 'Novo mapa', kind: 'MEDIEVAL', gridType: 'SQUARE', cols: s.cols, rows: s.rows, cellSize: DEFAULT_CELL, layers: '{}', gridVisible: true, fogEnabled: false });
  }

  const q = (text: string) => <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(17), marginTop: 6 }}>{text}</Text>;
  const step = (label: string, delta: number) => (
    <Btn key={label} label={label} accessibilityLabel={`${delta > 0 ? 'Aumentar' : 'Diminuir'} colunas em ${Math.abs(delta)}`} onPress={() => setCols((c) => Math.min(100, Math.max(10, c + delta)))} />
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Criar mapa" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(22) }}>Vamos iniciar um mapa novo!</Text>

        <FormGroup label="Nome do mapa">
          <TextInput value={name} onChangeText={setName} maxLength={MAX_NAME} accessibilityLabel="Nome do mapa" style={inputStyle()} />
        </FormGroup>

        {q('Que tipo de mapa você gostaria de criar?')}
        <ChoiceRow>
          {KINDS.map((k) => <Choice key={k.id} title={k.label} on={kind === k.id} onPress={() => setKind(k.id)} width="47%" />)}
        </ChoiceRow>

        {q('Qual será o formato do mapa?')}
        <ChoiceRow>
          {GRID_TYPES.map((g) => <Choice key={g.id} title={g.label} hint={g.hint} on={gridType === g.id} onPress={() => setGridType(g.id)} width="47%" />)}
        </ChoiceRow>

        {q('Você gostaria de um template?')}
        <ChoiceRow>
          <Choice title="Oficina da Comunidade" hint="Mapas criados por outros mestres" onPress={() => router.push('/oficina-mapas' as any)} width="47%" />
          <Choice title="Fazer upload de mapa" hint="Do seu aparelho (PNG, JPG ou WebP)" on={template === 'upload'} onPress={() => setTemplate('upload')} width="47%" />
          <Choice title="Continuar mapa" hint={last ? `Retomar "${last.name}"` : 'Você ainda não tem mapas'} disabled={!last} onPress={() => last && openEditor(last.id)} width="47%" />
          <Choice title="Personalizado" hint="Começar do zero" on={template === 'custom'} onPress={() => setTemplate('custom')} width="47%" />
        </ChoiceRow>

        {template === 'custom' && (
          <>
            <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Tamanho do mapa</Text>
            <ChoiceRow>
              {SIZES.map((s) => <Choice key={s.id} title={s.label} hint={`${s.cols} × ${s.rows} células`} on={size === s.id} onPress={() => setSize(s.id)} width="30%" />)}
            </ChoiceRow>
          </>
        )}

        {template === 'upload' && (
          <>
            <Btn label={image ? 'Trocar imagem' : 'Escolher imagem'} accessibilityLabel="Imagem do mapa" onPress={pick} />
            {image && fit && (
              <View style={{ gap: 10 }}>
                <Image source={{ uri: image.uri }} accessibilityLabel="Prévia da imagem escolhida" resizeMode="contain" style={{ width: '100%', height: 200, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHigh }} />
                <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Colunas da grade: {fit.cols}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>{step('−5', -5)}{step('−1', -1)}{step('+1', 1)}{step('+5', 5)}</View>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>A grade ficará com {fit.cols} × {fit.rows} células. Ajuste até casar com o desenho da imagem.</Text>
              </View>
            )}
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>Imagens grandes são reduzidas automaticamente para caber no limite de 2 MB.</Text>
          </>
        )}

        {!!error && <Text accessibilityRole="alert" style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(13) }}>{error}</Text>}

        <View style={{ height: 1, backgroundColor: COLORS.outlineVariant, marginVertical: 6 }} />
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>Você pode trocar o tipo e o formato depois, dentro do editor.</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Pular" disabled={busy} onPress={skip} /></View>
          <View style={{ flex: 1 }}><Btn label={busy ? '…' : 'Salvar'} kind="primary" disabled={busy} onPress={save} /></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
