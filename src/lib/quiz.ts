import { ENTITIES, type Entity } from '@/data';
import { matchesCapital, matchesName } from './text';
import { shuffle, weightedPick, type Rng } from './random';

/** The things a question can show or ask for. */
export type Attr = 'flag' | 'name' | 'capital' | 'shape' | 'map';
export type InputMode = 'choice' | 'type' | 'map';
export type Rule = 'classic' | 'survival' | 'timed' | 'streak';

export interface QuizConfig {
  prompt: Attr;
  answer: Attr;
  input: InputMode;
}

export const ATTR_LABEL: Record<Attr, string> = {
  flag: 'Bandera',
  name: 'Nombre',
  capital: 'Capital',
  shape: 'Forma',
  map: 'Mapa',
};

export const RULE_LABEL: Record<Rule, string> = {
  classic: 'Clásico',
  survival: 'Supervivencia',
  timed: 'Contrarreloj',
  streak: 'Racha',
};

export const RULE_HELP: Record<Rule, string> = {
  classic: 'Una ronda de preguntas a tu ritmo.',
  survival: 'Tienes 3 vidas. ¿Hasta dónde llegas?',
  timed: '60 segundos para acertar todas las que puedas.',
  streak: 'Un solo fallo y se acaba.',
};

export function hasAttr(e: Entity, a: Attr): boolean {
  switch (a) {
    case 'flag':
    case 'name':
      return true;
    case 'capital':
      return !!e.capital;
    case 'shape':
      return e.geo === 'shape';
    case 'map':
      return e.geo !== null;
  }
}

export const PROMPT_ATTRS: Attr[] = ['flag', 'name', 'capital', 'shape'];
export const ANSWER_ATTRS: Attr[] = ['flag', 'name', 'capital', 'shape', 'map'];

/** Input modes that make sense for an answer attribute. */
export function inputsFor(answer: Attr): InputMode[] {
  if (answer === 'map') return ['map'];
  if (answer === 'name' || answer === 'capital') return ['choice', 'type'];
  return ['choice'];
}

export function isValidConfig(c: QuizConfig): boolean {
  return c.prompt !== c.answer && c.prompt !== 'map' && inputsFor(c.answer).includes(c.input);
}

export function eligibleFor(c: QuizConfig, pool: Entity[]): Entity[] {
  return pool.filter(e => hasAttr(e, c.prompt) && hasAttr(e, c.answer));
}

export interface Question {
  target: Entity;
  /** Options for 'choice' input (target included, shuffled). */
  options: Entity[];
}

interface DistractorOptions {
  similar: boolean;
  rng?: Rng;
  count?: number;
}

/** Two entities would look the same as options for this config. */
function clashes(a: Entity, b: Entity, c: QuizConfig): boolean {
  const usesFlag = c.prompt === 'flag' || c.answer === 'flag';
  const usesCapital = c.prompt === 'capital' || c.answer === 'capital';
  if (usesFlag && (a.sameFlag.includes(b.id) || b.sameFlag.includes(a.id))) return true;
  if (usesCapital && a.capital && a.capital === b.capital) return true;
  return a.name === b.name;
}

/**
 * Picks wrong options. With `similar`, flag questions use visually similar
 * flags; other questions prefer entities from the same subregion/continent.
 */
export function distractors(target: Entity, c: QuizConfig, pool: Entity[], o: DistractorOptions): Entity[] {
  const rng = o.rng ?? Math.random;
  const count = o.count ?? 3;
  // distractors must also make sense for the prompt (e.g. only places with a silhouette for shape questions)
  const ok = (e: Entity, chosen: Entity[]) =>
    e.id !== target.id && hasAttr(e, c.answer) && hasAttr(e, c.prompt) && !clashes(e, target, c) && chosen.every(x => !clashes(x, e, c));

  let candidates = pool.filter(e => ok(e, []));
  // Small pools (e.g. only organisations) borrow from everything.
  if (candidates.length < count) candidates = ENTITIES.filter(e => ok(e, []));
  const inPool = new Set(candidates.map(e => e.id));
  const chosen: Entity[] = [];
  const take = (list: Entity[]) => {
    for (const e of list) {
      if (chosen.length >= count) break;
      if (ok(e, chosen)) chosen.push(e);
    }
  };

  const usesFlag = c.prompt === 'flag' || c.answer === 'flag';
  if (usesFlag && o.similar) {
    const sim = target.similar.filter(id => inPool.has(id)).map(id => candidates.find(e => e.id === id)!);
    // a bit of randomness among the closest ones
    take(shuffle(sim.slice(0, 6), rng));
    take(sim.slice(6));
  } else if (o.similar) {
    take(shuffle(candidates.filter(e => e.subregion && e.subregion === target.subregion), rng));
    take(shuffle(candidates.filter(e => e.continent === target.continent), rng));
  }
  take(shuffle(candidates, rng));
  return chosen;
}

export function makeQuestion(target: Entity, c: QuizConfig, pool: Entity[], o: DistractorOptions): Question {
  const rng = o.rng ?? Math.random;
  const options = c.input === 'choice' ? shuffle([target, ...distractors(target, c, pool, o)], rng) : [];
  return { target, options };
}

/** Typed answers are compared fuzzily against names/aliases or capitals. */
export function checkTyped(input: string, target: Entity, answer: Attr): boolean {
  return answer === 'capital' ? matchesCapital(input, target) : matchesName(input, target);
}

export interface StatLike {
  c: number;
  w: number;
}

/**
 * Chooses the next target: unseen and frequently failed entities come up
 * more often, and recently asked ones are avoided.
 */
export function nextTarget(
  candidates: Entity[],
  recent: string[],
  stats: Record<string, StatLike>,
  rng: Rng = Math.random,
): Entity {
  const recentSet = new Set(recent.slice(-Math.min(recent.length, Math.floor(candidates.length / 2))));
  const fresh = candidates.filter(e => !recentSet.has(e.id));
  const list = fresh.length ? fresh : candidates;
  return weightedPick(
    list,
    e => {
      const s = stats[e.id];
      if (!s || s.c + s.w === 0) return 2;
      const errRate = s.w / (s.c + s.w);
      return 0.5 + 3 * errRate + 1 / (1 + s.c);
    },
    rng,
  );
}

/** Deck for classic rounds: each entity at most once. */
export function buildDeck(candidates: Entity[], size: number, stats: Record<string, StatLike>, rng: Rng = Math.random): Entity[] {
  const deck: Entity[] = [];
  const left = candidates.slice();
  while (deck.length < size && left.length) {
    const e = nextTarget(left, [], stats, rng);
    deck.push(e);
    left.splice(left.indexOf(e), 1);
  }
  return deck;
}
