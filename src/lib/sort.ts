import { BY_ID, ENTITIES, type Entity } from '@/data';
import { density } from './population';
import { pick, shuffle, type Rng } from './random';

/** "Sort" game: what is compared, and how a round is set up. */
export type SortCriterion =
  | 'population'
  | 'area'
  | 'density'
  | 'lat'
  | 'lng'
  | 'distance'
  | 'neighbors'
  | 'alpha'
  | 'ratio'
  | 'founded';

export type SortDifficulty = 'easy' | 'normal' | 'hard';
export type SortShow = 'both' | 'flag' | 'name';

export interface SortOptions {
  /** A criterion, or 'random' for a different one each round. */
  criterion: SortCriterion | 'random';
  count: number;
  difficulty: SortDifficulty;
  show: SortShow;
  /** Ask for the opposite order (e.g. from fewer to more inhabitants). */
  reverse: boolean;
}

export const DEFAULT_SORT: SortOptions = { criterion: 'population', count: 5, difficulty: 'normal', show: 'both', reverse: false };
export const SORT_COUNTS = [3, 5, 7, 10];

export interface CriterionDef {
  key: SortCriterion;
  label: string;
  /** Order asked for, first item first (larger values first). */
  order: string;
  reversed: string;
  get: (e: Entity) => number | undefined;
  fmt: (v: number) => string;
}

const es = (v: number, digits = 0) => v.toLocaleString('es-ES', { maximumFractionDigits: digits });

// Madrid
const FROM: [number, number] = [40.42, -3.7];

function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

const neighbors = (e: Entity) => e.borders.filter(b => BY_ID.has(b)).length;

/** First year in strings like "1871–1918". */
export function foundedYear(e: Entity): number | undefined {
  const m = e.years?.match(/\d{3,4}/);
  return m ? Number(m[0]) : undefined;
}

/** Alphabetical position: earlier names get larger values so "larger first" reads A→Z. */
const ALPHA = new Map([...ENTITIES].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((e, k) => [e.id, ENTITIES.length - k]));

export const CRITERIA: CriterionDef[] = [
  {
    key: 'population', label: 'Población', order: 'De más a menos habitantes', reversed: 'De menos a más habitantes',
    // current territories only: no peoples, historical censuses or uninhabited places
    get: e => (e.population && !e.popPeople && e.category !== 'historical' ? e.population : undefined),
    fmt: v => (v < 1e6 ? `${es(v)} hab.` : `${es(v / 1e6, 1)} M hab.`),
  },
  {
    key: 'area', label: 'Superficie', order: 'De mayor a menor superficie', reversed: 'De menor a mayor superficie',
    get: e => e.area, fmt: v => `${es(Math.round(v))} km²`,
  },
  {
    key: 'density', label: 'Densidad', order: 'De más a menos densamente poblado', reversed: 'De menos a más densamente poblado',
    get: density, fmt: v => `${es(v, v < 10 ? 1 : 0)} hab./km²`,
  },
  {
    key: 'lat', label: 'Latitud', order: 'De más al norte a más al sur', reversed: 'De más al sur a más al norte',
    get: e => e.latlng?.[0], fmt: v => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? 'N' : 'S'}`,
  },
  {
    key: 'lng', label: 'Longitud', order: 'De más al oeste a más al este', reversed: 'De más al este a más al oeste',
    get: e => (e.latlng ? -e.latlng[1] : undefined), fmt: v => `${Math.abs(v).toFixed(1)}° ${-v >= 0 ? 'E' : 'O'}`,
  },
  {
    key: 'distance', label: 'Distancia a España', order: 'Del más lejano al más cercano a España', reversed: 'Del más cercano al más lejano a España',
    get: e => (e.latlng && e.id !== 'es' && e.category !== 'spain' ? haversine(FROM, e.latlng) : undefined), fmt: v => `${es(Math.round(v / 10) * 10)} km`,
  },
  {
    key: 'neighbors', label: 'Nº de vecinos', order: 'De más a menos países vecinos', reversed: 'De menos a más países vecinos',
    get: e => (neighbors(e) > 0 ? neighbors(e) : undefined), fmt: v => `${v} ${v === 1 ? 'vecino' : 'vecinos'}`,
  },
  {
    key: 'alpha', label: 'Alfabético', order: 'Por orden alfabético (A → Z)', reversed: 'Por orden alfabético inverso (Z → A)',
    get: e => ALPHA.get(e.id), fmt: () => '',
  },
  {
    key: 'ratio', label: 'Forma de la bandera', order: 'De la bandera más alargada a la más cuadrada', reversed: 'De la bandera más cuadrada a la más alargada',
    get: e => e.ratio, fmt: v => `proporción ${ratioLabel(v)}`,
  },
  {
    key: 'founded', label: 'Antigüedad', order: 'De la más reciente a la más antigua', reversed: 'De la más antigua a la más reciente',
    get: foundedYear, fmt: v => `desde ${v}`,
  },
];

export const criterion = (k: SortCriterion) => CRITERIA.find(c => c.key === k)!;

/** Flag proportion as height:width with small integers (2:3, 1:2, 1:1…). */
export function ratioLabel(r: number): string {
  let best = { h: 1, w: 1, err: Infinity };
  for (let h = 1; h <= 20; h++) {
    const w = Math.round(r * h);
    const err = Math.abs(w / h - r);
    if (err < best.err - 1e-3) best = { h, w, err };
  }
  return `${best.h}:${best.w}`;
}

/** Entities that can be sorted by `get`, falling back to everything when the pool is too small. */
export function sortable(pool: Entity[], get: (e: Entity) => number | undefined, count: number): Entity[] {
  const usable = pool.filter(e => get(e) !== undefined);
  return usable.length >= count ? usable : ENTITIES.filter(e => get(e) !== undefined);
}

/**
 * Picks `count` entities to sort, avoiding ties whenever there are enough
 * different values (many flags are 2:3, many countries have 2 neighbours…).
 * - easy: values spread over the whole range (big gaps)
 * - hard: neighbouring values (close to each other)
 */
export function pickSortItems(
  pool: Entity[],
  get: (e: Entity) => number | undefined,
  count: number,
  difficulty: SortDifficulty = 'normal',
  rng: Rng = Math.random,
): Entity[] {
  const list = sortable(pool, get, count);
  const ranked = [...list].sort((a, b) => get(a)! - get(b)!);
  const n = ranked.length;
  const chosen: Entity[] = [];
  const used = new Set<number>();
  /** Adds the first entity of `seq` with a value not taken yet. */
  const takeOne = (seq: Entity[]) => {
    const e = seq.find(x => !used.has(get(x)!) && !chosen.includes(x));
    if (!e) return false;
    chosen.push(e);
    used.add(get(e)!);
    return true;
  };

  if (difficulty === 'easy' && n >= count * 2) {
    // one item from each of `count` equal slices of the ranking
    for (let k = 0; k < count; k++) takeOne(shuffle(ranked.slice(Math.floor((k * n) / count), Math.floor(((k + 1) * n) / count)), rng));
  } else if (difficulty === 'hard' && n > count * 3) {
    // a narrow window of the ranking, widened until it holds enough different values
    let span = Math.max(count * 2, Math.round(n / 12));
    for (;;) {
      const start = Math.floor(rng() * (n - span + 1));
      const window = ranked.slice(start, start + span);
      if (new Set(window.map(e => get(e))).size >= count || span >= n) {
        for (const e of shuffle(window, rng)) if (chosen.length < count) takeOne([e]);
        break;
      }
      span = Math.min(n, span * 2);
    }
  }
  // normal, and whatever the slices or the window could not fill
  for (const e of shuffle(list, rng)) if (chosen.length < count) takeOne([e]);
  // not enough different values: allow ties
  for (const e of shuffle(list, rng)) if (chosen.length < count && !chosen.includes(e)) chosen.push(e);
  return shuffle(chosen, rng);
}

export function randomCriterion(rng: Rng = Math.random, except?: SortCriterion): SortCriterion {
  return pick(CRITERIA.filter(c => c.key !== except), rng).key;
}

/** Correct order (ids), larger values first unless reversed. */
export function correctOrder(items: Entity[], get: (e: Entity) => number | undefined, reverse = false): string[] {
  const sign = reverse ? -1 : 1;
  return [...items].sort((a, b) => sign * (get(b)! - get(a)!)).map(e => e.id);
}

/**
 * Which positions of the player's order are right. Items with the same value
 * are interchangeable.
 */
export function positionsOk(order: string[], items: Entity[], get: (e: Entity) => number | undefined, reverse = false): boolean[] {
  const correct = correctOrder(items, get, reverse);
  const value = (id: string) => get(BY_ID.get(id)!);
  return order.map((id, k) => correct[k] !== undefined && value(id) === value(correct[k]));
}
