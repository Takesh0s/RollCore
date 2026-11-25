import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { Select, StateBlock } from '../components/Controls';
import { PillBtn, RuleTitle } from '../components/tables/parts';
import { MapCardFrame, SearchBox } from '../components/maps/MapParts';
import { BODY, ManageMapModal, gridOf, mapSummary, usePaintOf } from '../components/maps/MapModals';
import { useMapExport } from '../components/maps/exportMap';
import { MapThumb } from '../components/maps/MapView';
import { COLORS, appFontSize } from '../design/shared';
import { decodeLayers, KINDS, type MapKind } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { showToast } from '../store/useToast';
import { useMaps, type MapItem } from '../store/useMaps';

export const kindOptions = KINDS.map((k) => k.label);
export const kindFromLabel = (label: string): MapKind | '' => KINDS.find((k) => k.label === label)?.id ?? '';

function MapCard({ map, width, onEdit, onManage, onExport }: { map: MapItem; width: number; onEdit: () => void; onManage: () => void; onExport: () => void }) {
  const paint = usePaintOf(map);
  return (
    <MapCardFrame label={`Mapa ${map.name}`} name={map.name} meta={[`${mapSummary(map)}${map.published ? ' · Na Oficina' : ''}`]}
      thumb={<MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} showGrid={false} fogEnabled={false} width={width} label={`Prévia de ${map.name}`} />}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><PillBtn block kind="primary" label="Editar mapa" onPress={onEdit} /></View>
        <View style={{ flex: 1 }}><PillBtn block label="Gerenciar" accessibilityLabel={`Gerenciar ${map.name}`} onPress={onManage} /></View>
      </View>
      <PillBtn block label="Exportar PNG" onPress={onExport} />
    </MapCardFrame>
  );
}

/**
 * Lista de mapas (mesma da web): biblioteca do mestre com busca por nome e tipo, "Adicionar mapa",
 * "Criar novo mapa" e o caminho para a Oficina da Comunidade.
 */
export default function MapasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const { maps, loading, loaded, failed, load } = useMaps();
  const exporter = useMapExport();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<MapKind | ''>('');
  const [managing, setManaging] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => maps.filter((m) => (!kind || m.kind === kind) && (!q || m.name.toLowerCase().includes(q))), [maps, q, kind]);
  const managed = maps.find((m) => m.id === managing) ?? null;
  const thumbW = Math.min(screenW, 560) - 32 - 22;

  const open = (id: string) => router.push(`/mapa-editor?id=${id}` as any);
  const exportMap = async (m: MapItem) => {
    const ok = await exporter.run({ name: m.name, grid: gridOf(m), kind: m.kind, imageUrl: m.imageUrl, paint: decodeLayers(m.layers, m.cols, m.rows), showGrid: m.gridVisible });
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Lista de mapas" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 10 }}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar mapa" label="Buscar mapa" />
          <Select title="Filtrar por tipo" value={KINDS.find((k) => k.id === kind)?.label ?? ''} options={kindOptions} placeholder="Todos os tipos" allowClear compact
            onChange={(v) => setKind(kindFromLabel(v))} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <PillBtn label="Oficina da Comunidade" onPress={() => router.push('/oficina-mapas' as any)} />
            <PillBtn kind="primary" label="+ Adicionar mapa" onPress={() => router.push('/mapa-novo' as any)} />
          </View>
        </View>

        <RuleTitle>Biblioteca de mapas</RuleTitle>

        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando seus mapas…" />}
        {failed && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar os mapas" text="Tente novamente mais tarde." actionLabel="Tentar de novo" onAction={load} />}
        {loaded && maps.length === 0 && (
          <StateBlock icon="map" title="Nenhum mapa ainda" text="Crie um mapa do zero, envie uma imagem sua ou pegue um da Oficina da Comunidade."
            actionLabel="Criar mapa" onAction={() => router.push('/mapa-novo' as any)} />
        )}
        {loaded && maps.length > 0 && shown.length === 0 && (
          <StateBlock icon="search-off" title="Nada encontrado" text="Tente outros termos ou outro tipo de mapa." actionLabel="Limpar filtros" onAction={() => { setQuery(''); setKind(''); }} />
        )}
        {shown.map((m) => (
          <MapCard key={m.id} map={m} width={thumbW} onEdit={() => open(m.id)} onManage={() => setManaging(m.id)} onExport={() => exportMap(m)} />
        ))}
        {loaded && maps.length > 0 && (
          <Pressable onPress={() => router.push('/mapa-novo' as any)} accessibilityRole="button" accessibilityLabel="Criar novo mapa"
            style={{ minHeight: 110, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(40), lineHeight: appFontSize(44) }}>+</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Criar novo mapa</Text>
          </Pressable>
        )}
      </ScrollView>
      {managed && <ManageMapModal map={managed} onClose={() => setManaging(null)} onExport={exportMap} />}
      {exporter.host}
    </SafeAreaView>
  );
}
