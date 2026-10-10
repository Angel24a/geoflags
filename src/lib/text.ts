import type { Entity } from '@/data/types';

/** Lower-case, strip accents, punctuation and extra spaces. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’`´\-–—_,()/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Allowed typos for a word of the given length. */
const tolerance = (len: number) => (len <= 4 ? 0 : len <= 8 ? 1 : 2);

export function fuzzyEquals(input: string, target: string): boolean {
  const a = normalize(input);
  const b = normalize(target);
  if (!a) return false;
  return levenshtein(a, b) <= tolerance(b.length);
}

export const namesOf = (e: Entity) => [e.name, ...e.aliases];

export function matchesName(input: string, e: Entity): boolean {
  return namesOf(e).some(n => fuzzyEquals(input, n));
}

export function matchesCapital(input: string, e: Entity): boolean {
  if (!e.capital) return false;
  // "Santa Cruz de Tenerife y Las Palmas…", "Puerto Argentino / Stanley"
  const parts = e.capital.split(/ y | \/ /);
  return [e.capital, ...parts].some(c => fuzzyEquals(input, c));
}

/** Entities whose names start with / contain the query, for autocomplete. */
export function suggest(query: string, candidates: Entity[], limit = 6): Entity[] {
  const q = normalize(query);
  if (!q) return [];
  const starts: Entity[] = [];
  const contains: Entity[] = [];
  for (const e of candidates) {
    const names = namesOf(e).map(normalize);
    if (names.some(n => n.startsWith(q))) starts.push(e);
    else if (names.some(n => n.includes(q))) contains.push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}
