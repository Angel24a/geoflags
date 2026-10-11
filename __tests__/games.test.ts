import { describe, expect, it } from '@jest/globals';
import { BY_ID, ENTITIES, FLAGS } from '@/data';
import { areNeighbors, makeChain, shortestPath } from '@/lib/chain';
import { sameDesign } from '@/lib/games';
import { correctOrder, criterion, CRITERIA, pickSortItems, positionsOk, ratioLabel } from '@/lib/sort';
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

});

describe('sort', () => {
  it('picks items without ties for every criterion and size', () => {
    const rng = mulberry32(8);
    for (const def of CRITERIA) {
      for (const n of [3, 5, 10]) {
        for (const d of ['easy', 'normal', 'hard'] as const) {
          const items = pickSortItems(ENTITIES, def.get, n, d, rng);
          expect(items).toHaveLength(n);
          expect(items.every(e => def.get(e) !== undefined)).toBe(true);
          expect(new Set(items.map(def.get)).size).toBe(n);
        }
      }
    }
  });

  it('spreads values on easy and keeps them close on hard', () => {
    const pop = criterion('population').get;
    const spread = (items: typeof ENTITIES) => {
      const v = items.map(e => Math.log(pop(e)!)).sort((a, b) => a - b);
      return v[v.length - 1] - v[0];
    };
    const avg = (d: 'easy' | 'hard') => {
      const rng = mulberry32(2);
      let t = 0;
      for (let k = 0; k < 30; k++) t += spread(pickSortItems(ENTITIES, pop, 5, d, rng));
      return t / 30;
    };
    expect(avg('easy')).toBeGreaterThan(avg('hard') * 2);
  });

  it('orders and scores, with ties interchangeable', () => {
    const items = ['cn', 'in', 'us'].map(id => BY_ID.get(id)!);
    const area = criterion('area').get;
    expect(correctOrder(items, area)[0]).toBe('cn');
    expect(correctOrder(items, area, true)[0]).toBe('in');
    const ratio = criterion('ratio').get;
    const flags = ['fr', 'it', 'ch'].map(id => BY_ID.get(id)!); // 2:3, 2:3, 1:1
    expect(positionsOk(['it', 'fr', 'ch'], flags, ratio)).toEqual([true, true, true]);
    expect(positionsOk(['ch', 'fr', 'it'], flags, ratio)).toEqual([false, true, false]);
  });

  it('labels flag proportions', () => {
    expect(ratioLabel(1.5)).toBe('2:3');
    expect(ratioLabel(2)).toBe('1:2');
    expect(ratioLabel(1)).toBe('1:1');
    expect(ratioLabel(BY_ID.get('us')!.ratio)).toBe('10:19');
  });
});
