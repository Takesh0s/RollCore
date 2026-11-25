import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeArea as SafeAreaView } from '../components/SafeArea';
import { Select, StateBlock } from '../components/Controls';
import { PillBtn } from '../components/tables/parts';
import { MapCardFrame, SearchBox } from '../components/maps/MapParts';
import { MapPreviewModal, gridOf, mapSummary, usePaintOf } from '../components/maps/MapModals';
import { MapThumb } from '../components/maps/MapView';
import { COLORS, Header } from '../design/shared';
import { KINDS, type MapKind } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { useMaps, type MapItem } from '../store/useMaps';
import { showToast } from '../store/useToast';
import { kindFromLabel, kindOptions } from './MapasScreen';

function WorkshopCard({ map, width, busy, onView, onAdd, onEdit }: { map: MapItem; width: number; busy: boolean; onView: () => void; onAdd: () => void; onEdit: () => void }) {
  const paint = usePaintOf(map);
  return (
    <MapCardFrame label={`Mapa ${map.name}`} name={map.name} meta={[mapSummary(map), map.mine ? 'Publicado por você' : `por ${map.authorName}`]}
      thumb={<MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} showGrid={false} fogEnabled={false} width={width} label={`Prévia de ${map.name}`} />}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          {map.mine ? <PillBtn block kind="primary" label="Editar mapa" onPress={onEdit} /> : <PillBtn block kind="primary" label="Usar este mapa" disabled={busy} onPress={onAdd} />}
        </View>
        <View style={{ flex: 1 }}><PillBtn block label="Visualizar" accessibilityLabel={`Visualizar ${map.name}`} onPress={onView} /></View>
      </View>
    </MapCardFrame>
  );
}

/**
 * Oficina da Comunidade: mapas que outros mestres publicaram. "Usar este mapa" copia para a sua
 * biblioteca (a cópia é sua, pode ser editada à vontade); o original não muda.
 */
export default function OficinaMapasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const { community, loading, failed, loadCommunity, copy } = useMaps();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<MapKind | ''>('');
  const [viewing, setViewing] = useState<MapItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const thumbW = Math.min(screenW, 560) - 32 - 22;

  // busca com um pequeno atraso para não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => { void loadCommunity(query.trim(), kind).then(() => setSearched(true)); }, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [query, kind, loadCommunity]);

  async function add(m: MapItem) {
    setBusy(true);
    const res = await copy(m.id);
    setBusy(false);
    if (!res.ok) { showToast(res.error, 'error'); return; }
    setViewing(null);
    showToast('Mapa adicionado à sua biblioteca.', 'success');
    router.push(`/mapa-editor?id=${res.map.id}` as any);
  }
  const editMine = (m: MapItem) => router.push(`/mapa-editor?id=${m.id}` as any);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Oficina de mapas" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 10 }}>
          <SearchBox value={query} onChangeText={setQuery} placeholder="Buscar mapa" label="Buscar mapa na Oficina" />
          <Select title="Filtrar por tipo" value={KINDS.find((k) => k.id === kind)?.label ?? ''} options={kindOptions} placeholder="Todos os tipos" allowClear compact
            onChange={(v) => setKind(kindFromLabel(v))} />
        </View>

        {!searched && loading && <StateBlock icon="hourglass-empty" title="Carregando a Oficina…" />}
        {failed && searched && community.length === 0 && <StateBlock icon="cloud-off" title="Não foi possível carregar a Oficina" text="Tente novamente mais tarde." />}
        {searched && !loading && !failed && community.length === 0 && (
          query || kind
            ? <StateBlock icon="search-off" title="Nada encontrado" text="Nenhum mapa publicado combina com a busca." actionLabel="Limpar filtros" onAction={() => { setQuery(''); setKind(''); }} />
            : <StateBlock icon="map" title="A Oficina está vazia" text="Publique um dos seus mapas pelo editor ou pelo botão Gerenciar para ele aparecer aqui."
                actionLabel="Voltar aos meus mapas" onAction={() => router.back()} />
        )}
        {community.map((m) => (
          <WorkshopCard key={m.id} map={m} width={thumbW} busy={busy} onView={() => setViewing(m)} onAdd={() => add(m)} onEdit={() => editMine(m)} />
        ))}
      </ScrollView>

      {viewing && (
        <MapPreviewModal map={viewing} width={Math.min(screenW, 560) - 36} onClose={() => setViewing(null)}>
          <View style={{ gap: 10 }}>
            <PillBtn block pill={false} label="Fechar" onPress={() => setViewing(null)} />
            {!viewing.mine && <PillBtn block pill={false} kind="primary" label="Usar este mapa" disabled={busy} onPress={() => add(viewing)} />}
          </View>
        </MapPreviewModal>
      )}
    </SafeAreaView>
  );
}
