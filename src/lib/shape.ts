import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoPath } from 'd3-geo';
import type { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';

type Poly = number[][][];

const polysOf = (g: Geometry): Poly[] =>
  g.type === 'Polygon' ? [(g as Polygon).coordinates] : g.type === 'MultiPolygon' ? (g as MultiPolygon).coordinates : [];

interface Part {
  p: Poly;
  a: number;
  c: [number, number];
}

function parts(g: Geometry): Part[] {
  return polysOf(g).map(p => {
    const poly = { type: 'Polygon' as const, coordinates: p };
    return { p, a: geoArea(poly), c: geoCentroid(poly) as [number, number] };
  });
}

/**
 * Geometry used to draw a territory's silhouette. Drops islands that are both
 * small (< 1.5 % of the largest part) or far away from the main part, which
 * otherwise shrink the main shape to a speck (Hawaii next to the USA,
 * Rodrigues next to Mauritius…). Nearby islands (Japan, Greece) are kept.
 */
export function silhouette<P extends GeoJsonProperties>(f: Feature<Geometry, P>): Feature<MultiPolygon, P> {
  const ps = parts(f.geometry);
  if (!ps.length) return { ...f, geometry: { type: 'MultiPolygon', coordinates: [] } };
  const main = ps.reduce((a, b) => (b.a > a.a ? b : a));
  const reach = 3 * Math.sqrt(main.a); // radians, ~3 × the main part's size
  const keep = ps.filter(x => x === main || (x.a >= main.a * 0.015 && geoDistance(x.c, main.c) <= reach));
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: keep.map(x => x.p) } };
}

/** Share of the territory's area in its largest part (low = scattered archipelago). */
export function mainPartShare(g: Geometry): number {
  const ps = parts(g);
  const total = ps.reduce((s, x) => s + x.a, 0);
  return total ? Math.max(...ps.map(x => x.a)) / total : 0;
}

/**
 * How much of its fitted square the silhouette fills (0–1). Very low values
 * mean scattered archipelagos that are unrecognisable as a shape.
 */
export function silhouetteFill<P extends GeoJsonProperties>(f: Feature<Geometry, P>, size = 200): number {
  const s = silhouette(f);
  const [lon, lat] = geoCentroid(s);
  const proj = geoAzimuthalEqualArea().rotate([-lon, -lat]).fitSize([size, size], s);
  const path = geoPath(proj);
  return path.area(s) / (size * size);
}
