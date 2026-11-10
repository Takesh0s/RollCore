import { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Image as SvgImage, Path, Rect } from 'react-native-svg';
import { baseColor, buildShapes, cellAt, cellsInBrush, mapSize, markPrims, type Grid, type MapKind, type Painting, type Terrain } from '../../lib/maps';
import { imageSrc } from '../../lib/mapImage';

export interface StrokeEvent { phase: 'start' | 'move' | 'end'; cells: number[] }

interface Props {
  grid: Grid;
  kind: MapKind;
  imageUrl: string | null;
  paint: Painting;
  /** Muda a cada alteração da pintura, para redesenhar (a pintura é mutável). */
  rev?: number;
  showGrid: boolean;
  fogEnabled: boolean;
  fogView?: 'edit' | 'play';
  /** Largura em pixels; a altura segue a proporção do mapa. */
  width: number;
  /** Tamanho do pincel em células; com `onStroke` o mapa vira uma área de pintura. */
  brush?: number;
  onStroke?: (e: StrokeEvent) => void;
  label: string;
}

/** O mapa em SVG. Só leitura por padrão (miniaturas, visualização); com `onStroke`, arrastar o dedo pinta. */
export function MapView({ grid, kind, imageUrl, paint, rev = 0, showGrid, fogEnabled, fogView = 'edit', width, brush = 1, onStroke, label }: Props) {
  const { w, h } = mapSize(grid);
  const height = (width * h) / w;
  const src = imageSrc(imageUrl);

  const shapes = useMemo(
    () => buildShapes({ grid, kind, hasImage: !!src, paint, showGrid, fogEnabled, fogView }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grid.type, grid.cols, grid.rows, grid.cell, kind, !!src, showGrid, fogEnabled, fogView, rev, paint],
  );

  // Os callbacks do PanResponder são criados uma vez; os valores atuais vêm por ref.
  const live = useRef({ grid, brush, onStroke, width, w });
  live.current = { grid, brush, onStroke, width, w };
  const start = useRef({ x: 0, y: 0 });
  const last = useRef<{ x: number; y: number } | null>(null);

  const cellsAlong = (to: { x: number; y: number }, from: { x: number; y: number } | null) => {
    const { grid: g, brush: b } = live.current;
    const found = new Set<number>();
    const steps = from ? Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (g.cell / 2))) : 1;
    for (let i = 1; i <= steps; i++) {
      const p = from ? { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps } : to;
      cellsInBrush(g, cellAt(g, p.x, p.y), b).forEach((c) => found.add(c));
    }
    return [...found];
  };

  const toMap = (px: number, py: number) => {
    const k = live.current.w / live.current.width;
    return { x: px * k, y: py * k };
  };

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!live.current.onStroke,
    onMoveShouldSetPanResponder: () => !!live.current.onStroke,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      start.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
      const p = toMap(start.current.x, start.current.y);
      last.current = p;
      live.current.onStroke?.({ phase: 'start', cells: cellsAlong(p, null) });
    },
    onPanResponderMove: (_e, g) => {
      const p = toMap(start.current.x + g.dx, start.current.y + g.dy);
      live.current.onStroke?.({ phase: 'move', cells: cellsAlong(p, last.current) });
      last.current = p;
    },
    onPanResponderRelease: () => { last.current = null; live.current.onStroke?.({ phase: 'end', cells: [] }); },
    onPanResponderTerminate: () => { last.current = null; live.current.onStroke?.({ phase: 'end', cells: [] }); },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  return (
    <View
      accessible accessibilityRole="image" accessibilityLabel={label}
      style={{ width, height }}
      {...(onStroke ? responder.panHandlers : {})}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
        <Rect x={0} y={0} width={w} height={h} fill={baseColor(kind)} />
        {src && <SvgImage href={{ uri: src }} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />}
        {shapes.map((s) => (
          <Path key={s.key} d={s.d} fill={s.fill ?? 'none'} fillOpacity={s.fillOpacity} stroke={s.stroke ?? 'none'} strokeWidth={s.sw || undefined}
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </View>
  );
}

/** Miniatura estática de um mapa (cartões da biblioteca e da Oficina). */
export function MapThumb({ width, ...rest }: Omit<Props, 'rev' | 'brush' | 'onStroke' | 'fogView'>) {
  return <MapView {...rest} width={width} fogEnabled={false} />;
}

/** Amostra de um terreno (paleta do editor): o mesmo desenho do mapa, numa célula quadrada. */
export function TerrainSample({ t, size }: { t: Terrain; size: number }) {
  const prims = markPrims(t, size / 2, size / 2, size * 0.9);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={t.group === 'general' && !t.fill ? 'rgba(255,255,255,0.08)' : t.color} />
      {prims.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill ?? 'none'} stroke={p.stroke ?? 'none'} strokeWidth={p.sw || undefined} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
