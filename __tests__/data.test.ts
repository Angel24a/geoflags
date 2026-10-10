import { describe, expect, it } from '@jest/globals';
import { BY_ID, ENTITIES, FLAGS, PIXELS } from '@/data';

describe('generated data', () => {
  it('has the 254 base flags plus the extras', () => {
    expect(ENTITIES.filter(e => e.base)).toHaveLength(254);
    expect(ENTITIES.length).toBeGreaterThan(330);
  });

  it('uses unique ids and has a flag and pixels for every entity', () => {
    expect(new Set(ENTITIES.map(e => e.id)).size).toBe(ENTITIES.length);
    for (const e of ENTITIES) {
      expect(FLAGS[e.id]).toMatch(/^<svg[^>]*viewBox=/);
      expect(PIXELS[e.id]).toBeTruthy();
      expect(e.ratio).toBeGreaterThan(0.8);
      expect(e.ratio).toBeLessThan(2.7);
    }
  });

  it('contains all 19 Spanish autonomous communities and cities', () => {
    expect(ENTITIES.filter(e => e.category === 'spain')).toHaveLength(19);
  });

  it('only references existing entities', () => {
    for (const e of ENTITIES) {
      for (const id of [...e.similar, ...e.sameFlag, ...e.borders]) expect(BY_ID.has(id)).toBe(true);
      expect(e.similar).not.toContain(e.id);
    }
  });

  it('groups identical flags', () => {
    expect(BY_ID.get('fr')!.sameFlag).toEqual(expect.arrayContaining(['re', 'bl']));
    expect(BY_ID.get('no')!.sameFlag).toEqual(expect.arrayContaining(['bv', 'sj']));
    expect(BY_ID.get('td')!.sameFlag).not.toContain('ro');
  });

  it('finds visually similar flags', () => {
    expect(BY_ID.get('td')!.similar.slice(0, 3)).toContain('ro');
    expect(BY_ID.get('id')!.similar.slice(0, 3)).toContain('mc');
    expect(BY_ID.get('ie')!.similar.slice(0, 3)).toContain('ci');
  });

  it('detects striped flags', () => {
    expect(BY_ID.get('fr')!.bands).toEqual({ dir: 'v', colors: ['blue', 'white', 'red'], weights: expect.any(Array) });
    expect(BY_ID.get('de')!.bands?.colors).toEqual(['black', 'red', 'yellow']);
    expect(BY_ID.get('es')!.bands).toBeUndefined(); // coat of arms
  });

  it('uses Spanish names and capitals', () => {
    expect(BY_ID.get('gb')!.capital).toBe('Londres');
    expect(BY_ID.get('cn')!.capital).toBe('Pekín');
    expect(BY_ID.get('sz')!.name).toBe('Esuatini');
  });
});
