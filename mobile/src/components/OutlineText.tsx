import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G as Group, Path } from 'react-native-svg';
import { OUTLINE_FONT } from '../design/outlineGlyphs';

const { unitsPerEm, ascent, descent, glyphs } = OUTLINE_FONT;
type Glyphs = Record<string, readonly [number, string]>;
const G = glyphs as unknown as Glyphs;

/**
 * Texto na fonte Kumar One Outline (marca e títulos do web) desenhado como vetor.
 * A fonte tem só contornos; alguns aparelhos Android não a pintam como o navegador, então o texto vai como caminho SVG
 * e fica igual em qualquer plataforma. Encolhe para caber quando passa da largura disponível.
 */
export function OutlineText({ children, size, color, maxWidth, header = true }: { children: string; size: number; color: string; maxWidth?: number; header?: boolean }) {
  const [avail, setAvail] = useState<number | null>(null);
  const text = children;
  let x = 0;
  const parts: { d: string; x: number }[] = [];
  for (const ch of text) {
    const g = G[ch] ?? G['?'];
    if (!g) continue;
    if (g[1]) parts.push({ d: g[1], x });
    x += g[0];
  }
  const natural = (x / unitsPerEm) * size;
  const limit = maxWidth ?? avail ?? natural;
  const scale = natural > limit && natural > 0 ? limit / natural : 1;
  const width = natural * scale;
  const height = ((ascent + descent) / unitsPerEm) * size * scale;
  return (
    <View accessible accessibilityRole={header ? 'header' : undefined} accessibilityLabel={text} style={{ alignSelf: 'stretch', alignItems: 'center' }} onLayout={(e) => { if (maxWidth === undefined) setAvail(e.nativeEvent.layout.width); }}>
      <Svg width={width} height={height} viewBox={`0 0 ${x} ${ascent + descent}`}>
        {parts.map((p, i) => <Group key={i} transform={`translate(${p.x} 0)`}><Path d={p.d} fill={color} fillRule="nonzero" /></Group>)}
      </Svg>
    </View>
  );
}
