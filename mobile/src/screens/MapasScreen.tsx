import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { Select, StateBlock, inputStyle } from '../components/Controls';
import { BODY, BOLD, Btn, ManageMapModal, SERIF, gridOf, mapSummary, usePaintOf } from '../components/maps/MapModals';
import { useMapExport } from '../components/maps/exportMap';
import { MapThumb } from '../components/maps/MapView';
import { COLORS, Card, appFontSize } from '../design/shared';
import { decodeLayers, KINDS, type MapKind } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { showToast } from '../store/useToast';
import { useMaps, type MapItem } from '../store/useMaps';

export const kindOptions = KINDS.map((k) => k.label);
export const kindFromLabel = (label: string): MapKind | '' => KINDS.find((k) => k.label === label)?.id ?? '';

function MapCard({ map, width, onEdit, onManage, onExport }: { map: MapItem; width: number; onEdit: () => void; onManage: () => void; onExport: () => void }) {
  const paint = usePaintOf(map);
  return (
    <Card>
      <View accessibilityLabel={`Mapa ${map.name}`} style={{ gap: 10 }}>
        <View style={{ alignItems: 'center', borderRadius: 10, overflow: 'hidden' }}>
          <MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} showGrid={false} fogEnabled={false} width={width} label={`Prévia de ${map.name}`} />
        </View>
        <Text numberOfLines={2} style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{map.name}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{mapSummary(map)}{map.published ? ' · Na Oficina' : ''}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Editar mapa" kind="primary" onPress={onEdit} /></View>
          <View style={{ flex: 1 }}><Btn label="Gerenciar" accessibilityLabel={`Gerenciar ${map.name}`} onPress={onManage} /></View>
        </View>
        <Btn label="Exportar PNG" onPress={onExport} />
      </View>
    </Card>
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
  const thumbW = Math.min(screenW, 560) - 32 - 30;

  const open = (id: string) => router.push(`/mapa-editor?id=${id}` as any);
  const exportMap = async (m: MapItem) => {
    const ok = await exporter.run({ name: m.name, grid: gridOf(m), kind: m.kind, imageUrl: m.imageUrl, paint: decodeLayers(m.layers, m.cols, m.rows), showGrid: m.gridVisible });
    if (!ok) showToast('Não foi possível exportar o mapa.', 'error');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Lista de mapas" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle() }}>
          <MaterialIcons name="search" size={20} color={COLORS.fieldText} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar mapa" placeholderTextColor={COLORS.placeholder} accessibilityLabel="Buscar mapa"
            style={{ flex: 1, color: COLORS.fieldText, fontFamily: BODY, fontSize: appFontSize(16) }} returnKeyType="search" />
        </View>
        <Select title="Filtrar por tipo" value={KINDS.find((k) => k.id === kind)?.label ?? ''} options={kindOptions} placeholder="Todos os tipos" allowClear
          onChange={(v) => setKind(kindFromLabel(v))} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Btn label="Oficina da Comunidade" onPress={() => router.push('/oficina-mapas' as any)} /></View>
          <View style={{ flex: 1 }}><Btn label="+ Adicionar mapa" kind="primary" onPress={() => router.push('/mapa-novo' as any)} /></View>
        </View>

        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>Biblioteca de mapas</Text>

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
            style={{ minHeight: 96, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(28) }}>+</Text>
            <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Criar novo mapa</Text>
          </Pressable>
        )}
      </ScrollView>
      {managed && <ManageMapModal map={managed} onClose={() => setManaging(null)} onExport={exportMap} />}
      {exporter.host}
    </SafeAreaView>
  );
}
