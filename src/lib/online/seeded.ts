import { ENTITIES, type Entity } from '@/data';
import { filterPool, PRESETS } from '@/lib/pool';
import { mulberry32, shuffle } from '@/lib/random';
import { eligibleFor, makeQuestion, type Attr, type InputMode, type Question } from '@/lib/quiz';

/** Everything needed to recreate exactly the same game on another phone. */
export interface OnlineGameConfig {
  mode: string;
  /** Key of a pool preset (see lib/pool PRESETS). */
  pool: string;
  count: number;
}

export interface OnlineMode {
  key: string;
  label: string;
  prompt: Attr;
  answer: Attr;
  input: InputMode;
}

export const ONLINE_MODES: OnlineMode[] = [
  { key: 'flag-name', label: 'Bandera → Nombre', prompt: 'flag', answer: 'name', input: 'choice' },
  { key: 'name-flag', label: 'Nombre → Bandera', prompt: 'name', answer: 'flag', input: 'choice' },
  { key: 'flag-capital', label: 'Bandera → Capital', prompt: 'flag', answer: 'capital', input: 'choice' },
  { key: 'capital-name', label: 'Capital → País', prompt: 'capital', answer: 'name', input: 'choice' },
  { key: 'shape-name', label: 'Forma → Nombre', prompt: 'shape', answer: 'name', input: 'choice' },
  { key: 'flag-map', label: 'Bandera → Mapa', prompt: 'flag', answer: 'map', input: 'map' },
  { key: 'flag-type', label: 'Bandera → Escribir', prompt: 'flag', answer: 'name', input: 'type' },
];

export const modeOf = (key: string): OnlineMode => ONLINE_MODES.find(m => m.key === key) ?? ONLINE_MODES[0];

export function poolOf(presetKey: string): Entity[] {
  const p = PRESETS.find(x => x.key === presetKey) ?? PRESETS[0];
  return filterPool(p.filter);
}

/** Same seed + config ⇒ same questions and options on every device. */
export function seededQuestions(cfg: OnlineGameConfig, seed: number): Question[] {
  const mode = modeOf(cfg.mode);
  const quiz = { prompt: mode.prompt, answer: mode.answer, input: mode.input };
  const pool = poolOf(cfg.pool);
  const rng = mulberry32(seed);
  const deck = shuffle(eligibleFor(quiz, pool), rng).slice(0, cfg.count);
  return deck.map(t => makeQuestion(t, quiz, pool, { similar: true, rng }));
}

/** 100 points per right answer plus up to 50 for answering fast (under 10 s). */
export function pointsFor(correct: boolean, ms: number): number {
  if (!correct) return 0;
  return 100 + Math.round(50 * Math.max(0, 1 - ms / 10000));
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DAILY_MODES = ['flag-name', 'name-flag', 'flag-capital', 'shape-name', 'flag-map', 'capital-name', 'flag-name'];

/** The daily challenge: 10 questions over the 254 base flags, the mode changes every day. */
export function dailyGame(day = dayKey()): { cfg: OnlineGameConfig; seed: number } {
  const seed = seedFromString(`daily:${day}`);
  return { cfg: { mode: DAILY_MODES[seed % DAILY_MODES.length], pool: 'base', count: 10 }, seed };
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(length: number, rng: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < length; i++) s += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)];
  return s;
}

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Fingerprint of the flag data; players need the same version to share games. */
export const DATA_VERSION = seedFromString(ENTITIES.map(e => `${e.id}:${e.similar.slice(0, 4).join(',')}`).join('|')).toString(36);

export interface GameResult {
  score: number;
  correct: number;
  total: number;
  timeMs: number;
}
