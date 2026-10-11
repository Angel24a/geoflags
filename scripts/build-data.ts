/**
 * Builds the app data in src/data/generated from:
 *   - world-countries  (names, capitals, borders, area…)
 *   - region-flags / flag-icons  (flag SVGs, public domain / MIT)
 *   - data/extras.ts  (extra entities and authored flags)
 *   - world-atlas  (Natural Earth geometry, public domain)
 *   - data/population.json  (World Bank, latest year)
 *
 * Run with: npm run build:data
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import { optimize } from 'svgo';
import { feature, quantize } from 'topojson-client';
import { topology } from 'topojson-server';
import { geoCentroid } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Polygon } from 'geojson';

import { BASE_FLAG_OVERRIDES, EXTRAS } from '../data/extras';
import { mainPartShare, silhouetteFill } from '../src/lib/shape';
import { ALIASES, CAPITALS_ES, NAME_OVERRIDES } from '../data/spanish';
import type { Bands, Category, ColorKey, Continent, Entity } from '../src/data/types';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src/data/generated');
const pkgDir = (name: string) => path.dirname(require.resolve(`${name}/package.json`, { paths: [ROOT] }));
const flagIconsDir = path.join(ROOT, 'node_modules/flag-icons/flags/4x3');
const regionFlagsDir = path.join(ROOT, 'node_modules/region-flags/svg');

// ---------------------------------------------------------------------------
// Source data
// ---------------------------------------------------------------------------

interface WC {
  name: { common: string };
  cca2: string;
  cca3: string;
  ccn3: string;
  independent: boolean;
  unMember: boolean;
  capital: string[];
  region: string;
  subregion: string;
  latlng: [number, number];
  area: number;
  borders: string[];
  translations: Record<string, { common: string }>;
}

const countries: WC[] = JSON.parse(fs.readFileSync(path.join(pkgDir('world-countries'), 'countries.json'), 'utf8'));
const population: Record<string, number> = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/population.json'), 'utf8'));

const SUBREGION_ES: Record<string, string> = {
  'Australia and New Zealand': 'Australia y Nueva Zelanda',
  Caribbean: 'Caribe',
  'Central America': 'Centroamérica',
  'Central Asia': 'Asia Central',
  'Central Europe': 'Europa Central',
  'Eastern Africa': 'África Oriental',
  'Eastern Asia': 'Asia Oriental',
  'Eastern Europe': 'Europa del Este',
  Melanesia: 'Melanesia',
  Micronesia: 'Micronesia',
  'Middle Africa': 'África Central',
  'North America': 'Norteamérica',
  'Northern Africa': 'África del Norte',
  'Northern Europe': 'Europa del Norte',
  Polynesia: 'Polinesia',
  'South America': 'Sudamérica',
  'South-Eastern Asia': 'Sudeste Asiático',
  'Southeast Europe': 'Europa del Sudeste',
  'Southern Africa': 'África Austral',
  'Southern Asia': 'Asia del Sur',
  'Southern Europe': 'Europa del Sur',
  'Western Africa': 'África Occidental',
  'Western Asia': 'Asia Occidental',
  'Western Europe': 'Europa Occidental',
};

function continentOf(c: WC): Continent {
  switch (c.region) {
    case 'Europe': return 'europe';
    case 'Asia': return 'asia';
    case 'Africa': return 'africa';
    case 'Oceania': return 'oceania';
    case 'Antarctic': return 'antarctica';
    default: return c.subregion === 'South America' ? 'south-america' : 'north-america';
  }
}

const LIMITED = new Set(['XK', 'TW', 'PS', 'EH']);

type Draft = Omit<Entity, 'ratio' | 'colors' | 'similar' | 'sameFlag' | 'bands' | 'geo' | 'symH' | 'symV'> & {
  svgRaw: string;
  geoName?: string;
};

const drafts: Draft[] = [];
const cca3ToId = new Map(countries.map(c => [c.cca3, c.cca2.toLowerCase()]));

/** Base flags taken from flag-icons instead of region-flags (newer design or SVG issues). */
const PREFER_FLAG_ICONS = new Set(['si', 'tf']);

/** Flags dropped into data/flags/<id>.svg replace any other source. */
const localFlag = (id: string) => path.join(ROOT, 'data/flags', `${id}.svg`);

function readFlag(code: string): string {
  const id = code.toLowerCase();
  if (fs.existsSync(localFlag(id))) return fs.readFileSync(localFlag(id), 'utf8');
  if (BASE_FLAG_OVERRIDES[id]) return BASE_FLAG_OVERRIDES[id];
  if (PREFER_FLAG_ICONS.has(id)) return fs.readFileSync(path.join(flagIconsDir, `${id}.svg`), 'utf8');
  const rf = path.join(regionFlagsDir, `${code.toUpperCase()}.svg`);
  if (fs.existsSync(rf)) return fs.readFileSync(rf, 'utf8');
  return fs.readFileSync(path.join(flagIconsDir, `${id}.svg`), 'utf8');
}

for (const c of countries) {
  const id = c.cca2.toLowerCase();
  const category: Category = LIMITED.has(c.cca2) ? 'limited' : c.unMember || c.cca2 === 'VA' ? 'sovereign' : 'territory';
  const capital = CAPITALS_ES[c.cca2] ?? c.capital[0];
  drafts.push({
    id,
    name: NAME_OVERRIDES[c.cca2] ?? c.translations.spa?.common ?? c.name.common,
    aliases: ALIASES[c.cca2] ?? [],
    category,
    continent: continentOf(c),
    subregion: SUBREGION_ES[c.subregion],
    capital: capital || undefined,
    latlng: c.latlng,
    area: c.area > 0 ? c.area : undefined,
    population: population[c.cca2 === 'XK' ? 'XKX' : c.cca3],
    borders: c.borders.map(b => cca3ToId.get(b)).filter((x): x is string => !!x),
    base: true,
    svgRaw: readFlag(c.cca2),
    geoName: c.cca2 === 'XK' ? 'Kosovo' : undefined,
  });
}

const UK_NATIONS: [string, string, string, [number, number], number, string][] = [
  ['gb-eng', 'Inglaterra', 'Londres', [52.5, -1.5], 130279, 'GB-ENG'],
  ['gb-sct', 'Escocia', 'Edimburgo', [56.8, -4.2], 77933, 'GB-SCT'],
  ['gb-wls', 'Gales', 'Cardiff', [52.3, -3.7], 20779, 'GB-WLS'],
  ['gb-nir', 'Irlanda del Norte', 'Belfast', [54.6, -6.7], 14130, 'GB-NIR'],
];
for (const [id, name, capital, latlng, area, code] of UK_NATIONS) {
  drafts.push({
    id, name, aliases: [], category: 'territory', continent: 'europe', subregion: 'Europa del Norte',
    capital, latlng, area, borders: [], base: true, svgRaw: readFlag(code),
  });
}

for (const x of EXTRAS) {
  const local = localFlag(x.id);
  const svgRaw = fs.existsSync(local)
    ? fs.readFileSync(local, 'utf8')
    : x.flagIcon
      ? fs.readFileSync(path.join(flagIconsDir, `${x.flagIcon}.svg`), 'utf8')
      : x.svg!;
  drafts.push({
    id: x.id, name: x.name, aliases: x.aliases ?? [], category: x.category, continent: x.continent,
    subregion: x.subregion ? SUBREGION_ES[x.subregion] : undefined,
    capital: x.capital, latlng: x.latlng, borders: [], years: x.years, note: x.note,
    simplified: x.simplified && !fs.existsSync(local) ? true : undefined,
    base: false, svgRaw, geoName: x.geoName,
  });
}

const ids = new Set<string>();
for (const d of drafts) {
  if (ids.has(d.id)) throw new Error(`Duplicate id ${d.id}`);
  ids.add(d.id);
}
// a misspelt file name would silently be ignored
const flagsDir = path.join(ROOT, 'data/flags');
if (fs.existsSync(flagsDir)) {
  const files = fs.readdirSync(flagsDir).filter(f => f.endsWith('.svg'));
  const unknown = files.filter(f => !ids.has(f.slice(0, -4)));
  if (unknown.length) throw new Error(`data/flags: no entity with these ids: ${unknown.join(', ')}`);
  console.log(`data/flags: ${files.length} flags`);
}

// ---------------------------------------------------------------------------
// Flags: optimise SVG
// ---------------------------------------------------------------------------

function optimiseSvg(id: string, raw: string): string {
  // Keep ~3 significant digits relative to the flag size.
  const vb = raw.match(/viewBox="[\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)/);
  const wAttr = raw.match(/<svg[^>]*\swidth="([\d.]+)/);
  const width = vb ? +vb[1] : wAttr ? +wAttr[1] : 600;
  const res = optimize(raw, {
    multipass: true,
    floatPrecision: Math.max(1, Math.ceil(3 - Math.log10(width))),
    plugins: [
      { name: 'preset-default', params: { overrides: { cleanupIds: { minify: true } } } },
      'removeTitle',
      'removeDesc',
      'removeDimensions',
      'convertStyleToAttrs',
      { name: 'prefixIds', params: { prefix: id.replace(/[^a-z0-9]/g, ''), delim: '' } },
      'removeXMLNS',
    ],
  });
  // react-native-svg needs the namespace-less root to stay valid on web too.
  return res.data.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/xlink:href/g, 'href');
}

/** Display ratio: explicit width/height on the root win over the viewBox (e.g. Qatar uses a stretched viewBox). */
function flagRatio(raw: string, optimised: string): number {
  const root = /<svg[^>]*>/.exec(raw)?.[0] ?? '';
  const w = /\swidth="([\d.]+)(px)?"/.exec(root);
  const h = /\sheight="([\d.]+)(px)?"/.exec(root);
  if (w && h) return +w[1] / +h[1];
  return viewBoxRatio(optimised);
}

function viewBoxRatio(svgText: string): number {
  const m = svgText.match(/viewBox="([\d.\-\s,]+)"/);
  if (!m) throw new Error('No viewBox');
  const [, , w, h] = m[1].split(/[\s,]+/).map(Number);
  return w / h;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

type RGB = [number, number, number];
type Lab = [number, number, number];

function toLab([r, g, b]: RGB): Lab {
  const lin = (v: number) => {
    v /= 255;
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

const dE = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const PALETTE: Record<ColorKey, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#d52b1e',
  maroon: '#8d1b3d',
  orange: '#f7941d',
  yellow: '#fcd116',
  green: '#009a44',
  lightblue: '#6cace4',
  blue: '#0039a6',
  purple: '#6c3483',
};
const PAL_KEYS = Object.keys(PALETTE) as ColorKey[];
const hexToRgb = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as RGB;
// Extra anchor shades so that e.g. navy and dark green map to the right key.
const ANCHORS: [ColorKey, Lab][] = [
  ...PAL_KEYS.map(k => [k, toLab(hexToRgb(PALETTE[k]))] as [ColorKey, Lab]),
  ['blue', toLab([1, 33, 105])],
  ['blue', toLab([0, 82, 180])],
  ['green', toLab([0, 106, 78])],
  ['green', toLab([20, 140, 60])],
  ['lightblue', toLab([65, 137, 221])],
  ['lightblue', toLab([0, 158, 224])],
  ['red', toLab([200, 16, 46])],
  ['red', toLab([237, 41, 57])],
  ['yellow', toLab([255, 215, 0])],
  ['orange', toLab([255, 130, 0])],
  ['maroon', toLab([128, 0, 0])],
];

function nearestKey(lab: Lab): ColorKey {
  let best: ColorKey = 'white';
  let bd = Infinity;
  for (const [k, a] of ANCHORS) {
    const d = dE(lab, a);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Rasterise flags and extract features
// ---------------------------------------------------------------------------

const GW = 60, GH = 40; // analysis raster
const PW = 24, PH = 16; // pixel-mode grid
const SW = 12, SH = 8; // similarity grid

function rasterise(svgText: string, w: number, h: number): Uint8Array {
  const stretched = svgText.replace(/<svg[^>]*>/, tag =>
    tag.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '').replace('<svg', `<svg width="${w}" height="${h}" preserveAspectRatio="none"`),
  );
  const img = new Resvg(stretched, { fitTo: { mode: 'original' }, background: '#ffffff' }).render();
  if (img.width !== w || img.height !== h) throw new Error(`Bad raster size ${img.width}x${img.height}`);
  return img.pixels as unknown as Uint8Array; // RGBA
}

function downsample(px: Uint8Array, w: number, h: number, tw: number, th: number): RGB[] {
  const out: RGB[] = [];
  const fx = w / tw, fy = h / th;
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      let r = 0, g = 0, b = 0, cnt = 0;
      for (let y = Math.floor(ty * fy); y < Math.floor((ty + 1) * fy); y++) {
        for (let x = Math.floor(tx * fx); x < Math.floor((tx + 1) * fx); x++) {
          const i = (y * w + x) * 4;
          r += px[i]; g += px[i + 1]; b += px[i + 2]; cnt++;
        }
      }
      out.push([r / cnt, g / cnt, b / cnt]);
    }
  }
  return out;
}

function detectBands(keys: ColorKey[], w: number, h: number): Bands | undefined {
  for (const dir of ['h', 'v'] as const) {
    const lines = dir === 'h' ? h : w;
    const len = dir === 'h' ? w : h;
    const lineKeys: ColorKey[] = [];
    let purityTotal = 0;
    let ok = true;
    for (let l = 0; l < lines; l++) {
      const counts = new Map<ColorKey, number>();
      for (let k = 0; k < len; k++) {
        const key = dir === 'h' ? keys[l * w + k] : keys[k * w + l];
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const [topKey, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      const purity = topCount / len;
      // Any line with a different colour inside means there is an emblem.
      if (purity < 0.97) { ok = false; break; }
      purityTotal += purity;
      lineKeys.push(topKey);
    }
    if (!ok) continue;
    const colors: ColorKey[] = [];
    const weights: number[] = [];
    for (const k of lineKeys) {
      if (colors[colors.length - 1] === k) weights[weights.length - 1]++;
      else { colors.push(k); weights.push(1); }
    }
    if (colors.length < 2 || colors.length > 9) continue;
    // Absorb 1-line bands (anti-aliasing at band edges) into the next band.
    for (let i = weights.length - 1; i >= 0; i--) {
      if (weights[i] < 2 && weights.length > 1) {
        const j = i === weights.length - 1 ? i - 1 : i + 1;
        weights[j] += weights[i];
        weights.splice(i, 1);
        colors.splice(i, 1);
      }
    }
    for (let i = colors.length - 1; i > 0; i--) {
      if (colors[i] === colors[i - 1]) { weights[i - 1] += weights[i]; weights.splice(i, 1); colors.splice(i, 1); }
    }
    if (colors.length < 2) continue;
    return { dir, colors, weights };
  }
  return undefined;
}

interface Feat {
  symH: boolean; // left-right mirror symmetric
  symV: boolean; // top-bottom mirror symmetric
  pixels: string; // base64 RGB of PW×PH
  lab: Lab[]; // SW×SH
  labMirror: Lab[]; // SW×SH mirrored left↔right
  hist: number[]; // palette histogram
  colors: ColorKey[];
  bands?: Bands;
  keys: ColorKey[]; // GW×GH named colour per pixel
}

function features(svgText: string): Feat {
  const px = rasterise(svgText, GW, GH);
  const keys: ColorKey[] = [];
  const hist = new Array(PAL_KEYS.length).fill(0);
  for (let i = 0; i < GW * GH; i++) {
    const k = nearestKey(toLab([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]));
    keys.push(k);
    hist[PAL_KEYS.indexOf(k)]++;
  }
  for (let i = 0; i < hist.length; i++) hist[i] /= GW * GH;
  const colors = PAL_KEYS.map((k, i) => [k, hist[i]] as const)
    .filter(([, v]) => v >= 0.04)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  const pixelGrid = downsample(px, GW, GH, PW, PH);
  const bytes = Buffer.alloc(PW * PH * 3);
  pixelGrid.forEach((c, i) => c.forEach((v, j) => (bytes[i * 3 + j] = Math.round(v))));
  const labGrid = pixelGrid.map(toLab);
  const simGrid = downsample(px, GW, GH, SW, SH).map(toLab);
  /** Number of grid cells that change noticeably when mirrored. */
  const mirrorDiff = (fx: (x: number, y: number) => number) => {
    let changed = 0;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (dE(labGrid[y * PW + x], labGrid[fx(x, y)]) > 30) changed++;
    return changed;
  };
  return {
    symH: mirrorDiff((x, y) => y * PW + (PW - 1 - x)) <= 2,
    symV: mirrorDiff((x, y) => (PH - 1 - y) * PW + x) <= 2,
    pixels: bytes.toString('base64'),
    lab: simGrid,
    labMirror: simGrid.map((_, i) => simGrid[Math.floor(i / SW) * SW + (SW - 1 - (i % SW))]),
    hist,
    colors,
    bands: detectBands(keys, GW, GH),
    keys,
  };
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Entities without own geometry in world-atlas, carved out of a parent's polygons. */
const CARVE: Record<string, string> = {
  gf: 'fr', gp: 'fr', mq: 'fr', re: 'fr', yt: 'fr', sj: 'no', bv: 'no', bq: 'nl',
  cx: 'Indian Ocean Ter.', cc: 'Indian Ocean Ter.',
};

function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const R = 6371;
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Territories whose Natural Earth outline does not match the usual silhouette
 * (most of Western Sahara is drawn as part of Morocco).
 */
const NO_SILHOUETTE = new Set(['eh']);

const polysOf = (g: Geometry): number[][][][] =>
  g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];

/** Scattered archipelagos (most land outside the main island and little of the frame filled). */
const isScattered = (q?: { fill: number; share: number }) => !q || q.fill < 0.03 || (q.share < 0.25 && q.fill < 0.1);

/** Douglas–Peucker on a closed ring: simplify both halves so the endpoints differ. */
function simplifyRing(ring: number[][], eps: number): number[][] {
  if (ring.length < 8) return ring;
  const mid = Math.floor(ring.length / 2);
  const a = douglasPeucker(ring.slice(0, mid + 1), eps);
  const b = douglasPeucker(ring.slice(mid), eps);
  return [...a, ...b.slice(1)];
}

/** Douglas–Peucker on an open polyline of [lon, lat] points. */
function douglasPeucker(pts: number[][], eps: number): number[][] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-12;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const ringArea = (r: number[][]) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

/** Simplify relative to the territory's own size so small places keep their shape. */
function simplifyFeature(g: Geometry): Geometry {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polys) for (const [x, y] of p[0]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const diag = Math.hypot(maxX - minX, maxY - minY);
  const eps = Math.min(0.05, Math.max(0.001, diag * 0.0012));
  const out: number[][][][] = [];
  for (const p of polys) {
    // small islands get a proportionally finer tolerance so they keep their outline
    const ringEps = (r: number[][]) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return Math.min(eps, Math.max(0.0004, Math.hypot(x1 - x0, y1 - y0) * 0.006));
    };
    const outer = simplifyRing(p[0], ringEps(p[0]));
    // drop specks smaller than the simplification tolerance
    if (outer.length < 4 || ringArea(outer) < eps * eps * 0.5) continue;
    const holes = p.slice(1).map(r => simplifyRing(r, ringEps(r))).filter(r => r.length >= 4 && ringArea(r) > eps * eps * 0.5);
    out.push([outer, ...holes]);
  }
  return { type: 'MultiPolygon', coordinates: out };
}

function buildGeo(entities: Draft[]) {
  const ccn3ToId = new Map(countries.filter(c => c.ccn3).map(c => [c.ccn3, c.cca2.toLowerCase()]));
  const load = (res: '10m' | '50m') => {
    const atlas = JSON.parse(fs.readFileSync(path.join(pkgDir('world-atlas'), `countries-${res}.json`), 'utf8'));
    const fc = feature(atlas, atlas.objects.countries) as unknown as FeatureCollection<Polygon | MultiPolygon, { name: string }>;
    const m = new Map<string, Feature<Polygon | MultiPolygon, { name: string }>>();
    for (const f of fc.features) {
      const key = f.id != null ? ccn3ToId.get(String(f.id)) : undefined;
      const k = key ?? f.properties.name;
      const prev = m.get(k);
      // Several features can share a code (Australia and Ashmore and Cartier Is.): merge them.
      m.set(k, prev ? { ...prev, geometry: { type: 'MultiPolygon', coordinates: [...polysOf(prev.geometry), ...polysOf(f.geometry)] } } : f);
    }
    // features without an ISO code (Somaliland, Kosovo…) are matched by name
    for (const d of entities) {
      if (d.geoName && m.has(d.geoName)) {
        m.set(d.id, m.get(d.geoName)!);
        m.delete(d.geoName);
      }
    }
    return m;
  };
  // 50m for most territories, 10m detail for small ones.
  const byKey = load('50m');
  const fine = load('10m');
  const areaOf = new Map(entities.map(e => [e.id, e.area ?? 0]));

  // Carve overseas territories out of their parent geometry.
  const polys = polysOf;
  const carve = (byKey: Map<string, Feature<Polygon | MultiPolygon, { name: string }>>) => {
    const parents = new Set(Object.values(CARVE));
    for (const parentKey of parents) {
      const parent = byKey.get(parentKey);
      if (!parent) continue;
      const children = Object.entries(CARVE)
        .filter(([, p]) => p === parentKey)
        .map(([id]) => entities.find(e => e.id === id))
        .filter((e): e is Draft => !!e?.latlng);
      const keep: number[][][][] = [];
      const taken = new Map<string, number[][][][]>();
      for (const p of polys(parent.geometry)) {
        const [lon, lat] = geoCentroid({ type: 'Polygon', coordinates: p });
        // assign each polygon to the nearest child territory, if close enough
        let best: Draft | undefined;
        let bestD = 700;
        for (const ch of children) {
          const dist = haversine([lat, lon], ch.latlng!);
          if (dist < bestD) { bestD = dist; best = ch; }
        }
        if (best) taken.set(best.id, [...(taken.get(best.id) ?? []), p]);
        else keep.push(p);
      }
      parent.geometry = { type: 'MultiPolygon', coordinates: keep };
      for (const [childId, coords] of taken) {
        byKey.set(childId, { type: 'Feature', id: childId, properties: { name: childId }, geometry: { type: 'MultiPolygon', coordinates: coords } });
      }
    }
  };
  carve(byKey);
  carve(fine);
  for (const [k, f] of fine) {
    const a = areaOf.get(k);
    if (!byKey.has(k) || (a !== undefined && a < 200000) || ['somaliland', 'northern-cyprus', 'xk'].includes(k)) byKey.set(k, f);
  }
  // carved territories are small: take them from the detailed map
  for (const id of Object.keys(CARVE)) if (fine.has(id)) byKey.set(id, fine.get(id)!);

  const out: Feature<Geometry, Record<string, never>>[] = [];
  const has = new Set<string>();
  for (const d of entities) {
    const f = byKey.get(d.id);
    if (!f) continue;
    out.push({ type: 'Feature', id: d.id, properties: {}, geometry: f.geometry });
    has.add(d.id);
  }
  for (const f of out) f.geometry = simplifyFeature(f.geometry);
  const topo = topology({ countries: { type: 'FeatureCollection', features: out } as FeatureCollection });
  const quality = new Map(out.map(f => [String(f.id), { fill: silhouetteFill(f), share: mainPartShare(f.geometry) }]));
  return { topo: quantize(topo as never, 1e5), has, quality };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

fs.mkdirSync(OUT, { recursive: true });

const flags: Record<string, string> = {};
const feats = new Map<string, Feat>();
const ratios = new Map<string, number>();
for (const d of drafts) {
  const opt = optimiseSvg(d.id, d.svgRaw);
  flags[d.id] = opt;
  ratios.set(d.id, flagRatio(d.svgRaw, opt));
  feats.set(d.id, features(opt));
}

// Pairwise similarity
const list = drafts.map(d => d.id);
const spatial = (a: Feat, b: Feat) => a.lab.reduce((s, l, i) => s + dE(l, b.lab[i]), 0) / a.lab.length;
// Mirror images (Ireland / Côte d'Ivoire) are easy to confuse, so they count as similar too.
const spatialMirror = (a: Feat, b: Feat) => a.lab.reduce((s, l, i) => s + dE(l, b.labMirror[i]), 0) / a.lab.length;
const palette = (a: Feat, b: Feat) => a.hist.reduce((s, v, i) => s + Math.abs(v - b.hist[i]), 0) / 2;
/**
 * Share of the flag that is a different named colour. Shades of the same
 * colour (Chad / Romania, Upper Volta / German Empire) look identical to a player.
 */
const keyDiff = (a: Feat, b: Feat) => a.keys.reduce((n, k, i) => n + (k === b.keys[i] ? 0 : 1), 0) / a.keys.length;
/** Flags with emblems differ by more than this (Paraguay / Netherlands ≈ 0.7%). */
const SAME_FLAG_MAX_DIFF = 0.005;
const similar = new Map<string, string[]>();
const sameFlag = new Map<string, string[]>();
for (const a of list) {
  const fa = feats.get(a)!;
  const scored = list
    .filter(b => b !== a)
    .map(b => {
      const fb = feats.get(b)!;
      const s = spatial(fa, fb);
      const look = Math.min(s, 1.15 * spatialMirror(fa, fb));
      const same = s < 2 || keyDiff(fa, fb) < SAME_FLAG_MAX_DIFF;
      return { b, s, same, d: 0.6 * (look / 60) + 0.4 * palette(fa, fb) };
    })
    .sort((x, y) => x.d - y.d);
  sameFlag.set(a, scored.filter(x => x.same).map(x => x.b));
  similar.set(a, scored.filter(x => !x.same).slice(0, 15).map(x => x.b));
}

const { topo, has, quality } = buildGeo(drafts);

const entities: Entity[] = drafts
  .map(({ svgRaw: _svg, geoName: _g, ...d }) => {
    const f = feats.get(d.id)!;
    return {
      ...d,
      ratio: +ratios.get(d.id)!.toFixed(3),
      colors: f.colors,
      similar: similar.get(d.id)!,
      sameFlag: sameFlag.get(d.id)!,
      bands: f.bands,
      symH: f.symH,
      symV: f.symV,
      // tiny territories and scattered archipelagos are not recognisable as a silhouette
      geo: has.has(d.id)
        ? (d.area ?? Infinity) < 1000 || isScattered(quality.get(d.id)) || NO_SILHOUETTE.has(d.id)
          ? 'tiny'
          : 'shape'
        : d.base && d.latlng ? 'marker' : null,
    } satisfies Entity;
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

const write = (file: string, data: unknown) => {
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(data));
  console.log(`${file}: ${(fs.statSync(path.join(OUT, file)).size / 1024).toFixed(0)} KB`);
};
write('entities.json', entities);
write('flags.json', flags);
write('pixels.json', Object.fromEntries([...feats].map(([id, f]) => [id, f.pixels])));
write('geo.json', topo);
console.log(`${entities.length} entities (${entities.filter(e => e.base).length} base)`);
