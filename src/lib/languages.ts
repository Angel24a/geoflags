import { BY_ID, ENTITIES, LANGUAGES, type Entity, type Language } from '@/data';
import { pick, shuffle, weightedPick, type Rng } from './random';
import { fuzzyEquals, normalize } from './text';

/** "Idiomas" game modes. */
export type LangMode = 'choice' | 'type' | 'where';
export type LangDifficulty = 'easy' | 'normal' | 'hard';

export const LANG_MODE_LABEL: Record<LangMode, string> = {
  choice: 'Elige el idioma',
  type: 'Escribe el idioma',
  where: '¿Dónde se habla?',
};

export const LANG_MODE_HELP: Record<LangMode, string> = {
  choice: 'Lee la frase y elige entre cuatro idiomas.',
  type: 'Lee la frase y escribe el nombre del idioma.',
  where: 'Lee la frase y elige la bandera de un país donde se habla.',
};

/** Spanish would be too easy to guess. */
export const GAME_LANGUAGES = LANGUAGES.filter(l => l.id !== 'es');

/** Stats key of a language (kept apart from the flags in the shared stats). */
export const langKey = (id: string) => `lang:${id}`;

export interface LangQuestion {
  lang: Language;
  phrase: [string, string];
  /** 'choice': four languages, shuffled. */
  options: Language[];
  /** 'where': four entity ids, one of them a country where it is spoken. */
  flags: string[];
  /** 'where': the right flag. */
  answerFlag?: string;
}

/**
 * Picks the next language: unseen and often failed ones more often, and
 * not one of the last few.
 */
export function nextLanguage(
  stats: Record<string, { c: number; w: number }>,
  recent: string[],
  rng: Rng = Math.random,
  list: Language[] = GAME_LANGUAGES,
): Language {
  const avoid = new Set(recent.slice(-Math.min(8, Math.floor(list.length / 2))));
  const fresh = list.filter(l => !avoid.has(l.id));
  return weightedPick(
    fresh.length ? fresh : list,
    l => {
      const s = stats[langKey(l.id)];
      if (!s || s.c + s.w === 0) return 2;
      return 0.5 + 3 * (s.w / (s.c + s.w)) + 1 / (1 + s.c);
    },
    rng,
  );
}

/** A sentence of the language, different from the last one shown when possible. */
export function pickPhrase(l: Language, rng: Rng = Math.random, last?: string): [string, string] {
  const others = l.phrases.filter(p => p[0] !== last);
  return pick(others.length ? others : l.phrases, rng);
}

/**
 * Wrong options. Hard: same branch, family or script first (Spanish/Portuguese,
 * Russian/Ukrainian…). Easy: other families and scripts.
 */
export function languageDistractors(target: Language, difficulty: LangDifficulty, rng: Rng = Math.random, count = 3): Language[] {
  const others = shuffle(GAME_LANGUAGES.filter(l => l.id !== target.id), rng);
  const close = (l: Language) => (l.branch && l.branch === target.branch ? 3 : 0) + (l.family === target.family ? 2 : 0) + (l.script === target.script ? 1 : 0);
  if (difficulty === 'hard') return others.sort((a, b) => close(b) - close(a)).slice(0, count);
  if (difficulty === 'easy') {
    const far = others.filter(l => l.family !== target.family && l.script !== target.script);
    return [...far, ...others.filter(l => !far.includes(l))].slice(0, count);
  }
  return others.slice(0, count);
}

/** Base countries (with their own flag) where the language is spoken. */
export const countriesOf = (l: Language): Entity[] => l.countries.map(id => BY_ID.get(id)!).filter(e => e?.base);

/** Four flags for "¿Dónde se habla?": one country where it is spoken and three where it is not. */
export function whereOptions(l: Language, difficulty: LangDifficulty, rng: Rng = Math.random): { flags: string[]; answer: string } | null {
  const homes = countriesOf(l);
  if (!homes.length) return null;
  const answer = pick(homes, rng);
  const speaks = new Set(l.countries);
  const pool = ENTITIES.filter(e => e.base && e.category === 'sovereign' && !speaks.has(e.id));
  // hard: countries of the same continent; easy: anywhere else
  const near = shuffle(pool.filter(e => e.continent === answer.continent), rng);
  const far = shuffle(pool.filter(e => e.continent !== answer.continent), rng);
  const wrong = (difficulty === 'hard' ? [...near, ...far] : difficulty === 'easy' ? [...far, ...near] : shuffle(pool, rng)).slice(0, 3);
  return { flags: shuffle([answer.id, ...wrong.map(e => e.id)], rng), answer: answer.id };
}

export function makeLangQuestion(
  lang: Language,
  mode: LangMode,
  difficulty: LangDifficulty,
  rng: Rng = Math.random,
  lastPhrase?: string,
): LangQuestion {
  const phrase = pickPhrase(lang, rng, lastPhrase);
  const options = mode === 'choice' ? shuffle([lang, ...languageDistractors(lang, difficulty, rng)], rng) : [];
  const where = mode === 'where' ? whereOptions(lang, difficulty, rng) : null;
  return { lang, phrase, options, flags: where?.flags ?? [], answerFlag: where?.answer };
}

/** Languages that can be asked in a mode ("where" needs a country with its own flag). */
export const languagesFor = (mode: LangMode) => (mode === 'where' ? GAME_LANGUAGES.filter(l => countriesOf(l).length) : GAME_LANGUAGES);

/** Typed answer: Spanish name, aliases or the name in the language itself. */
export function matchesLanguage(input: string, l: Language): boolean {
  return [l.name, l.native, ...(l.aliases ?? [])].some(n => fuzzyEquals(input, n));
}

/** "Where": any country where it is spoken counts, not only the one picked as the answer. */
export const spokenIn = (l: Language, entityId: string) => l.countries.includes(entityId);

/** Languages whose names start with / contain the query, for autocomplete. */
export function suggestLanguages(query: string, limit = 6): Language[] {
  const q = normalize(query);
  if (!q) return [];
  const names = (l: Language) => [l.name, l.native, ...(l.aliases ?? [])].map(normalize);
  const starts = GAME_LANGUAGES.filter(l => names(l).some(n => n.startsWith(q)));
  const contains = GAME_LANGUAGES.filter(l => !starts.includes(l) && names(l).some(n => n.includes(q)));
  return [...starts, ...contains].slice(0, limit);
}

/** "≈ 1,2 millones", "≈ 50.000", "lengua clásica". */
export function formatSpeakers(millions: number): string {
  if (millions === 0) return 'Sin hablantes nativos';
  if (millions >= 1) return `≈ ${millions.toLocaleString('es-ES', { maximumFractionDigits: millions < 10 ? 1 : 0 })} millones`;
  return `≈ ${Math.round(millions * 1e6).toLocaleString('es-ES')}`;
}
