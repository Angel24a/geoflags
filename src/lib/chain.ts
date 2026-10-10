import { BY_ID, ENTITIES, type Entity } from '@/data';
import { pick, shuffle, type Rng } from './random';

/** Land-border graph (symmetric). */
export function borderGraph(): Map<string, Set<string>> {
  const g = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!g.has(a)) g.set(a, new Set());
    g.get(a)!.add(b);
  };
  for (const e of ENTITIES) {
    for (const b of e.borders) {
      if (!BY_ID.has(b)) continue;
      add(e.id, b);
      add(b, e.id);
    }
  }
  return g;
}

let graphCache: Map<string, Set<string>> | null = null;
export const graph = () => (graphCache ??= borderGraph());

export const areNeighbors = (a: string, b: string) => graph().get(a)?.has(b) ?? false;

/** Shortest path (ids, inclusive) or null if unreachable. */
export function shortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const g = graph();
  const prev = new Map<string, string>([[from, '']]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of g.get(cur) ?? []) {
      if (prev.has(n)) continue;
      prev.set(n, cur);
      if (n === to) {
        const path = [to];
        let p = cur;
        while (p) { path.unshift(p); p = prev.get(p)!; }
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

export interface ChainPuzzle {
  start: Entity;
  target: Entity;
  optimal: string[];
}

/**
 * Picks a start and target from the pool that are connected by land with a
 * shortest path of `minSteps`–`maxSteps` borders.
 */
export function makeChain(pool: Entity[], rng: Rng = Math.random, minSteps = 2, maxSteps = 6): ChainPuzzle | null {
  const g = graph();
  const nodes = pool.filter(e => g.has(e.id));
  for (const start of shuffle(nodes, rng).slice(0, 60)) {
    // prefer a destination on the same continent: shorter, more familiar chains
    const shuffled = shuffle(nodes, rng);
    const targets = [...shuffled.filter(e => e.continent === start.continent), ...shuffled.filter(e => e.continent !== start.continent)];
    for (const target of targets.slice(0, 40)) {
      const p = shortestPath(start.id, target.id);
      if (p && p.length - 1 >= minSteps && p.length - 1 <= maxSteps) return { start, target, optimal: p };
    }
  }
  // tiny pools: fall back to any pair in the whole graph starting from the pool
  const anyStart = nodes.length ? pick(nodes, rng) : null;
  if (!anyStart) return null;
  for (const target of shuffle(ENTITIES.filter(e => g.has(e.id)), rng)) {
    const p = shortestPath(anyStart.id, target.id);
    if (p && p.length - 1 >= minSteps && p.length - 1 <= maxSteps) return { start: anyStart, target, optimal: p };
  }
  return null;
}
