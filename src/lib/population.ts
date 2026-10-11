import type { Entity } from '@/data';

const es = (n: number) => n.toLocaleString('es-ES');

/** Rounded for reading: 35 000 000 → "35 millones", 12 345 → "12.345". */
export function formatPeople(n: number): string {
  if (n >= 1e6) {
    const m = n / 1e6;
    return `${m.toLocaleString('es-ES', { maximumFractionDigits: m < 10 ? 2 : 1 })} millones`;
  }
  return es(n);
}

/** Glossary line for the population, or null when it is unknown. */
export function populationFact(e: Entity): { label: string; value: string } | null {
  if (e.population === undefined) return null;
  if (e.population === 0) return { label: 'Población', value: 'Sin población permanente' };
  const year = e.popYear ? ` (${e.popYear})` : '';
  if (e.popPeople) {
    const n = e.population >= 1e6 ? `${formatPeople(e.population)} de personas` : `${es(e.population)} personas`;
    return { label: 'Población estimada del pueblo', value: `${n}${year}` };
  }
  return { label: 'Población', value: `${es(e.population)} hab.${year}` };
}

/** Inhabitants per km², when both figures refer to the same territory. */
export function density(e: Entity): number | undefined {
  return e.population && e.area && !e.popPeople ? e.population / e.area : undefined;
}
