import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Switch, useWindowDimensions, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { Chip, ConfirmDialog, Select, StateBlock } from '../components/Controls';
import { BODY, BOLD, Btn, RenameMapModal, SERIF, gridOf } from '../components/maps/MapModals';
import { MapView, TerrainSample, type StrokeEvent } from '../components/maps/MapView';
import { useMapExport } from '../components/maps/exportMap';
import { COLORS, Header, appFontSize } from '../design/shared';
import { clonePainting, decodeLayers, encodeLayers, GRID_TYPES, GROUPS, KINDS, mapSize, TERRAINS, type GridType, type MapKind, type Painting, type Terrain, type TerrainGroup } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { bodyOf, useMaps, type MapItem } from '../store/useMaps';
import { showToast } from '../store/useToast';

type Tool = { kind: 'paint'; id: string } | { kind: 'erase' } | { kind: 'reveal' } | { kind: 'cover' };

const HISTORY = 60;
const ZOOMS = [1, 1.5, 2, 3, 4];

const kindLabelOf = (id: MapKind) => KINDS.find((k) => k.id === id)?.label ?? '';
const gridLabelOf = (id: GridType) => GRID_TYPES.find((g) => g.id === id)?.label ?? '';

function IconBtn({ icon, label, onPress, on, disabled }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void; on?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!on, disabled: !!disabled }}
      style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1,
        backgroundColor: on ? COLORS.primary : 'transparent', borderWidth: 1, borderColor: on ? COLORS.primary : COLORS.outlineVariant }}>
      <MaterialIcons name={icon} size={22} color={on ? COLORS.onPrimary : COLORS.onSurface} />
    </Pressable>
  );
}

/** Carrega o mapa aberto e mostra o editor; sem mapa (ou de outra pessoa) mostra "não encontrado". */
export default function MapaEditorScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { get } = useMaps();
  const [item, setItem] = useState<MapItem | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    if (!id) { setItem(null); return; }
    get(id).then((m) => { if (alive) setItem(m && m.mine ? m : null); });
    return () => { alive = false; };
  }, [id, get]);

  if (item === undefined || item === null) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Editor de mapa" onBack={() => router.back()} />
        {item === null && <StateBlock icon="map" title="Mapa não encontrado" text="Ele pode ter sido excluído, ou não é seu." actionLabel="Voltar aos mapas" onAction={() => router.replace('/mapas' as any)} />}
      </SafeAreaView>
    );
  }
  return <MapEditor key={item.id} initial={item} />;
}

/**
 * Editor de mapa: o mapa na parte de cima e, embaixo, a paleta de terrenos por abas, tamanho do pincel,
 * grade, névoa de guerra, publicar na Oficina, salvar e sair.
 * Extras: desfazer/refazer, zoom (com "Mover" para arrastar o mapa), visualização como jogador e exportar PNG.
 */
function MapEditor({ initial }: { initial: MapItem }) {
  const router = useRouter();
  const navigation = useNavigation();
  const { height: screenH } = useWindowDimensions();
  const { save, remove, copy, setPublished } = useMaps();
  const exporter = useMapExport();

  const [saved, setSaved] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<MapKind>(initial.kind);
  const [gridType, setGridType] = useState<GridType>(initial.gridType);
  const [gridVisible, setGridVisible] = useState(initial.gridVisible);
  const [fogEnabled, setFogEnabled] = useState(initial.fogEnabled);

  const paintRef = useRef<Painting>(decodeLayers(initial.layers, initial.cols, initial.rows));
  const [rev, setRev] = useState(0);
  const [paintDirty, setPaintDirty] = useState(false);
  const undo = useRef<Painting[]>([]);
  const redo = useRef<Painting[]>([]);
  const [, setHist] = useState(0);
  const snap = useRef<Painting | null>(null);
  const changed = useRef(false);

  const [group, setGroup] = useState<TerrainGroup>('terrain');
  const [tool, setTool] = useState<Tool>({ kind: 'paint', id: 'grass' });
  const [brush, setBrush] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [leaveAction, setLeaveAction] = useState<unknown>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const dirty = paintDirty || name !== saved.name || kind !== saved.kind || gridType !== saved.gridType
    || gridVisible !== saved.gridVisible || fogEnabled !== saved.fogEnabled;
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

  const grid = useMemo(() => ({ type: gridType, cols: saved.cols, rows: saved.rows, cell: saved.cellSize }), [gridType, saved.cols, saved.rows, saved.cellSize]);
  const bump = () => setRev((r) => r + 1);
  const pushHistory = (before: Painting) => {
    undo.current.push(before);
    if (undo.current.length > HISTORY) undo.current.shift();
    redo.current = [];
    setHist((h) => h + 1);
    setPaintDirty(true);
  };

  // ── pintura ──────────────────────────────────────────────────────────────
  const toolRef = useRef(tool);
  toolRef.current = tool;
  function applyCells(cells: number[]) {
    const p = paintRef.current;
    const t0 = toolRef.current;
    let any = false;
    for (const idx of cells) {
      if (t0.kind === 'paint') {
        const t = TERRAINS.find((x) => x.id === t0.id);
        if (!t) continue;
        const layer = t.group === 'general' ? p.objects : p.base;
        if (layer.get(idx) !== t.id) { layer.set(idx, t.id); any = true; }
      } else if (t0.kind === 'erase') {
        if (p.base.delete(idx)) any = true;
        if (p.objects.delete(idx)) any = true;
      } else if (t0.kind === 'reveal') {
        if (!p.fog.has(idx)) { p.fog.add(idx); any = true; }
      } else if (p.fog.delete(idx)) any = true;
    }
    if (any) { changed.current = true; bump(); }
  }

  const onStroke = (e: StrokeEvent) => {
    if (e.phase === 'start') { snap.current = clonePainting(paintRef.current); changed.current = false; }
    if (e.phase !== 'end') { applyCells(e.cells); return; }
    if (changed.current && snap.current) pushHistory(snap.current);
    snap.current = null;
  };

  const doUndo = useCallback(() => {
    const prev = undo.current.pop();
    if (!prev) return;
    redo.current.push(clonePainting(paintRef.current));
    paintRef.current = prev;
    setHist((h) => h + 1); setPaintDirty(true); bump();
  }, []);
  const doRedo = useCallback(() => {
    const next = redo.current.pop();
    if (!next) return;
    undo.current.push(clonePainting(paintRef.current));
    paintRef.current = next;
    setHist((h) => h + 1); setPaintDirty(true); bump();
  }, []);

  function fillFog(reveal: boolean) {
    pushHistory(clonePainting(paintRef.current));
    paintRef.current.fog = new Set(reveal ? Array.from({ length: grid.cols * grid.rows }, (_, i) => i) : []);
    bump();
  }

  function toggleFog(on: boolean) {
    setFogEnabled(on);
    if (!on && (tool.kind === 'reveal' || tool.kind === 'cover')) setTool({ kind: 'paint', id: 'grass' });
  }

  // ── ações ────────────────────────────────────────────────────────────────
  async function doSave(): Promise<MapItem | null> {
    setSaving(true);
    const res = await save(saved.id, bodyOf(saved, { name, kind, gridType, gridVisible, fogEnabled, layers: encodeLayers(paintRef.current) }));
    setSaving(false);
    if (!res.ok) { showToast(res.error, 'error'); return null; }
    setSaved(res.map);
    setPaintDirty(false);
    dirtyRef.current = false;
    return res.map;
  }

  async function onSave() {
    if (await doSave()) showToast('Mapa salvo.', 'success');
  }

  async function onPublish() {
    const current = dirty ? await doSave() : saved;
    if (!current) return;
    const res = await setPublished(current.id, !current.published);
    if (!res.ok) { showToast(res.error, 'error'); return; }
    setSaved(res.map);
    showToast(res.map.published ? 'Mapa publicado na Oficina da Comunidade.' : 'O mapa saiu da Oficina.', 'success');
  }

  async function onDuplicate() {
    const current = dirty ? await doSave() : saved;
    if (!current) return;
    const res = await copy(current.id);
    if (res.ok) showToast('Cópia criada na biblioteca.', 'success');
    else showToast(res.error, 'error');
  }

  async function onExport() {
    const ok = await exporter.run({ name, grid, kind, imageUrl: saved.imageUrl, paint: paintRef.current, showGrid: gridVisible });
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error');
  }

  async function onDelete() {
    setConfirmDelete(false);
    if (await remove(saved.id)) {
      leavingRef.current = true;
      showToast('Mapa excluído.', 'success');
      router.replace('/mapas' as any);
    } else showToast('Não foi possível excluir o mapa.', 'error');
  }

  const leave = () => router.back();
  const terrains = TERRAINS.filter((t) => t.group === group);
  const paintId = tool.kind === 'paint' ? tool.id : null;

  // O mapa cabe inteiro na área de edição com zoom 1; com zoom maior a área rola (botão "Mover")
  const { w: mw, h: mh } = mapSize(grid);
  const fitW = stage.w > 0 && stage.h > 0 ? Math.max(40, Math.min(stage.w - 8, ((stage.h - 8) * mw) / mh)) : 0;
  const mapW = fitW * zoom;
  const canScroll = pan || preview;
  const zoomIdx = ZOOMS.indexOf(zoom);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Editor de mapa" onBack={leave} rightIcon="save" onRightPress={dirty && !saving ? onSave : undefined} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{name}{dirty ? ' •' : ''}</Text>
        <IconBtn icon="edit" label="Renomear mapa" onPress={() => setRenaming(true)} />
        <IconBtn icon="content-copy" label="Duplicar mapa" onPress={onDuplicate} />
        <IconBtn icon="visibility" label="Visualizar como jogador" on={preview} onPress={() => setPreview((p) => !p)} />
        <IconBtn icon="delete-outline" label="Excluir mapa" onPress={() => setConfirmDelete(true)} />
      </View>

      <View onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ flex: 1, minHeight: 180, backgroundColor: COLORS.surfaceContainerHigh, marginHorizontal: 8, borderRadius: 12, overflow: 'hidden' }}>
        {fitW > 0 && (
          <ScrollView scrollEnabled={canScroll} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} nestedScrollEnabled>
            <ScrollView horizontal scrollEnabled={canScroll} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 4 }} nestedScrollEnabled>
              <MapView grid={grid} kind={kind} imageUrl={saved.imageUrl} paint={paintRef.current} rev={rev} showGrid={gridVisible} fogEnabled={fogEnabled}
                fogView={preview ? 'play' : 'edit'} width={mapW} brush={brush} onStroke={preview || pan ? undefined : onStroke} label={`Mapa ${name}`} />
            </ScrollView>
          </ScrollView>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, flexWrap: 'wrap' }}>
        <IconBtn icon="undo" label="Desfazer" disabled={undo.current.length === 0} onPress={doUndo} />
        <IconBtn icon="redo" label="Refazer" disabled={redo.current.length === 0} onPress={doRedo} />
        <IconBtn icon="remove" label="Diminuir zoom" disabled={zoom <= ZOOMS[0]} onPress={() => setZoom(ZOOMS[Math.max(0, zoomIdx - 1)])} />
        <Pressable onPress={() => setZoom(1)} accessibilityLabel="Ajustar à tela" style={{ minWidth: 52, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(13) }}>{Math.round(zoom * 100)}%</Text>
        </Pressable>
        <IconBtn icon="add" label="Aumentar zoom" disabled={zoom >= ZOOMS[ZOOMS.length - 1]} onPress={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, zoomIdx + 1)])} />
        <IconBtn icon="pan-tool" label="Mover o mapa" on={pan && !preview} disabled={preview || zoom === 1} onPress={() => setPan((p) => !p)} />
        {preview && <Text style={{ flexBasis: '100%', color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>Visão do jogador · toque no olho para voltar a editar</Text>}
      </View>

      <ScrollView style={{ maxHeight: screenH * 0.38 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GROUPS.map((g) => <Chip key={g.id} label={g.label} on={group === g.id} onPress={() => setGroup(g.id)} />)}
        </View>
        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(17) }}>{group === 'general' ? 'Peças' : GROUPS.find((g) => g.id === group)?.label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {terrains.map((t: Terrain) => (
            <Pressable key={t.id} onPress={() => setTool({ kind: 'paint', id: t.id })} accessibilityRole="button" accessibilityLabel={t.label} accessibilityState={{ selected: paintId === t.id }}
              style={{ width: '22%', alignItems: 'center', gap: 4, padding: 6, borderRadius: 10, borderWidth: paintId === t.id ? 2 : 1, borderColor: paintId === t.id ? COLORS.primary : COLORS.outlineVariant }}>
              <TerrainSample t={t} size={48} />
              <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(11) }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        <Btn label="Borracha" kind={tool.kind === 'erase' ? 'primary' : 'outline'} onPress={() => setTool({ kind: 'erase' })} />

        <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Tamanho do pincel: {brush}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => <Chip key={n} label={String(n)} accessibilityLabel={`Pincel ${n}`} on={brush === n} onPress={() => setBrush(n)} />)}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>Grade</Text>
          <Switch value={gridVisible} onValueChange={setGridVisible} accessibilityLabel="Grade" trackColor={{ true: COLORS.primary }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>Névoa de guerra</Text>
          <Switch value={fogEnabled} onValueChange={toggleFog} accessibilityLabel="Névoa de guerra" trackColor={{ true: COLORS.primary }} />
        </View>
        {fogEnabled && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Btn label="Revelar" kind={tool.kind === 'reveal' ? 'primary' : 'outline'} onPress={() => setTool({ kind: 'reveal' })} /></View>
              <View style={{ flex: 1 }}><Btn label="Cobrir" kind={tool.kind === 'cover' ? 'primary' : 'outline'} onPress={() => setTool({ kind: 'cover' })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Btn label="Revelar tudo" onPress={() => fillFog(true)} /></View>
              <View style={{ flex: 1 }}><Btn label="Cobrir tudo" onPress={() => fillFog(false)} /></View>
            </View>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: COLORS.outlineVariant }} />
        <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Tipo</Text>
        <Select title="Tipo" value={kindLabelOf(kind)} options={KINDS.map((k) => k.label)} onChange={(v) => setKind(KINDS.find((k) => k.label === v)?.id ?? kind)} />
        <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Formato</Text>
        <Select title="Formato" value={gridLabelOf(gridType)} options={GRID_TYPES.map((g) => g.label)} onChange={(v) => setGridType(GRID_TYPES.find((g) => g.label === v)?.id ?? gridType)} />
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{saved.cols} × {saved.rows} células</Text>

        <Btn label={saved.published ? 'Remover da Oficina' : 'Publicar na Oficina'} disabled={saving} onPress={onPublish} />
        <Btn label="Exportar PNG" disabled={exporter.busy} onPress={onExport} />
        <Btn label={saving ? '…' : 'Salvar mapa'} kind="primary" disabled={saving || !dirty} onPress={onSave} />
        <Btn label="Sair do editor" onPress={leave} />
      </ScrollView>

      {renaming && <RenameMapModal name={name} onSave={(n) => { setName(n); setRenaming(false); }} onClose={() => setRenaming(false)} />}
      <ConfirmDialog visible={confirmDelete} danger title="Excluir mapa?" message={`"${name}" será apagado da sua biblioteca. Isso não pode ser desfeito.`}
        confirmLabel="Excluir" onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} />
      <ConfirmDialog visible={!!leaveAction} danger title="Descartar alterações?" message="As alterações deste mapa ainda não foram salvas." confirmLabel="Descartar" cancelLabel="Continuar editando"
        onCancel={() => setLeaveAction(null)}
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); leavingRef.current = true; (navigation as any).dispatch(a); }} />
      {exporter.host}
    </SafeAreaView>
  );
}
