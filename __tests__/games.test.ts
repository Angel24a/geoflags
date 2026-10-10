import { BY_ID, ENTITIES, FLAGS } from '@/data';
import { areNeighbors, makeChain, shortestPath } from '@/lib/chain';
import { pickSortable, sameDesign } from '@/lib/games';
import { filterPool, PRESETS } from '@/lib/pool';
import { mulberry32 } from '@/lib/random';
import { colorTokens, makeVariants, mirror } from '@/lib/variants';

describe('neighbour chain', () => {
  it('finds shortest land paths', () => {
    expect(shortestPath('es', 'de')).toEqual(['es', 'fr', 'de']);
    expect(shortestPath('es', 'jp')).toBeNull();
    expect(areNeighbors('pt', 'es')).toBe(true);
  });

  it('creates solvable puzzles inside the pool', () => {
    const pool = filterPool(PRESETS.find(p => p.key === 'europe')!.filter);
    const p = makeChain(pool, mulberry32(5))!;
    expect(p.optimal[0]).toBe(p.start.id);
    expect(p.optimal[p.optimal.length - 1]).toBe(p.target.id);
    expect(p.optimal.length - 1).toBeGreaterThanOrEqual(2);
  });
});

describe('spot the error', () => {
  it('reads colours from the SVG', () => {
    expect(colorTokens(FLAGS.fr).length).toBeGreaterThanOrEqual(3);
  });

  it('creates distinct altered flags', () => {
    for (const id of ['fr', 'de', 'jp', 'br', 'es-md', 'kurdistan']) {
      const v = makeVariants(BY_ID.get(id)!, FLAGS[id], 3, mulberry32(6));
      expect(v.length).toBe(3);
      expect(new Set([FLAGS[id], ...v.map(x => x.svg)]).size).toBe(4);
    }
  });

  it('does not mirror symmetric flags', () => {
    const v = makeVariants(BY_ID.get('jp')!, FLAGS.jp, 3, mulberry32(7));
    expect(v.some(x => x.kind === 'mirror')).toBe(false);
  });

  it('mirrors around the viewBox', () => {
    expect(mirror('<svg viewBox="0 0 30 20"><rect/></svg>', 'h')).toContain('matrix(-1 0 0 1 30 0)');
  });
});

describe('build the flag and sort', () => {
  it('compares stripe designs', () => {
    expect(sameDesign(BY_ID.get('fr')!, 'v', ['blue', 'white', 'red'])).toBe(true);
    expect(sameDesign(BY_ID.get('fr')!, 'h', ['blue', 'white', 'red'])).toBe(false);
  });

  it('picks items without ties', () => {
    const items = pickSortable(ENTITIES, e => e.population, mulberry32(8));
    expect(new Set(items.map(e => e.population)).size).toBe(items.length);
  });
});
