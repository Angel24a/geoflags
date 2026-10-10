/**
 * Altered versions of a flag for "spot the error": swapped colours,
 * a changed colour, or a mirrored design.
 */
import { COLOR_HEX, type ColorKey, type Entity } from '@/data';
import { shuffle, type Rng } from './random';

const NAMED: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff', green: '#008000', yellow: '#ffff00',
  navy: '#000080', maroon: '#800000', gold: '#ffd700', orange: '#ffa500', purple: '#800080', teal: '#008080',
  lime: '#00ff00', silver: '#c0c0c0', gray: '#808080', grey: '#808080', brown: '#a52a2a', crimson: '#dc143c',
  darkred: '#8b0000', olive: '#808000', aqua: '#00ffff', fuchsia: '#ff00ff', tan: '#d2b48c', peru: '#cd853f',
  sienna: '#a0522d', chocolate: '#d2691e', orangered: '#ff4500', firebrick: '#b22222', goldenrod: '#daa520',
};

type RGB = [number, number, number];

export function parseColor(token: string): RGB | null {
  const t = token.trim().toLowerCase();
  const hex = NAMED[t] ?? t;
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(hex);
  if (m3) return [m3[1], m3[2], m3[3]].map(h => parseInt(h + h, 16)) as RGB;
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(hex);
  if (m6) return [m6[1], m6[2], m6[3]].map(h => parseInt(h, 16)) as RGB;
  return null;
}

const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function nearestKey(rgb: RGB): ColorKey {
  let best: ColorKey = 'white';
  let bd = Infinity;
  for (const [k, hex] of Object.entries(COLOR_HEX) as [ColorKey, string][]) {
    const d = dist(rgb, parseColor(hex)!);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

const COLOR_ATTR = /(fill|stroke|stop-color)="([^"]+)"/g;

/** Distinct colour tokens used in the SVG with how often they appear. */
export function colorTokens(svg: string): { token: string; count: number; rgb: RGB }[] {
  const counts = new Map<string, number>();
  for (const m of svg.matchAll(COLOR_ATTR)) {
    const token = m[2];
    if (token === 'none' || token.startsWith('url(')) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([token, count]) => ({ token, count, rgb: parseColor(token) }))
    .filter((x): x is { token: string; count: number; rgb: RGB } => !!x.rgb)
    .sort((a, b) => b.count - a.count);
}

function replaceColors(svg: string, map: Record<string, string>): string {
  return svg.replace(COLOR_ATTR, (all, attr: string, token: string) => (map[token] ? `${attr}="${map[token]}"` : all));
}

/** Mirror the whole drawing horizontally ('h') or vertically ('v'). */
export function mirror(svg: string, axis: 'h' | 'v'): string {
  const vb = /viewBox="([^"]+)"/.exec(svg);
  if (!vb) return svg;
  const [x, y, w, h] = vb[1].split(/[\s,]+/).map(Number);
  const t = axis === 'h' ? `matrix(-1 0 0 1 ${2 * x + w} 0)` : `matrix(1 0 0 -1 0 ${2 * y + h})`;
  return svg.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/, (_, open, body, close) => {
    // keep <defs> outside the transform so references still resolve the same
    return `${open}<g transform="${t}">${body}</g>${close}`;
  });
}

export interface Variant {
  svg: string;
  kind: 'swap' | 'recolor' | 'mirror';
}

const REPLACEMENTS: ColorKey[] = ['red', 'green', 'blue', 'yellow', 'lightblue', 'orange', 'black', 'white', 'purple', 'maroon'];

/** Up to `count` distinct altered versions of the flag. */
export function makeVariants(e: Entity, svg: string, count = 3, rng: Rng = Math.random): Variant[] {
  const tokens = colorTokens(svg);
  // tokens that belong to the flag's dominant colours are the visible ones
  const dominant = tokens.filter(t => e.colors.includes(nearestKey(t.rgb)));
  const candidates: Variant[] = [];

  // 1) swap two dominant colours of different families
  const pairs: [typeof tokens[number], typeof tokens[number]][] = [];
  for (let i = 0; i < dominant.length; i++) {
    for (let j = i + 1; j < dominant.length; j++) {
      if (nearestKey(dominant[i].rgb) !== nearestKey(dominant[j].rgb)) pairs.push([dominant[i], dominant[j]]);
    }
  }
  for (const [a, b] of shuffle(pairs, rng).slice(0, 2)) {
    candidates.push({ kind: 'swap', svg: replaceColors(svg, { [a.token]: b.token, [b.token]: a.token }) });
  }

  // 2) change one dominant colour to another colour not present in the flag
  const present = new Set(tokens.map(t => nearestKey(t.rgb)));
  for (const t of shuffle(dominant, rng).slice(0, 2)) {
    const options = REPLACEMENTS.filter(k => !present.has(k));
    if (!options.length) continue;
    const k = options[Math.floor(rng() * options.length)];
    // replace every token of the same colour family so the change is complete
    const family = nearestKey(t.rgb);
    const map: Record<string, string> = {};
    for (const x of tokens) if (nearestKey(x.rgb) === family) map[x.token] = COLOR_HEX[k];
    candidates.push({ kind: 'recolor', svg: replaceColors(svg, map) });
  }

  // 3) mirrored, only when it actually looks different
  if (!e.symH) candidates.push({ kind: 'mirror', svg: mirror(svg, 'h') });
  if (!e.symV) candidates.push({ kind: 'mirror', svg: mirror(svg, 'v') });

  // flags with one dominant colour (e.g. Madrid): also recolour the smaller details
  if (candidates.length < count) {
    const minor = tokens.filter(t => !dominant.includes(t));
    for (const t of minor) {
      const options = REPLACEMENTS.filter(k => !present.has(k));
      if (!options.length) break;
      const k = options[Math.floor(rng() * options.length)];
      candidates.push({ kind: 'recolor', svg: replaceColors(svg, { [t.token]: COLOR_HEX[k] }) });
    }
    for (const t of dominant) {
      for (const m of minor) candidates.push({ kind: 'swap', svg: replaceColors(svg, { [t.token]: m.token, [m.token]: t.token }) });
    }
  }

  const out: Variant[] = [];
  const seen = new Set([svg]);
  // prefer a mix of kinds
  const byKind = shuffle(candidates, rng).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'mirror' ? 1 : -1));
  const kindsUsed = new Set<string>();
  for (const pass of [0, 1]) {
    for (const v of byKind) {
      if (out.length >= count) break;
      if (seen.has(v.svg)) continue;
      if (pass === 0 && kindsUsed.has(v.kind)) continue;
      out.push(v);
      seen.add(v.svg);
      kindsUsed.add(v.kind);
    }
  }
  return out;
}
