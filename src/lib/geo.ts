import {
  geoAzimuthalEqualArea, geoCentroid, geoContains, geoDistance, geoNaturalEarth1, geoPath,
  type GeoProjection,
} from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';

import geoTopo from '@/data/generated/geo.json';
import { BY_ID } from '@/data';
import { silhouette } from './shape';

type F = Feature<Geometry>;
let featureCache: Map<string, F> | null = null;

export function features(): Map<string, F> {
  if (!featureCache) {
    const topo = geoTopo as unknown as Parameters<typeof feature>[0];
    const fc = feature(topo, (topo as unknown as { objects: { countries: never } }).objects.countries) as unknown as FeatureCollection;
    featureCache = new Map(fc.features.map(f => [String(f.id), f as F]));
  }
  return featureCache;
}

export const hasShape = (id: string) => features().has(id);

/** [lon, lat] used for distances and markers. */
export function locate(id: string): [number, number] | null {
  const e = BY_ID.get(id);
  if (e?.latlng) return [e.latlng[1], e.latlng[0]];
  const f = features().get(id);
  return f ? (geoCentroid(f) as [number, number]) : null;
}

/** Path of a single territory, centred with an equal-area projection and fitted into w×h. */
export function shapePath(id: string, w: number, h: number, pad = 4): string | null {
  const full = features().get(id);
  if (!full) return null;
  const f = silhouette(full);
  const [lon, lat] = geoCentroid(f);
  const proj = geoAzimuthalEqualArea().rotate([-lon, -lat]).fitExtent([[pad, pad], [w - pad, h - pad]], f);
  return geoPath(proj)(f);
}

export function worldProjection(w: number, h: number): GeoProjection {
  return geoNaturalEarth1().fitExtent([[2, 2], [w - 2, h - 2]], { type: 'Sphere' });
}

export interface WorldShape {
  id: string;
  d: string;
}

const worldCache = new Map<string, { shapes: WorldShape[]; proj: GeoProjection; sphere: string }>();

export function world(w: number, h: number) {
  const key = `${Math.round(w)}x${Math.round(h)}`;
  let v = worldCache.get(key);
  if (!v) {
    const proj = worldProjection(w, h);
    const path = geoPath(proj);
    const shapes: WorldShape[] = [];
    for (const [id, f] of features()) {
      const d = path(f);
      if (d) shapes.push({ id, d });
    }
    v = { shapes, proj, sphere: path({ type: 'Sphere' }) ?? '' };
    worldCache.set(key, v);
  }
  return v;
}

/** Territory containing the point, if any. */
export function featureAt(lonlat: [number, number]): string | null {
  for (const [id, f] of features()) {
    if (geoContains(f, lonlat)) return id;
  }
  return null;
}

export const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: [number, number], b: [number, number]): number {
  return geoDistance(a, b) * EARTH_RADIUS_KM;
}

/** Initial bearing from a to b in degrees (0 = north, clockwise). Inputs are [lon, lat]. */
export function bearing(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180;
  const [l1, p1] = [a[0] * r, a[1] * r];
  const [l2, p2] = [b[0] * r, b[1] * r];
  const y = Math.sin(l2 - l1) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export const compass = (deg: number) => DIRS[Math.round(deg / 45) % 8];

/** 0–100 proximity score: 100 at the target, 0 at the antipode. */
export const proximity = (km: number) => Math.round(Math.max(0, 100 * (1 - km / (Math.PI * EARTH_RADIUS_KM))));
