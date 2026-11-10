import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { imageSrc } from '../../lib/mapImage';
import { mapSize, type Grid, type MapKind, type Painting } from '../../lib/maps';
import { MapView } from './MapView';

export interface ExportJob { name: string; grid: Grid; kind: MapKind; imageUrl: string | null; paint: Painting; showGrid: boolean }

const VIEW_W = 1000;  // largura (dp) do mapa desenhado fora da tela
const OUT_MAX = 2048; // lado maior (px) do PNG gerado

/**
 * "Exportar PNG": desenha o mapa (sem névoa) fora da tela, tira a foto e abre o compartilhamento do aparelho.
 * `run` devolve false se não for possível gerar ou compartilhar; renderize `host` uma vez na tela.
 */
export function useMapExport(): { run: (job: ExportJob) => Promise<boolean>; busy: boolean; host: ReactNode } {
  const [job, setJob] = useState<ExportJob | null>(null);
  const ref = useRef<View>(null);
  const done = useRef<((ok: boolean) => void) | null>(null);

  const run = (j: ExportJob) => new Promise<boolean>((resolve) => { done.current = resolve; setJob(j); });

  useEffect(() => {
    if (!job) return;
    let ok = false;
    (async () => {
      try {
        const src = imageSrc(job.imageUrl);
        if (src) await Image.prefetch(src); // o fundo precisa estar baixado antes da foto
        await new Promise((r) => setTimeout(r, 300));
        const { w, h } = mapSize(job.grid);
        const k = Math.min(1, OUT_MAX / Math.max(w, h));
        const uri = await captureRef(ref, { format: 'png', result: 'tmpfile', width: Math.round(w * k), height: Math.round(h * k) });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: job.name });
          ok = true;
        }
      } catch {
        ok = false;
      }
      setJob(null);
      done.current?.(ok);
    })();
  }, [job]);

  const host = job ? (
    <View ref={ref} collapsable={false} pointerEvents="none" style={{ position: 'absolute', left: -20000, top: 0, width: VIEW_W }}>
      <MapView grid={job.grid} kind={job.kind} imageUrl={job.imageUrl} paint={job.paint} showGrid={job.showGrid} fogEnabled={false} width={VIEW_W} label={`Mapa ${job.name}`} />
    </View>
  ) : null;

  return { run, busy: !!job, host };
}
