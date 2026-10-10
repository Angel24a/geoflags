/**
 * Small helpers to author flags as SVG strings.
 * Coordinates are in the flag's own viewBox units (width × height).
 */

export type Pt = [number, number];

const n = (v: number) => +v.toFixed(2);

export const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;

export const rect = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"/>`;

export const circle = (cx: number, cy: number, r: number, fill: string, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

export const poly = (pts: Pt[], fill: string, extra = '') =>
  `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

export const path = (d: string, fill: string, extra = '') =>
  `<path d="${d}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

export const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, width: number) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(width)}"/>`;

/** Equal (or weighted) stripes. dir 'h' = horizontal bands stacked top→bottom. */
export function stripes(w: number, h: number, colors: string[], dir: 'h' | 'v' = 'h', weights?: number[]) {
  const ws = weights ?? colors.map(() => 1);
  const total = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  return colors
    .map((c, i) => {
      const start = (acc / total) * (dir === 'h' ? h : w);
      acc += ws[i];
      const size = (ws[i] / total) * (dir === 'h' ? h : w);
      return dir === 'h' ? rect(0, start, w, size + 0.5, c) : rect(start, 0, size + 0.5, h, c);
    })
    .join('');
}

/** Points of a regular star. rot = degrees, 0 means one point straight up. */
export function starPoints(cx: number, cy: number, r: number, points = 5, rot = 0, innerRatio = 0.382): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * innerRatio;
    const a = ((rot - 90 + (i * 180) / points) * Math.PI) / 180;
    pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return pts;
}

export const star = (cx: number, cy: number, r: number, fill: string, points = 5, rot = 0, innerRatio = 0.382) =>
  poly(starPoints(cx, cy, r, points, rot, innerRatio), fill);

/** Stars placed evenly on an arc (angles in degrees, 0 = right, 90 = down). */
export function starArc(
  cx: number, cy: number, radius: number, count: number, from: number, to: number,
  r: number, fill: string,
) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = ((from + ((to - from) * i) / Math.max(1, count - 1)) * Math.PI) / 180;
    out += star(cx + radius * Math.cos(a), cy + radius * Math.sin(a), r, fill);
  }
  return out;
}

/** Crescent made by covering a disc with a second disc of the background colour. */
export const crescent = (cx: number, cy: number, r: number, fill: string, bg: string, dx: number, r2 = r * 0.8, dy = 0) =>
  circle(cx, cy, r, fill) + circle(cx + dx, cy + dy, r2, bg);

/** Sun: disc plus triangular rays. */
export function sun(cx: number, cy: number, r: number, rays: number, rayLen: number, fill: string, rot = 0) {
  let out = '';
  const half = Math.PI / rays * 0.55;
  for (let i = 0; i < rays; i++) {
    const a = ((rot - 90) * Math.PI) / 180 + (i * 2 * Math.PI) / rays;
    out += poly(
      [
        [cx + r * 0.9 * Math.cos(a - half), cy + r * 0.9 * Math.sin(a - half)],
        [cx + (r + rayLen) * Math.cos(a), cy + (r + rayLen) * Math.sin(a)],
        [cx + r * 0.9 * Math.cos(a + half), cy + r * 0.9 * Math.sin(a + half)],
      ],
      fill,
    );
  }
  return out + circle(cx, cy, r, fill);
}

/** Nordic (Scandinavian) cross. x = centre of the vertical arm, t = arm thickness. */
export function nordicCross(w: number, h: number, color: string, x: number, t: number) {
  return rect(x - t / 2, 0, t, h, color) + rect(0, h / 2 - t / 2, w, t, color);
}

/** Centred symmetric cross. */
export const greekCross = (w: number, h: number, color: string, t: number) =>
  rect(w / 2 - t / 2, 0, t, h, color) + rect(0, h / 2 - t / 2, w, t, color);

/** Saltire (diagonal cross) covering the full rectangle. */
export const saltire = (w: number, h: number, color: string, t: number) =>
  `<path d="M0,0L${w},${h}M${w},0L0,${h}" stroke="${color}" stroke-width="${t}"/>`;

/** Union Jack (1801) drawn in a 60×30 box, then scaled into (x, y, w, h). */
export function unionJack(id: string, x = 0, y = 0, w = 60, h = 30) {
  return `<g transform="translate(${x} ${y}) scale(${w / 60} ${h / 30})">
<clipPath id="${id}s"><path d="M0,0v30h60v-30z"/></clipPath>
<clipPath id="${id}t"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>
<g clip-path="url(#${id}s)">
<path d="M0,0v30h60v-30z" fill="#012169"/>
<path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/>
<path d="M0,0L60,30M60,0L0,30" clip-path="url(#${id}t)" stroke="#C8102E" stroke-width="4"/>
<path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/>
<path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/>
</g></g>`;
}

/** Hammer and sickle in a 100×100 box, placed at (x, y) with the given size. */
export function hammerSickle(x: number, y: number, size: number, fill: string) {
  const c: Pt = [55, 45];
  const R = 35;
  const r = 26;
  const at = (rad: number, deg: number): Pt => [
    c[0] + rad * Math.cos((deg * Math.PI) / 180),
    c[1] + rad * Math.sin((deg * Math.PI) / 180),
  ];
  const [o1, o2, i1, i2] = [at(R, -40), at(R, 135), at(r, -40), at(r, 135)];
  const blade = `M${n(o1[0])},${n(o1[1])}A${R},${R} 0 0 0 ${n(o2[0])},${n(o2[1])}L${n(i2[0])},${n(i2[1])}A${r},${r} 0 0 1 ${n(i1[0])},${n(i1[1])}Z`;
  const handleSickle = poly([[o2[0] - 3, o2[1] - 3], [o2[0] - 17, o2[1] + 11], [o2[0] - 11, o2[1] + 17], [i2[0] + 3, i2[1] + 3]], fill);
  const hammerHandle = poly([[80, 92], [86, 86], [44, 44], [38, 50]], fill);
  const hammerHead = poly([[22, 44], [40, 26], [48, 34], [30, 52]], fill);
  return `<g transform="translate(${x} ${y}) scale(${size / 100})">${path(blade, fill)}${handleSickle}${hammerHandle}${hammerHead}</g>`;
}

/** Simple castle (three towers) in a 100×100 box. */
export function castle(x: number, y: number, size: number, fill: string, door = '#000') {
  const body =
    rect(15, 40, 70, 50, fill) +
    rect(10, 25, 22, 25, fill) + rect(39, 15, 22, 35, fill) + rect(68, 25, 22, 25, fill) +
    // merlons
    rect(10, 18, 6, 8, fill) + rect(18, 18, 6, 8, fill) + rect(26, 18, 6, 8, fill) +
    rect(39, 8, 6, 8, fill) + rect(47, 8, 6, 8, fill) + rect(55, 8, 6, 8, fill) +
    rect(68, 18, 6, 8, fill) + rect(76, 18, 6, 8, fill) + rect(84, 18, 6, 8, fill) +
    path('M42,90V72a8,8 0 0 1 16,0V90Z', door) +
    rect(18, 32, 6, 8, door) + rect(76, 32, 6, 8, door) + rect(47, 24, 6, 10, door);
  return `<g transform="translate(${x} ${y}) scale(${size / 100})">${body}</g>`;
}

/** Stylised rampant lion facing the hoist side (left), 100×100 box. */
export function lion(x: number, y: number, size: number, fill: string, accent?: string) {
  const d =
    'M30,22 C30,10 46,6 52,14 C56,8 64,10 62,18 L58,24 C66,26 70,34 68,44 C76,46 84,54 80,62 ' +
    'C88,70 84,84 74,88 L78,96 L64,96 L62,86 C56,88 48,88 44,84 L40,96 L26,96 L32,80 ' +
    'C26,72 26,62 32,56 L22,52 L16,40 L24,42 L30,48 L36,44 L28,36 L20,34 L22,28 Z ' +
    'M80,62 C92,56 96,44 90,34 C96,40 98,54 88,64 Z';
  const tongue = accent ? path('M30,22 L22,24 L28,27 Z', accent) : '';
  return `<g transform="translate(${x} ${y}) scale(${size / 100})">${path(d, fill)}${tongue}</g>`;
}

/** Simple open crown, 100×60 box. */
export function crown(x: number, y: number, size: number, fill: string) {
  const d = 'M5,55 L0,15 L22,35 L35,5 L50,30 L65,5 L78,35 L100,15 L95,55 Z';
  return `<g transform="translate(${x} ${y}) scale(${size / 100})">${path(d, fill)}${circle(0, 15, 5, fill)}${circle(35, 5, 5, fill)}${circle(65, 5, 5, fill)}${circle(100, 15, 5, fill)}</g>`;
}

/** Heater shield outline path in a 100×120 box. */
export const SHIELD = 'M0,0H100V60C100,95 70,112 50,120C30,112 0,95 0,60Z';

export const shield = (x: number, y: number, size: number, body: string, id: string) =>
  `<g transform="translate(${x} ${y}) scale(${size / 100})"><clipPath id="${id}"><path d="${SHIELD}"/></clipPath><g clip-path="url(#${id})">${body}</g><path d="${SHIELD}" fill="none" stroke="#000" stroke-width="2"/></g>`;
