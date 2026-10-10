import {
  CATEGORY_ORDER, CATEGORY_SHORT, CONTINENT_LABEL, ENTITIES,
  type Category, type Continent, type Entity,
} from '@/data';

/** Which flags take part in the games. Empty arrays mean "no restriction". */
export interface PoolFilter {
  categories: Category[];
  continents: Continent[];
  /** Restrict to the 254 base flags. */
  baseOnly?: boolean;
}

export const ALL: PoolFilter = { categories: [], continents: [] };

export interface Preset {
  key: string;
  label: string;
  filter: PoolFilter;
}

export const PRESETS: Preset[] = [
  { key: 'all', label: 'Todas', filter: ALL },
  { key: 'base', label: 'Las 254', filter: { categories: [], continents: [], baseOnly: true } },
  { key: 'sovereign', label: 'Solo soberanos', filter: { categories: ['sovereign'], continents: [] } },
  { key: 'europe', label: 'Solo Europa', filter: { categories: ['sovereign', 'limited', 'territory'], continents: ['europe'] } },
  { key: 'asia', label: 'Solo Asia', filter: { categories: ['sovereign', 'limited', 'territory'], continents: ['asia'] } },
  { key: 'africa', label: 'Solo África', filter: { categories: ['sovereign', 'limited', 'territory'], continents: ['africa'] } },
  { key: 'americas', label: 'Solo América', filter: { categories: ['sovereign', 'limited', 'territory'], continents: ['north-america', 'south-america'] } },
  { key: 'oceania', label: 'Solo Oceanía', filter: { categories: ['sovereign', 'limited', 'territory'], continents: ['oceania'] } },
  { key: 'historical', label: 'Solo históricas', filter: { categories: ['historical'], continents: [] } },
  { key: 'limited', label: 'No reconocidos', filter: { categories: ['limited'], continents: [] } },
  { key: 'spain', label: 'Comunidades autónomas', filter: { categories: ['spain'], continents: [] } },
  { key: 'cultural', label: 'Pueblos y regiones', filter: { categories: ['cultural'], continents: [] } },
  { key: 'organization', label: 'Organizaciones', filter: { categories: ['organization'], continents: [] } },
];

export function inPool(e: Entity, f: PoolFilter): boolean {
  if (f.baseOnly && !e.base) return false;
  if (f.categories.length && !f.categories.includes(e.category)) return false;
  if (f.continents.length && !f.continents.includes(e.continent)) return false;
  return true;
}

export function filterPool(f: PoolFilter): Entity[] {
  return ENTITIES.filter(e => inPool(e, f));
}

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every(x => b.includes(x));

export function presetOf(f: PoolFilter): Preset | undefined {
  return PRESETS.find(
    p => !!p.filter.baseOnly === !!f.baseOnly && sameSet(p.filter.categories, f.categories) && sameSet(p.filter.continents, f.continents),
  );
}

export function describePool(f: PoolFilter): string {
  const preset = presetOf(f);
  if (preset) return preset.label;
  const parts: string[] = [];
  if (f.baseOnly) parts.push('Las 254');
  if (f.categories.length) parts.push(CATEGORY_ORDER.filter(c => f.categories.includes(c)).map(c => CATEGORY_SHORT[c]).join(', '));
  if (f.continents.length) parts.push(f.continents.map(c => CONTINENT_LABEL[c]).join(', '));
  return parts.join(' · ') || 'Todas';
}
