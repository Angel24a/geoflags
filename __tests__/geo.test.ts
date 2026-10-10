import { describe, expect, it } from '@jest/globals';
import { bearing, compass, distanceKm, featureAt, hasShape, locate, shapePath } from '@/lib/geo';

describe('geo', () => {
  it('finds the territory under a point', () => {
    expect(featureAt([-3.7, 40.4])).toBe('es');
    expect(featureAt([2.35, 48.85])).toBe('fr');
    expect(featureAt([-53, 4])).toBe('gf'); // carved out of France
    expect(featureAt([-30, 30])).toBeNull(); // Atlantic
  });

  it('has geometry for partially recognised states', () => {
    expect(hasShape('somaliland')).toBe(true);
    expect(hasShape('xk')).toBe(true);
    expect(shapePath('es', 100, 100)).toMatch(/^M/);
  });

  it('computes distances and bearings', () => {
    const madrid: [number, number] = [-3.7, 40.4];
    const paris: [number, number] = [2.35, 48.85];
    expect(distanceKm(madrid, paris)).toBeGreaterThan(1000);
    expect(distanceKm(madrid, paris)).toBeLessThan(1100);
    expect(compass(bearing(madrid, paris))).toBe('NE');
    expect(locate('es')).toEqual([-4, 40]);
  });
});
