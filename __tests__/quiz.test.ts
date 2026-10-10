import { describe, expect, it } from '@jest/globals';
import { BY_ID, ENTITIES } from '@/data';
import { mulberry32 } from '@/lib/random';
import { buildDeck, distractors, eligibleFor, hasAttr, isValidConfig, makeQuestion, nextTarget, type QuizConfig } from '@/lib/quiz';

const flagToName: QuizConfig = { prompt: 'flag', answer: 'name', input: 'choice' };

describe('quiz engine', () => {
  it('validates combinations', () => {
    expect(isValidConfig(flagToName)).toBe(true);
    expect(isValidConfig({ prompt: 'flag', answer: 'flag', input: 'choice' })).toBe(false);
    expect(isValidConfig({ prompt: 'flag', answer: 'map', input: 'choice' })).toBe(false);
    expect(isValidConfig({ prompt: 'name', answer: 'capital', input: 'type' })).toBe(true);
  });

  it('filters entities that have the needed attributes', () => {
    const eligible = eligibleFor({ prompt: 'shape', answer: 'name', input: 'choice' }, ENTITIES);
    expect(eligible.every(e => e.geo === 'shape')).toBe(true);
    expect(eligible.some(e => e.id === 'va')).toBe(false);
    expect(hasAttr(BY_ID.get('un')!, 'capital')).toBe(false);
  });

  it('builds 4 distinct options including the answer', () => {
    const rng = mulberry32(1);
    for (const id of ['fr', 'td', 'es', 'ussr', 'es-md']) {
      const q = makeQuestion(BY_ID.get(id)!, flagToName, ENTITIES, { similar: true, rng });
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map(o => o.id)).size).toBe(4);
      expect(q.options.map(o => o.id)).toContain(id);
    }
  });

  it('never offers a flag identical to the answer', () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 30; i++) {
      const d = distractors(BY_ID.get('fr')!, flagToName, ENTITIES, { similar: true, rng });
      expect(d.map(e => e.id)).not.toEqual(expect.arrayContaining(['re']));
      expect(d.some(e => ['re', 'bl', 'mf'].includes(e.id))).toBe(false);
    }
  });

  it('uses similar flags as distractors', () => {
    const d = distractors(BY_ID.get('td')!, flagToName, ENTITIES, { similar: true, rng: mulberry32(3) });
    const close = BY_ID.get('td')!.similar.slice(0, 6);
    expect(d.every(e => close.includes(e.id))).toBe(true);
  });

  it('falls back to all entities when the pool is too small', () => {
    const pool = [BY_ID.get('eu')!, BY_ID.get('un')!];
    const d = distractors(pool[0], flagToName, pool, { similar: true });
    expect(d).toHaveLength(3);
  });

  it('builds decks without repetitions and prefers failed entities', () => {
    const deck = buildDeck(ENTITIES, 20, {});
    expect(new Set(deck.map(e => e.id)).size).toBe(20);
    const pool = [BY_ID.get('fr')!, BY_ID.get('de')!];
    const stats = { fr: { c: 10, w: 0 }, de: { c: 0, w: 10 } };
    const rng = mulberry32(4);
    let de = 0;
    for (let i = 0; i < 200; i++) if (nextTarget(pool, [], stats, rng).id === 'de') de++;
    expect(de).toBeGreaterThan(130);
  });
});
