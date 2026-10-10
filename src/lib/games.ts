import { ENTITIES, type ColorKey, type Entity } from '@/data';
import { sample, type Rng } from './random';

/** "Build the flag": does the chosen design match the flag's stripes? */
export function sameDesign(e: Entity, dir: 'h' | 'v', colors: ColorKey[]): boolean {
  if (!e.bands) return false;
  return e.bands.dir === dir && e.bands.colors.length === colors.length && e.bands.colors.every((c, i) => c === colors[i]);
}

export const SORT_COUNT = 5;

/** "Sort": picks entities that all have the value, without ties. */
export function pickSortable(pool: Entity[], get: (e: Entity) => number | undefined, rng: Rng = Math.random): Entity[] {
  const usable = pool.filter(e => get(e) !== undefined);
  const list = usable.length >= SORT_COUNT ? usable : ENTITIES.filter(e => e.base && get(e) !== undefined);
  for (let attempt = 0; attempt < 20; attempt++) {
    const s = sample(list, SORT_COUNT, rng);
    if (new Set(s.map(e => get(e))).size === SORT_COUNT) return s;
  }
  return sample(list, SORT_COUNT, rng);
}
