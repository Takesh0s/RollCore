import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, G, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { DIE_FACES, LABEL_SIZE, type DieFace } from '../../design/diceModels';

/**
 * Dado da última rolagem, igual ao DiceStage do web: mesmo modelo (d4…d20, d100 = 2 d10), números nas
 * faces, gira enquanto o servidor responde e pousa com a face sorteada virada para a câmera.
 * O web usa three.js; aqui a mesma geometria é projetada em SVG (sem WebGL).
 */

type V3 = [number, number, number];
type Q = [number, number, number, number]; // x y z w
const TAU = Math.PI * 2;
const QI: Q = [0, 0, 0, 1];

const qmul = (a: Q, b: Q): Q => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qinv = (a: Q): Q => [-a[0], -a[1], -a[2], a[3]];
const qnorm = (a: Q): Q => { const l = Math.hypot(a[0], a[1], a[2], a[3]) || 1; return [a[0] / l, a[1] / l, a[2] / l, a[3] / l]; };
const qaxis = (ax: V3, ang: number): Q => { const s = Math.sin(ang / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)]; };
function qslerp(a: Q, b: Q, t: number): Q {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) { d = -d; bb = [-b[0], -b[1], -b[2], -b[3]]; }
  if (d > 0.9995) return qnorm([a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t]);
  const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
}
function qrot(q: Q, v: number[]): V3 {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
const cross = (a: number[], b: number[]): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: number[]): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const rnd3 = (): V3 => norm3([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);

/** Quaternion de uma matriz de rotação (linhas m0, m1, m2). */
function qFromRows(m0: number[], m1: number[], m2: number[]): Q {
  const [a, b, c] = m0, [d, e, f] = m1, [g, h, i] = m2;
  const tr = a + e + i;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; return qnorm([(h - f) / s, (c - g) / s, (d - b) / s, 0.25 * s]); }
  if (a > e && a > i) { const s = Math.sqrt(1 + a - e - i) * 2; return qnorm([0.25 * s, (b + d) / s, (c + g) / s, (h - f) / s]); }
  if (e > i) { const s = Math.sqrt(1 + e - a - i) * 2; return qnorm([(b + d) / s, 0.25 * s, (f + h) / s, (c - g) / s]); }
  const s = Math.sqrt(1 + i - a - e) * 2;
  return qnorm([(c + g) / s, (f + h) / s, 0.25 * s, (d - b) / s]);
}
/** Gira a face para a câmera (normal → +z, "cima" do número → +y), com a leve inclinação do web. */
function faceToCamera(f: DieFace): Q {
  const right = norm3(cross(f.u, f.n));
  const q = qFromRows(right, f.u, f.n);
  return qmul(qaxis([1, 0, 0], -0.05), q);
}

interface Model { sides: number; label: (v: number) => string; x: number; scale: number }
function modelsFor(sides: number): Model[] {
  if (sides === 100) {
    return [
      { sides: 10, label: (v) => String((v % 10) * 10).padStart(2, '0'), x: -1.2, scale: 0.6 },
      { sides: 10, label: (v) => String(v % 10), x: 1.2, scale: 0.6 },
    ];
  }
  return [{ sides, label: (v) => String(sides === 10 ? v % 10 : v), x: 0, scale: 1 }];
}
/** Faces (uma por dado) que mostram o valor de uma rolagem 1…sides. */
function targets(sides: number, models: Model[], value: number): DieFace[] {
  if (sides === 100) {
    const v = value === 100 ? 0 : value;
    const pick = (shown: number) => DIE_FACES[10].find((f) => f.v % 10 === shown) ?? DIE_FACES[10][0];
    return [pick(Math.floor(v / 10)), pick(v % 10)];
  }
  const faces = DIE_FACES[models[0].sides];
  return [faces.find((f) => f.v === value) ?? faces[0]];
}

const SIZE = 200;
const FOV = (32 * Math.PI) / 180;
const KEY_LIGHT = norm3([3, 4, 6]);

function mix(a: number[], b: number[], t: number) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
const hex = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

interface Props {
  /** Tipo de dado exibido quando não há rolagem em curso. */
  sides: number;
  /** true enquanto espera o servidor responder: o dado gira sem parar. */
  rolling: boolean;
  /** Última rolagem (vem do servidor). `id` muda a cada rolagem nova. */
  result: { id: number; sides: number; rolls: number[]; total: number; tone: 'crit' | 'fail' | '' } | null;
  edge: string;
}

export function DiceStage({ sides, rolling, result, edge }: Props) {
  const [tick, setTick] = useState(0);
  const [settled, setSettled] = useState(true);
  const raf = useRef(0);
  const seen = useRef<number | null>(null);
  const started = useRef(false);
  const cur = useRef<{ sides: number; models: Model[]; q: Q[]; y: number[] }>({ sides: 0, models: [], q: [], y: [] });
  const mode = useRef<'idle' | 'tumble' | 'land'>('idle');
  const spin = useRef<{ axis: V3; speed: number }[]>([]);
  const landing = useRef<null | { r0: Q[]; to: Q[]; aA: V3[]; aB: V3[]; tA: number[]; tB: number[]; y0: number[]; start: number; dur: number; done: () => void }>(null);
  const redraw = () => setTick((t) => t + 1);

  function setSides(n: number, show?: number) {
    const models = modelsFor(n);
    const value = show ?? 1 + Math.floor(Math.random() * n);
    const t = targets(n, models, value);
    cur.current = { sides: n, models, q: t.map((f) => faceToCamera(f)), y: models.map(() => 0) };
    spin.current = models.map(() => ({ axis: rnd3(), speed: 13 }));
  }
  if (!cur.current.models.length) setSides(result ? result.sides : sides, result ? result.rolls[result.rolls.length - 1] : undefined);

  const loop = () => {
    if (raf.current) return;
    let last = Date.now();
    const frac = [0.32, 0.25, 0.19, 0.13, 0.08, 0.03], hts = [0.62, 0.34, 0.16, 0.07, 0.025, 0.008];
    const step = () => {
      raf.current = 0;
      const now = Date.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const c = cur.current;
      let again = false;
      if (mode.current === 'tumble') {
        c.q = c.q.map((q, i) => {
          const s = spin.current[i];
          if (Math.random() < dt * 2.2) s.axis = norm3([s.axis[0] + Math.random() - 0.5, s.axis[1] + Math.random() - 0.5, s.axis[2] + Math.random() - 0.5]);
          return qnorm(qmul(qaxis(s.axis, s.speed * dt), q));
        });
        c.y = c.models.map((_, i) => 0.4 * Math.abs(Math.sin(now / 210 + i * 1.3)));
        again = true;
      } else if (mode.current === 'land' && landing.current) {
        const L = landing.current;
        const u = Math.min(1, (now - L.start) / L.dur);
        const k = Math.pow(1 - u, 2);
        c.q = c.models.map((_, i) => {
          const sA = qaxis(L.aA[i], TAU * L.tA[i] * k), sB = qaxis(L.aB[i], TAU * L.tB[i] * k * k);
          const res = qslerp(QI, L.r0[i], k);
          return qnorm(qmul(qmul(qmul(sA, sB), res), L.to[i]));
        });
        let acc = 0, y = 0;
        for (let j = 0; j < frac.length; j++) {
          if (u <= acc + frac[j] || j === frac.length - 1) {
            const s = Math.min(1, (u - acc) / frac[j]);
            y = hts[j] * 4 * s * (1 - s) + (j === 0 ? L.y0[0] * (1 - s) : 0);
            break;
          }
          acc += frac[j];
        }
        c.y = c.models.map(() => y);
        if (u >= 1) {
          c.q = L.to.slice(); c.y = c.models.map(() => 0);
          landing.current = null; mode.current = 'idle';
          L.done();
        } else again = true;
      }
      redraw();
      if (again) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => () => { cancelAnimationFrame(raf.current); raf.current = 0; }, []);

  // Dado parado conforme o tipo escolhido; ao abrir a tela já mostra a última rolagem (sem animar).
  useEffect(() => {
    if (rolling) return;
    if (!started.current) {
      started.current = true;
      if (result) { setSides(result.sides, result.rolls[result.rolls.length - 1]); seen.current = result.id; redraw(); return; }
    }
    if (result && seen.current === result.id) return;
    if (cur.current.sides !== sides) { setSides(sides); redraw(); }
  }, [sides, rolling, result]);

  // Gira enquanto o servidor responde.
  useEffect(() => {
    if (!rolling) return;
    setSettled(false);
    if (cur.current.sides !== sides) setSides(sides);
    landing.current = null; mode.current = 'tumble';
    loop();
  }, [rolling, sides]);

  // Resultado chegou: pousa na face sorteada (uma rolagem por vez quando são vários dados).
  useEffect(() => {
    if (rolling || !result || seen.current === result.id) return;
    seen.current = result.id;
    if (cur.current.sides !== result.sides) setSides(result.sides);
    const rolls = result.rolls;
    const per = rolls.length <= 1 ? 1700 : rolls.length <= 4 ? 1100 : 500;
    setSettled(false);
    let i = 0;
    const next = () => {
      const c = cur.current;
      const to = targets(c.sides, c.models, rolls[i]).map((f) => faceToCamera(f));
      mode.current = 'land';
      landing.current = {
        to, r0: c.q.map((q, j) => qmul(q, qinv(to[j]))),
        aA: c.models.map(rnd3), aB: c.models.map(rnd3),
        tA: c.models.map(() => 2 + Math.floor(Math.random() * 2)), tB: c.models.map(() => 1 + Math.floor(Math.random() * 2)),
        y0: c.y.slice(), start: Date.now(), dur: per,
        done: () => { i += 1; if (i < rolls.length) setTimeout(next, 120); else setSettled(true); },
      };
      loop();
    };
    next();
  }, [rolling, result]);

  void tick;
  const { models, q, y } = cur.current;
  const camZ = models.length > 1 ? 7.4 : 6.1;
  const focal = (SIZE / 2) / Math.tan(FOV / 2);
  const proj = (p: number[], ox: number, oy: number, s: number): [number, number] => {
    const d = camZ - (p[2] * s);
    return [SIZE / 2 + (focal * (p[0] * s + ox)) / d, SIZE / 2 - (focal * (p[1] * s + oy)) / d];
  };
  const body = [53, 62, 67], light = [78, 90, 98];

  const dice = models.map((m, di) => {
    const faces = DIE_FACES[m.sides];
    const qq = q[di] ?? QI, oy = y[di] ?? 0;
    const placed = faces.map((f) => {
      const n = qrot(qq, f.n), c = qrot(qq, f.c);
      const vis = n[0] * (0 - c[0] * m.scale - m.x) + n[1] * (0 - c[1] * m.scale - oy) + n[2] * (camZ - c[2] * m.scale) > 0;
      return { f, n, c, vis };
    }).filter((p) => p.vis).sort((a, b) => a.c[2] - b.c[2]);
    return { m, oy, placed, qq };
  });

  const showTotal = !!result && settled && (result.sides === 100 || result.rolls.length > 1 || result.total !== result.rolls[0]);
  const tone = result?.tone === 'fail' ? '#e8878a' : COLORS.sapphire;

  return (
    <>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="dsh" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
              <Stop offset="1" stopColor="#000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {dice.map(({ m, oy, placed, qq }, di) => {
            const k = 1 / (1 + Math.max(0, oy) * 1.4);
            const [sx, sy] = proj([0, -1.12 * m.scale - 0.06 + 0, 0], m.x, 0, 1);
            return (
              <G key={di}>
                <Ellipse cx={sx} cy={sy} rx={(focal * 1.2 * m.scale * k) / camZ} ry={(focal * 0.25 * m.scale * k) / camZ} fill="url(#dsh)" opacity={k} />
                {placed.map(({ f, n, c }, fi) => {
                  const pts = f.p.map((pt) => { const r = qrot(qq, pt); return proj([r[0], r[1] + oy / m.scale, r[2]], m.x, 0, m.scale); });
                  const shade = Math.max(0, n[0] * KEY_LIGHT[0] + n[1] * KEY_LIGHT[1] + n[2] * KEY_LIGHT[2]);
                  const lab = m.label(f.v);
                  const size = LABEL_SIZE[m.sides] ?? 0.7;
                  const up = qrot(qq, f.u), right = qrot(qq, norm3(cross(f.u, f.n)));
                  const cc = qrot(qq, f.c), nn = n;
                  const o = proj([cc[0] + nn[0] * 0.012, cc[1] + nn[1] * 0.012 + oy / m.scale, cc[2] + nn[2] * 0.012], m.x, 0, m.scale);
                  const d = 0.1;
                  const px = proj([cc[0] + right[0] * d, cc[1] + right[1] * d + oy / m.scale, cc[2] + right[2] * d], m.x, 0, m.scale);
                  const py = proj([cc[0] + up[0] * d, cc[1] + up[1] * d + oy / m.scale, cc[2] + up[2] * d], m.x, 0, m.scale);
                  const a = (px[0] - o[0]) / d, b = (px[1] - o[1]) / d, cx = -(py[0] - o[0]) / d, cy = -(py[1] - o[1]) / d;
                  const fs = (lab.length > 2 ? 0.42 : 0.61) * size;
                  const front = fi === placed.length - 1 || n[2] > 0.2;
                  return (
                    <G key={f.v + '-' + fi}>
                      <Polygon points={pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} fill={hex(mix(body, light, shade * 0.55))} fillOpacity={0.94}
                        stroke={edge} strokeWidth={1.3} strokeLinejoin="round" />
                      {front ? (
                        <G transform={`matrix(${a / 100} ${b / 100} ${cx / 100} ${cy / 100} ${o[0]} ${o[1]})`}>
                          <SvgText x={0} y={fs * 100 * 0.34} fontSize={fs * 100} fontFamily="SourceSerif4_700Bold" fontWeight="700" fill={edge} textAnchor="middle">{lab}</SvgText>
                          {lab === '6' || lab === '9' ? <Rect x={-0.16 * size * 100 / 0.6 * 0.5} y={fs * 100 * 0.5} width={0.32 * size * 100 / 0.6 * 0.5 * 2 / 2} height={size * 100 * 0.05} fill={edge} /> : null}
                        </G>
                      ) : null}
                    </G>
                  );
                })}
              </G>
            );
          })}
        </Svg>
      </View>
      {showTotal && result ? (
        <Text accessibilityLabel={`Total ${result.total}`} style={{ color: tone, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(38), lineHeight: appFontSize(42) }}>
          <Text style={{ color: '#C0C0C0', fontFamily: 'Inter_400Regular', fontSize: appFontSize(14) }}>Total </Text>{result.total}
        </Text>
      ) : null}
    </>
  );
}

