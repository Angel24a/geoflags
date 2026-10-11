import entitiesJson from './generated/entities.json';
import flagsJson from './generated/flags.json';
import type { Category, ColorKey, Continent, Entity } from './types';

export * from './types';

export const ENTITIES = entitiesJson as Entity[];
export const BY_ID = new Map(ENTITIES.map(e => [e.id, e]));
export const FLAGS = flagsJson as Record<string, string>;

// Only "Pixelada o zoom" needs the pixel grids: load them on first use instead of at start-up.
let pixelsCache: Record<string, string> | null = null;
/** Base64 RGB 24×16 grid of a flag. */
export function pixelsOf(id: string): string {
  pixelsCache ??= require('./generated/pixels.json') as Record<string, string>;
  return pixelsCache[id];
}

export function entity(id: string): Entity {
  const e = BY_ID.get(id);
  if (!e) throw new Error(`Unknown entity ${id}`);
  return e;
}

export const CATEGORY_ORDER: Category[] = [
  'sovereign', 'limited', 'territory', 'spain', 'historical', 'cultural', 'organization',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  sovereign: 'Estados soberanos',
  limited: 'No reconocidos o con reconocimiento limitado',
  territory: 'Territorios y naciones constituyentes',
  spain: 'Comunidades autónomas',
  historical: 'Históricas',
  cultural: 'Pueblos y regiones culturales',
  organization: 'Organizaciones',
};

export const CATEGORY_SHORT: Record<Category, string> = {
  sovereign: 'Soberanos',
  limited: 'No reconocidos',
  territory: 'Territorios',
  spain: 'CC. AA.',
  historical: 'Históricas',
  cultural: 'Culturales',
  organization: 'Organizaciones',
};

export const CONTINENT_ORDER: Continent[] = [
  'europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania', 'antarctica', 'world',
];

export const CONTINENT_LABEL: Record<Continent, string> = {
  europe: 'Europa',
  asia: 'Asia',
  africa: 'África',
  'north-america': 'América del Norte',
  'south-america': 'América del Sur',
  oceania: 'Oceanía',
  antarctica: 'Antártida',
  world: 'Mundial',
};

export const COLOR_ORDER: ColorKey[] = [
  'red', 'maroon', 'orange', 'yellow', 'green', 'lightblue', 'blue', 'purple', 'white', 'black',
];

export const COLOR_LABEL: Record<ColorKey, string> = {
  white: 'Blanco',
  black: 'Negro',
  red: 'Rojo',
  maroon: 'Granate',
  orange: 'Naranja',
  yellow: 'Amarillo',
  green: 'Verde',
  lightblue: 'Celeste',
  blue: 'Azul',
  purple: 'Morado',
};

export const COLOR_HEX: Record<ColorKey, string> = {
  white: '#ffffff',
  black: '#111111',
  red: '#d52b1e',
  maroon: '#8d1b3d',
  orange: '#f7941d',
  yellow: '#fcd116',
  green: '#009a44',
  lightblue: '#6cace4',
  blue: '#0039a6',
  purple: '#6c3483',
};

/** Subregions (Spanish labels) that have at least a few entities, for "complete the region". */
export const SUBREGIONS = [...new Set(ENTITIES.map(e => e.subregion).filter((s): s is string => !!s))].sort((a, b) =>
  a.localeCompare(b, 'es'),
);
