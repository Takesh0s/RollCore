import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Path, Pattern, Rect, SvgXml } from 'react-native-svg';
import { BAND, FRAME_SIDE, FRAME_TOP } from '../design/frame';
import { resolvedThemeMode } from '../design/shared';
import { GEAR_BAND, GEAR_CORNER, LIGHT_ART, TERROR_BLOOD, TERROR_TAG } from '../design/themeArt';
import { useAcessibilidade } from '../store/acessibilidade';

/**
 * Os frames do Figma têm 412 x 917, mas os aparelhos variam. As peças ficam ancoradas na moldura (a mesma do Frame em _layout:
 * 18 px dos lados, 40 px do topo, faixa de 50 px embaixo) ou em uma borda da tela e se esticam no que sobrar.
 */
interface Box { w: number; h: number; left: number; right: number; top: number; bottom: number }

/** Terror (Figma "Terror Mobile"): etiqueta de dossiê, rastro de sangue no topo e respingos na base. */
function Terror({ box, light, statusBar }: { box: Box; light: boolean; statusBar: number }) {
  // O mesmo desenho (401 x 850) vale para as duas pontas: o topo mostra só as gotas e a base só os respingos.
  const blood = light ? LIGHT_ART.terrorBlood : TERROR_BLOOD;
  const top = blood.replace('width="401" height="850" viewBox="0 0 401 850"', 'width="401" height="80" viewBox="0 0 401 80"');
  const bottom = blood.replace('width="401" height="850" viewBox="0 0 401 850"', 'width="341" height="115" viewBox="60 735 341 115"');
  // No Figma a etiqueta fica na área da barra de status; no aparelho ela desce para logo abaixo dela, sempre dentro dos 40 px do topo.
  const tagTop = Math.min(FRAME_TOP - 20, Math.max(12, statusBar - 4));
  return (
    <>
      <View style={{ position: 'absolute', left: 10, top: 37 }}><SvgXml xml={top} width={box.w - 11} height={80} preserveAspectRatio="none" /></View>
      <View style={{ position: 'absolute', right: 1, bottom: 30 }}><SvgXml xml={bottom} width={341} height={115} /></View>
      <View style={{ position: 'absolute', left: FRAME_SIDE, top: tagTop }}><SvgXml xml={light ? LIGHT_ART.terrorTag : TERROR_TAG} width={150} height={20} /></View>
    </>
  );
}

/** Cantos HUD nas pontas da moldura: em cima à esquerda e embaixo à direita. */
function Corners({ box, size, thick, tl, br }: { box: Box; size: number; thick: number; tl: string; br: string }) {
  const bar = (style: object, color: string) => <View style={[{ position: 'absolute', backgroundColor: color }, style]} />;
  return (
    <>
      {bar({ left: box.left, top: box.top, width: thick, height: size }, tl)}
      {bar({ left: box.left, top: box.top, width: size, height: thick }, tl)}
      {bar({ right: box.w - box.right, bottom: box.h - box.bottom, width: thick, height: size }, br)}
      {bar({ right: box.w - box.right, bottom: box.h - box.bottom, width: size, height: thick }, br)}
    </>
  );
}

/** Steampunk (Figma "Steampunk Mobile"): engrenagens nas quatro pontas da moldura e na faixa de baixo, rebites ao longo da borda. */
function Steampunk({ box, light }: { box: Box; light: boolean }) {
  const c = light ? { a: '#B5651D', b: '#8A6A1A', ink: '#ECE4D3' } : { a: '#CF7A3A', b: '#D9A441', ink: '#15181B' };
  const { w, h, left, right, top } = box;
  const bottom = box.bottom + 1;
  const gear = (g: typeof GEAR_BAND, x: number, y: number, fill: string, hub: number, ring: number, key: string) => (
    <G key={key} transform={`translate(${x - g.cx} ${y - g.cy})`}>
      <Path d={g.d} fill={fill} />
      <Circle cx={g.cx} cy={g.cy} r={hub} fill={c.ink} />
      <Circle cx={g.cx} cy={g.cy} r={ring} stroke={c.ink} strokeOpacity={0.55} strokeWidth={1.5} fill="none" />
    </G>
  );
  const rivet = (x: number, y: number, key: string) => <Circle key={key} cx={x} cy={y} r={3} fill={c.b} stroke={c.ink} strokeWidth={1} />;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      {[1, 2, 3, 4].map((i) => rivet(left + ((right - left) * i) / 5, top, `t${i}`))}
      {[1, 2, 3, 4].map((i) => rivet(left + ((right - left) * i) / 5, bottom, `b${i}`))}
      {[1, 2, 3].map((j) => rivet(left, top + ((bottom - top) * j) / 4, `l${j}`))}
      {[1, 2, 3].map((j) => rivet(right, top + ((bottom - top) * j) / 4, `r${j}`))}
      {[0, 1, 2, 3, 4].map((i) => gear(GEAR_BAND, 20.5 + (i * (w - 40.5)) / 4, h - 20.5, i % 2 ? c.b : c.a, 5.25, 9, `g${i}`))}
      {gear(GEAR_CORNER, left, top, c.b, 5.95, 10.3, 'tl')}
      {gear(GEAR_CORNER, right, top, c.a, 5.95, 10.3, 'tr')}
      {gear(GEAR_CORNER, left, bottom, c.b, 5.95, 10.3, 'bl')}
      {gear(GEAR_CORNER, right, bottom, c.a, 5.95, 10.3, 'br')}
    </Svg>
  );
}

/** Pergaminho (Figma "Pergaminho Mobile"): filete dourado por dentro da borda e losangos nas quatro pontas. */
function Pergaminho({ box, light }: { box: Box; light: boolean }) {
  const { w, h, left, right, top, bottom } = box;
  const gold = light ? '#8C7650' : '#C9A13B';
  const diamond = light ? '#8A2B14' : '#C9A13B';
  const dia = (cx: number, cy: number, key: string) => (
    <Rect key={key} x={-5.5} y={-5.5} width={11} height={11} fill={diamond} transform={`translate(${cx} ${cy}) rotate(45)`} />
  );
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Rect x={left + 7.5} y={top + 7.5} width={right - left - 15} height={bottom - top - 14} rx={1.5} fill="none" stroke={gold} strokeOpacity={0.55} strokeWidth={1} />
      {dia(left + 9.3, top + 1.5, 'tl')}
      {dia(right - 4.7, top + 1.5, 'tr')}
      {dia(left + 9.3, bottom - 11.5, 'bl')}
      {dia(right - 4.7, bottom - 11.5, 'br')}
    </Svg>
  );
}

/** Cyberpunk (cyberpunk.css, sem página no Figma): linhas de varredura e colchetes HUD amarelo (em cima) e ciano (embaixo). */
function Hud({ box, light }: { box: Box; light: boolean }) {
  const yellow = light ? '#B8AC00' : '#FCEE0A';
  const cyan = light ? '#00717F' : '#02D7F2';
  return (
    <>
      <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="scan" width={box.w} height={3} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={box.w} height={1} fill={light ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.035)'} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={box.w} height={box.h} fill="url(#scan)" />
      </Svg>
      <Corners box={box} size={34} thick={3} tl={yellow} br={cyan} />
    </>
  );
}

/**
 * Enfeites de cada tema, como nas páginas de tema do Figma mobile (Cyberpunk, que não tem página, segue o CSS do web).
 * Ficam por cima de tudo e não recebem toque. Medieval não tem enfeite; o Modo Daltônico também não usa nenhum.
 */
export function ThemeDecor() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tema, daltonico } = useAcessibilidade(); // modoTema também vem do store: a troca de modo refaz o componente
  if (daltonico) return null;
  const light = resolvedThemeMode() === 'light';
  const box: Box = { w: width, h: height, left: FRAME_SIDE, right: width - FRAME_SIDE, top: FRAME_TOP, bottom: height - BAND };
  const cyan = light ? '#0094A8' : '#00F0FF';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tema === 'terror' ? <Terror box={box} light={light} statusBar={insets.top} />
        : tema === 'neon' ? <Corners box={box} size={28} thick={2} tl={cyan} br={cyan} />
        : tema === 'steampunk' ? <Steampunk box={box} light={light} />
        : tema === 'pergaminho' ? <Pergaminho box={box} light={light} />
        : tema === 'cyberpunk' ? <Hud box={box} light={light} />
        : null}
    </View>
  );
}
