import type { ColorKey, Entity } from '@/data';

/** "Build the flag": does the chosen design match the flag's stripes? */
export function sameDesign(e: Entity, dir: 'h' | 'v', colors: ColorKey[]): boolean {
  if (!e.bands) return false;
  return e.bands.dir === dir && e.bands.colors.length === colors.length && e.bands.colors.every((c, i) => c === colors[i]);
}
