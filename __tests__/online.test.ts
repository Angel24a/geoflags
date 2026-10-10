import { describe, expect, it } from '@jest/globals';

import { rankedKey } from '@/lib/online/api';
import { dailyGame, DATA_VERSION, normalizeCode, pointsFor, randomCode, seededQuestions, seedFromString } from '@/lib/online/seeded';
import { PRESETS } from '@/lib/pool';
import { mulberry32 } from '@/lib/random';

describe('online games', () => {
  it('builds exactly the same questions from the same seed', () => {
    const cfg = { mode: 'flag-name', pool: 'all', count: 10 };
    const a = seededQuestions(cfg, 1234);
    const b = seededQuestions(cfg, 1234);
    expect(a).toHaveLength(10);
    expect(a.map(q => [q.target.id, ...q.options.map(o => o.id)])).toEqual(b.map(q => [q.target.id, ...q.options.map(o => o.id)]));
    expect(seededQuestions(cfg, 999).map(q => q.target.id)).not.toEqual(a.map(q => q.target.id));
  });

  it('respects the mode and the pool', () => {
    const qs = seededQuestions({ mode: 'shape-name', pool: 'europe', count: 15 }, 7);
    expect(qs.every(q => q.target.geo === 'shape' && q.target.continent === 'europe')).toBe(true);
    const map = seededQuestions({ mode: 'flag-map', pool: 'all', count: 5 }, 7);
    expect(map.every(q => q.options.length === 0)).toBe(true);
  });

  it('rewards speed', () => {
    expect(pointsFor(false, 100)).toBe(0);
    expect(pointsFor(true, 0)).toBe(150);
    expect(pointsFor(true, 5000)).toBe(125);
    expect(pointsFor(true, 60000)).toBe(100);
  });

  it('has one daily game per day', () => {
    expect(dailyGame('2026-10-10')).toEqual(dailyGame('2026-10-10'));
    expect(dailyGame('2026-10-10').seed).not.toBe(dailyGame('2026-10-11').seed);
    expect(dailyGame('2026-10-10').cfg).toMatchObject({ pool: 'base', count: 10 });
  });

  it('makes readable codes', () => {
    const code = randomCode(6, mulberry32(1));
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(normalizeCode(' ab-12 ')).toBe('AB12');
    expect(seedFromString('x')).toBe(seedFromString('x'));
    expect(DATA_VERSION).toMatch(/^[0-9a-z]+$/);
  });

  it('only ranks solo challenges played with a preset pool', () => {
    const all = PRESETS[0].filter;
    expect(rankedKey('survival:flag>name:choice:x', all)).toBe('survival:flag>name:choice:all');
    expect(rankedKey('classic:flag>name:choice:x', all)).toBeNull();
    expect(rankedKey('timed:flag>map:map:x', { categories: ['spain', 'cultural'], continents: [] })).toBeNull();
  });
});
