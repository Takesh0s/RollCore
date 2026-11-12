import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { Btn, Sheet, inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { decodeLayers, kindLabel, MAX_NAME, type Grid } from '../../lib/maps';
import { showToast } from '../../store/useToast';
import { bodyOf, useMaps, type MapItem } from '../../store/useMaps';
import { MapView } from './MapView';
import { useMapExport } from './exportMap';

export const BODY = 'Inter_400Regular';
export const BOLD = 'Inter_700Bold';
export const SERIF = 'SourceSerif4_700Bold';

export const gridOf = (m: MapItem): Grid => ({ type: m.gridType, cols: m.cols, rows: m.rows, cell: m.cellSize });

/** Mapa decodificado (pintura) para desenhar; recalcula só quando a pintura muda. */
export function usePaintOf(m: MapItem) {
  return useMemo(() => decodeLayers(m.layers, m.cols, m.rows), [m.layers, m.cols, m.rows]);
}

/** Mensagem curta com tipo, formato e tamanho: "Medieval · Hexágonos · 30 × 20". */
export const mapSummary = (m: MapItem) =>
  `${kindLabel(m.kind)} · ${m.gridType === 'HEX' ? 'Hexágonos' : 'Quadrados'} · ${m.cols} × ${m.rows}`;

/** Campo de nome (3 a 100 caracteres) com botões Cancelar / Salvar nome. */
function RenameForm({ name, onSave, onCancel }: { name: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  const trimmed = value.trim();
  const valid = trimmed.length >= 3 && trimmed.length <= MAX_NAME;
  return (
    <>
      <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Nome do mapa</Text>
      <TextInput value={value} onChangeText={setValue} maxLength={MAX_NAME} autoFocus accessibilityLabel="Nome do mapa" style={inputStyle(!valid)}
        onSubmitEditing={() => valid && onSave(trimmed)} />
      {!valid && <Text style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(12) }}>O nome deve ter de 3 a 100 caracteres.</Text>}
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
        <Btn label="Cancelar" onPress={onCancel} />
        <Btn label="Salvar nome" kind="primary" disabled={!valid} onPress={() => onSave(trimmed)} />
      </View>
    </>
  );
}

/** Pede um novo nome (3 a 100 caracteres). */
export function RenameMapModal({ name, onSave, onClose }: { name: string; onSave: (name: string) => void; onClose: () => void }) {
  return <Sheet title="Renomear mapa" onClose={onClose}><RenameForm name={name} onSave={onSave} onCancel={onClose} /></Sheet>;
}

/** "Gerenciar" (biblioteca): renomear, duplicar, publicar na Oficina, exportar e excluir. */
export function ManageMapModal({ map, onClose, onExport }: { map: MapItem; onClose: () => void; onExport: (m: MapItem) => Promise<void> }) {
  const { save, copy, setPublished, remove } = useMaps();
  const [mode, setMode] = useState<'menu' | 'rename' | 'delete'>('menu');
  const [busy, setBusy] = useState(false);

  async function run(job: () => Promise<void>) {
    setBusy(true);
    try { await job(); } finally { setBusy(false); }
  }
  const rename = (name: string) => run(async () => {
    const res = await save(map.id, bodyOf(map, { name }));
    if (res.ok) { setMode('menu'); showToast('Nome atualizado.', 'success'); } else showToast(res.error, 'error');
  });
  const duplicate = () => run(async () => {
    const res = await copy(map.id);
    if (res.ok) { showToast('Cópia criada na biblioteca.', 'success'); onClose(); } else showToast(res.error, 'error');
  });
  const togglePublish = () => run(async () => {
    const res = await setPublished(map.id, !map.published);
    if (res.ok) showToast(map.published ? 'O mapa saiu da Oficina.' : 'Mapa publicado na Oficina da Comunidade.', 'success');
    else showToast(res.error, 'error');
  });
  const exportPng = () => run(async () => { onClose(); await onExport(map); });
  const del = () => run(async () => {
    if (await remove(map.id)) { showToast('Mapa excluído.', 'success'); onClose(); } else showToast('Não foi possível excluir o mapa.', 'error');
  });

  return (
    <Sheet title={mode === 'rename' ? 'Renomear mapa' : mode === 'delete' ? 'Excluir mapa?' : map.name} onClose={onClose}>
      {mode === 'rename' && <RenameForm name={map.name} onSave={rename} onCancel={() => setMode('menu')} />}
      {mode === 'delete' && (
        <>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>{`"${map.name}" será apagado da sua biblioteca. Isso não pode ser desfeito.`}</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Btn label="Cancelar" onPress={() => setMode('menu')} />
            <Btn label="Excluir" kind="danger" disabled={busy} onPress={del} />
          </View>
        </>
      )}
      {mode === 'menu' && (
        <>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{mapSummary(map)}{map.published ? ' · Publicado na Oficina' : ''}</Text>
          <Btn label="Renomear" disabled={busy} onPress={() => setMode('rename')} />
          <Btn label="Duplicar" disabled={busy} onPress={duplicate} />
          <Btn label={map.published ? 'Remover da Oficina' : 'Publicar na Oficina'} disabled={busy} onPress={togglePublish} />
          <Btn label="Exportar PNG" disabled={busy} onPress={exportPng} />
          <Btn label="Excluir mapa" kind="danger" disabled={busy} onPress={() => setMode('delete')} />
        </>
      )}
    </Sheet>
  );
}

/** Visualização grande de um mapa (Oficina da Comunidade), com ações opcionais no rodapé. */
export function MapPreviewModal({ map, width, onClose, children }: { map: MapItem; width: number; onClose: () => void; children?: ReactNode }) {
  const paint = usePaintOf(map);
  return (
    <Sheet title={map.name} onClose={onClose}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{mapSummary(map)} · por {map.authorName}</Text>
      <View style={{ alignItems: 'center' }}>
        <MapView grid={gridOf(map)} kind={map.kind} imageUrl={map.imageUrl} paint={paint} showGrid={map.gridVisible} fogEnabled={false} width={width} label={`Mapa ${map.name}`} />
      </View>
      {children}
    </Sheet>
  );
}

export { Btn, Sheet, useMapExport };
