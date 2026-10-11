import { describe, expect, it } from '@jest/globals';
import { BY_ID, ENTITIES } from '@/data';
import {
  estimatePoints, formatPopulation, fromSlider, hasPopulation, nextHigherLower, populationOptions, populationTargets, roundPopulation, toSlider,
} from '@/lib/population-game';
import { mulberry32 } from '@/lib/random';

describe('population game', () => {
  it('only asks about current territories', () => {
    const t = populationTargets(ENTITIES);
    expect(t.length).toBeGreaterThan(200);
    expect(t.some(e => e.id === 'kurdistan' || e.id === 'ussr' || e.id === 'bv')).toBe(false);
    expect(populationTargets(ENTITIES.filter(e => e.category === 'organization')).length).toBe(t.length);
  });

  it('rounds and formats figures', () => {
    expect(roundPopulation(47_519_628)).toBe(48_000_000);
    expect(roundPopulation(35)).toBe(35);
    expect(formatPopulation(48_000_000)).toBe('48 millones');
    expect(formatPopulation(8_400_000)).toBe('8,4 millones');
    expect(formatPopulation(85_000)).toBe('85.000');
  });

  it('builds four options far enough apart', () => {
    const rng = mulberry32(3);
    const all = populationTargets(ENTITIES);
    for (const [d, min] of [['easy', 4], ['normal', 2], ['hard', 1.35]] as const) {
      for (const e of all.slice(0, 80)) {
        const o = populationOptions(e, all, d, rng);
        expect(o).toHaveLength(4);
        expect(o).toContain(roundPopulation(e.population!));
        for (const a of o) for (const b of o) if (a !== b) expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(min * 0.99);
      }
    }
  });

  it('keeps "higher or lower" pairs apart on easy', () => {
    const all = populationTargets(ENTITIES);
    const es = BY_ID.get('es')!;
    for (let k = 0; k < 20; k++) {
      const n = nextHigherLower(es, all, 'easy', mulberry32(k));
      expect(hasPopulation(n)).toBe(true);
      expect(Math.max(n.population!, es.population!) / Math.min(n.population!, es.population!)).toBeGreaterThanOrEqual(3);
    }
  });

  it('scores estimates on a log scale', () => {
    expect(estimatePoints(1000, 1000)).toBe(100);
    expect(estimatePoints(2000, 1000)).toBe(70);
    expect(estimatePoints(10_000, 1000)).toBe(0);
    expect(fromSlider(toSlider(47_000_000))).toBeCloseTo(47_000_000, -3);
  });
});
