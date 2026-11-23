import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, SvgXml } from 'react-native-svg';
import { LIGHT_ART, PERGAMINHO_FRAME, STEAMPUNK_GEARS, TERROR_BLOOD, TERROR_TAG } from '../design/themeArt';
import { resolvedThemeMode } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';


/** Os frames do Figma têm 412 x 917: as peças ficam coladas ao topo ou à base e se esticam na altura que sobrar. */
const FIGMA_H = 917;

/** Terror (Figma "Terror Mobile"): etiqueta de dossiê, rastro de sangue no topo e respingos na base. */
function Terror({ height, light }: { height: number; light: boolean }) {
  // O mesmo desenho (401 x 850) vale para as duas pontas: o topo mostra só as gotas e a base só os respingos.
  const blood = light ? LIGHT_ART.terrorBlood : TERROR_BLOOD;
  const top = blood.replace('width="401" height="850" viewBox="0 0 401 850"', 'width="401" height="80" viewBox="0 0 401 80"');
  const bottom = blood.replace('width="401" height="850" viewBox="0 0 401 850"', 'width="341" height="115" viewBox="60 735 341 115"');
  return (
    <>
      <View style={{ position: 'absolute', left: 10, top: 37 }}><SvgXml xml={top} width={401} height={80} /></View>
      <View style={{ position: 'absolute', left: 70, bottom: height - 887 }}><SvgXml xml={bottom} width={341} height={115} /></View>
      <View style={{ position: 'absolute', left: 18, top: 12 }}><SvgXml xml={light ? LIGHT_ART.terrorTag : TERROR_TAG} width={150} height={20} /></View>
    </>
  );
}

/** Neon (Figma "Neon Mobile"): cantos HUD ciano de 28 px em cima à esquerda e embaixo à direita (no claro, um ciano mais escuro para ter contraste). */
function NeonCorners({ light }: { light: boolean }) {
  const bar = (style: object) => <View style={[{ position: 'absolute', backgroundColor: light ? '#0094A8' : '#00F0FF' }, style]} />;
  return (
    <>
      {bar({ left: 0, top: 0, width: 2, height: 28 })}
      {bar({ left: 0, top: 0, width: 28, height: 2 })}
      {bar({ right: 0, bottom: 0, width: 2, height: 28 })}
      {bar({ right: 0, bottom: 0, width: 28, height: 2 })}
    </>
  );
}

/** Steampunk (Figma "Steampunk Mobile"): engrenagens nos cantos e na base, rebites ao longo da moldura. */
function Steampunk({ height, light }: { height: number; light: boolean }) {
  return (
    <View style={{ position: 'absolute', left: 1, top: 23 }}>
      <SvgXml xml={light ? LIGHT_ART.steampunkGears : STEAMPUNK_GEARS} width={410} height={height - 28} preserveAspectRatio="none" />
    </View>
  );
}

/** Pergaminho (Figma "Pergaminho Mobile"): filete dourado por fora da borda e losangos nos quatro cantos. */
function Pergaminho({ height, light }: { height: number; light: boolean }) {
  return (
    <View style={{ position: 'absolute', left: 19.5, top: 33.7 }}>
      <SvgXml xml={light ? LIGHT_ART.pergaminhoFrame : PERGAMINHO_FRAME} width={377.6} height={height - 87.4} preserveAspectRatio="none" />
    </View>
  );
}

/** Cyberpunk (cyberpunk.css, sem página no Figma): linhas de varredura e colchetes HUD amarelo (em cima) e ciano (embaixo). */
function Hud({ width, height, light }: { width: number; height: number; light: boolean }) {
  const yellow = light ? '#B8AC00' : '#FCEE0A';
  const cyan = light ? '#00717F' : '#02D7F2';
  const bar = (style: object) => <View style={[{ position: 'absolute' }, style]} />;
  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="scan" width={width} height={3} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={width} height={1} fill={light ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.035)'} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#scan)" />
      </Svg>
      {bar({ left: 0, top: 0, width: 34, height: 3, backgroundColor: yellow })}
      {bar({ left: 0, top: 0, width: 3, height: 34, backgroundColor: yellow })}
      {bar({ right: 0, bottom: 0, width: 34, height: 3, backgroundColor: cyan })}
      {bar({ right: 0, bottom: 0, width: 3, height: 34, backgroundColor: cyan })}
    </>
  );
}

/**
 * Enfeites de cada tema, como nas páginas de tema do Figma mobile (Cyberpunk, que não tem página, segue o CSS do web).
 * Ficam por cima de tudo e não recebem toque. Medieval não tem enfeite; o Modo Daltônico também não usa nenhum.
 */
export function ThemeDecor() {
  const { width, height } = useWindowDimensions();
  const { tema, daltonico } = useAcessibilidade(); // modoTema também vem do store: a troca de modo refaz o componente
  if (daltonico) return null;
  const light = resolvedThemeMode() === 'light';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tema === 'terror' ? <Terror height={height} light={light} />
        : tema === 'neon' ? <NeonCorners light={light} />
        : tema === 'steampunk' ? <Steampunk height={height} light={light} />
        : tema === 'pergaminho' ? <Pergaminho height={height} light={light} />
        : tema === 'cyberpunk' ? <Hud width={width} height={height} light={light} />
        : null}
    </View>
  );
}
