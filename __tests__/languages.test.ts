import { describe, expect, it } from '@jest/globals';
import { BY_ID, LANGUAGE_BY_ID, LANGUAGES, LANGUAGES_OF } from '@/data';
import {
  GAME_LANGUAGES, languageDistractors, languagesFor, makeLangQuestion, matchesLanguage, nextLanguage, pickPhrase, spokenIn,
  suggestLanguages, whereOptions,
} from '@/lib/languages';
import { mulberry32 } from '@/lib/random';

describe('languages data', () => {
  it('has many languages with several sentences each', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(50);
    for (const l of LANGUAGES) {
      expect(l.phrases.length).toBeGreaterThanOrEqual(2);
      expect(new Set(l.phrases.map(p => p[0])).size).toBe(l.phrases.length);
      for (const c of l.countries) expect(BY_ID.has(c)).toBe(true);
    }
  });

  it('never repeats a sentence across languages', () => {
    const all = LANGUAGES.flatMap(l => l.phrases.map(p => p[0]));
    expect(new Set(all).size).toBe(all.length);
  });

  it('lists the languages of a country', () => {
    expect(LANGUAGES_OF.get('es')!.map(l => l.id)).toEqual(expect.arrayContaining(['es', 'ca', 'gl', 'eu']));
  });
});

describe('languages game', () => {
  it('builds four different options with the answer', () => {
    const rng = mulberry32(4);
    for (const l of GAME_LANGUAGES) {
      for (const d of ['easy', 'normal', 'hard'] as const) {
        const q = makeLangQuestion(l, 'choice', d, rng);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options.map(o => o.id)).size).toBe(4);
        expect(q.options).toContain(l);
      }
    }
  });

  it('makes hard options close and easy options far', () => {
    const pt = LANGUAGE_BY_ID.get('pt')!;
    expect(languageDistractors(pt, 'hard', mulberry32(1)).every(l => l.branch === 'Romance')).toBe(true);
    expect(languageDistractors(pt, 'easy', mulberry32(1)).every(l => l.family !== pt.family)).toBe(true);
  });

  it('offers one flag where the language is spoken', () => {
    const rng = mulberry32(9);
    for (const l of languagesFor('where')) {
      const w = whereOptions(l, 'normal', rng)!;
      expect(w.flags).toHaveLength(4);
      expect(w.flags.filter(f => spokenIn(l, f))).toEqual([w.answer]);
    }
  });

  it('varies the sentence and the language', () => {
    const ca = LANGUAGE_BY_ID.get('ca')!;
    const first = pickPhrase(ca, mulberry32(2));
    expect(pickPhrase(ca, mulberry32(2), first[0])[0]).not.toBe(first[0]);
    const recent = ['fr', 'it'];
    for (let k = 0; k < 20; k++) expect(recent).not.toContain(nextLanguage({}, recent, mulberry32(k)).id);
  });

  it('accepts names, native names and aliases when typing', () => {
    const eu = LANGUAGE_BY_ID.get('eu')!;
    for (const t of ['euskera', 'Euskara', 'vasco', 'Euskeră']) expect(matchesLanguage(t, eu)).toBe(true);
    expect(matchesLanguage('catalán', eu)).toBe(false);
    expect(suggestLanguages('fin')[0].id).toBe('fi');
  });
});
