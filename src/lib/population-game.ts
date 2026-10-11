import { ENTITIES, type Entity } from '@/data';
import { pick, shuffle, type Rng } from './random';

export type PopMode = 'choice' | 'higher' | 'estimate';
export type PopDifficulty = 'easy' | 'normal' | 'hard';

export const POP_MODE_LABEL: Record<PopMode, string> = {
  choice: 'Elige la cifra',
  higher: '¿Más o menos?',
  estimate: 'Estima',
};

export const POP_MODE_HELP: Record<PopMode, string> = {
  choice: 'Cuatro cifras, solo una es la buena.',
  higher: '¿Tiene más o menos habitantes que el anterior? Sigue hasta fallar.',
  estimate: 'Mueve la barra hasta tu estimación: cuanto más cerca, más puntos.',
};

/** Current territories with a known population (no peoples, historical states or uninhabited places). */
export const hasPopulation = (e: Entity) => !!e.population && !e.popPeople && e.category !== 'historical';

export function populationTargets(pool: Entity[]): Entity[] {
  const inPool = pool.filter(hasPopulation);
  return inPool.length >= 8 ? inPool : ENTITIES.filter(hasPopulation);
}

/** Two significant figures, so options are easy to read: 47.519.628 → 48.000.000. */
export function roundPopulation(n: number): number {
  if (n < 100) return Math.round(n);
  const p = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}

/** "1.400 millones", "47 millones", "8,4 millones", "85.000". */
export function formatPopulation(n: number): string {
  if (n >= 1e9) return `${(n / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 0 })} millones`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('es-ES', { maximumFractionDigits: n < 1e7 ? 1 : 0 })} millones`;
  return Math.round(n).toLocaleString('es-ES');
}

/** Minimum ratio between any two options (bigger = easier to tell apart). */
const MIN_RATIO: Record<PopDifficulty, number> = { easy: 4, normal: 2, hard: 1.35 };
/** Hard: wrong options stay within this ratio of the answer. */
const HARD_MAX_RATIO = 4;

/**
 * Four rounded figures, the right one included. They come from other
 * territories, so they look plausible, and are far enough apart to be fair.
 */
export function populationOptions(target: Entity, all: Entity[], difficulty: PopDifficulty, rng: Rng = Math.random): number[] {
  const right = roundPopulation(target.population!);
  const minRatio = MIN_RATIO[difficulty];
  const ratio = (a: number, b: number) => Math.max(a, b) / Math.min(a, b);
  const values = shuffle([...new Set(all.filter(e => e.id !== target.id && hasPopulation(e)).map(e => roundPopulation(e.population!)))], rng);
  const chosen = [right];
  const ok = (v: number) => chosen.every(c => ratio(c, v) >= minRatio) && (difficulty !== 'hard' || ratio(v, right) <= HARD_MAX_RATIO);
  for (const v of values) {
    if (chosen.length === 4) break;
    if (ok(v)) chosen.push(v);
  }
  // not enough real figures: scale the answer up and down
  for (const f of [minRatio, 1 / minRatio, minRatio ** 2, 1 / minRatio ** 2, minRatio ** 3]) {
    if (chosen.length === 4) break;
    const v = roundPopulation(right * f);
    if (v >= 1 && !chosen.includes(v) && chosen.every(c => ratio(c, v) >= minRatio * 0.99)) chosen.push(v);
  }
  return shuffle(chosen, rng);
}

/** Next territory for "¿Más o menos?": different enough from the current one so it is not a coin toss. */
export function nextHigherLower(current: Entity, targets: Entity[], difficulty: PopDifficulty, rng: Rng = Math.random): Entity {
  const r = (e: Entity) => Math.max(e.population!, current.population!) / Math.min(e.population!, current.population!);
  const [lo, hi] = difficulty === 'easy' ? [3, Infinity] : difficulty === 'hard' ? [1.05, 2] : [1.3, Infinity];
  const fit = targets.filter(e => e.id !== current.id && r(e) >= lo && r(e) <= hi);
  return pick(fit.length ? fit : targets.filter(e => e.id !== current.id), rng);
}

/** Estimate slider: log scale from 10 people to 2.000 millones. */
export const EST_MIN = 1;
export const EST_MAX = Math.log10(2e9);
export const fromSlider = (p: number) => 10 ** (EST_MIN + p * (EST_MAX - EST_MIN));
export const toSlider = (n: number) => (Math.log10(Math.max(10, n)) - EST_MIN) / (EST_MAX - EST_MIN);

/**
 * Points for an estimate: 100 when exact, 0 when off by 10× or more. Being
 * off by 2× still gives 70.
 */
export function estimatePoints(guess: number, real: number): number {
  const off = Math.abs(Math.log10(guess / real));
  return Math.max(0, Math.round(100 * (1 - off)));
}
