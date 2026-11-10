import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { Select, StateBlock, inputStyle } from '../components/Controls';
import { BODY, Btn, MapPreviewModal, SERIF, gridOf, mapSummary, usePaintOf } from '../components/maps/MapModals';
import { MapThumb } from '../components/maps/MapView';
import { COLORS, Card, Header, appFontSize } from '../design/shared';
import { KINDS, type MapKind } from '../lib/maps';
import { useAcessibilidade } from '../store/acessibilidade';
import { useMaps, type MapItem } from '../store/useMaps';
import { showToast } from '../store/useToast';
import { kindFromLabel, kindOptions } from './MapasScreen';

function WorkshopCard({ map, width, busy, onView, onAdd, onEdit }: { map: MapItem; width: number; busy: boolean; onView: () => void; onAdd: () => void; onEdit: () => void }) {
  const paint = usePaintOf(map);
  return (
    <Card>
      <View accessibilityLabel={`Mapa ${map.name}`} style={{ gap: 10 }}>
        <View style={{ alignItems: 'center', borderRadius: 10, overflow: 'hidden' }}>
          <MapThumb grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} showGrid={false} fogEnabled={false} width={width} label={`Prévia de ${map.name}`} />
        </View>
        <Text numberOfLines={2} style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>{map.name}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{mapSummary(map)}</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{map.mine ? 'Publicado por você' : `por ${map.authorName}`}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            {map.mine ? <Btn label="Editar mapa" kind="primary" onPress={onEdit} /> : <Btn label="Usar este mapa" kind="primary" disabled={busy} onPress={onAdd} />}
          </View>
          <View style={{ flex: 1 }}><Btn label="Visualizar" accessibilityLabel={`Visualizar ${map.name}`} onPress={onView} /></View>
        </View>
      </View>
    </Card>
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
  const thumbW = Math.min(screenW, 560) - 32 - 30;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle() }}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar mapa" placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel="Buscar mapa na Oficina"
            style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(16) }} returnKeyType="search" />
        </View>
        <Select title="Filtrar por tipo" value={KINDS.find((k) => k.id === kind)?.label ?? ''} options={kindOptions} placeholder="Todos os tipos" allowClear
          onChange={(v) => setKind(kindFromLabel(v))} />

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
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Btn label="Fechar" onPress={() => setViewing(null)} />
            {!viewing.mine && <Btn label="Usar este mapa" kind="primary" disabled={busy} onPress={() => add(viewing)} />}
          </View>
        </MapPreviewModal>
      )}
    </SafeAreaView>
  );
}
