import { ENTITIES, type Entity } from '@/data';
import { pick, type Rng } from './random';

/** Peoples and regions that have a homeland to find on the map. */
export function peopleTargets(pool: Entity[]): Entity[] {
  const inPool = pool.filter(e => e.homeland?.length);
  return inPool.length >= 3 ? inPool : ENTITIES.filter(e => e.homeland?.length);
}

export function nextPeople(targets: Entity[], previous?: string, rng: Rng = Math.random): Entity {
  const others = targets.filter(e => e.id !== previous);
  return pick(others.length ? others : targets, rng);
}

export interface HomelandResult {
  found: string[];
  missed: string[];
  wrong: string[];
  /** One point per country found, minus one per wrong country (never below 0). */
  points: number;
  perfect: boolean;
}

export function checkHomeland(homeland: string[], picked: string[]): HomelandResult {
  const found = picked.filter(id => homeland.includes(id));
  const wrong = picked.filter(id => !homeland.includes(id));
  const missed = homeland.filter(id => !picked.includes(id));
  return { found, missed, wrong, points: Math.max(0, found.length - wrong.length), perfect: !missed.length && !wrong.length };
}
