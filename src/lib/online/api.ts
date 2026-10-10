import { presetOf, type PoolFilter } from '@/lib/pool';
import { supabase } from './client';
import type { GameResult, OnlineGameConfig } from './seeded';

export interface Player {
  id: string;
  name: string;
}

export interface BoardRow {
  player_id: string;
  name: string;
  score: number;
  time_ms?: number | null;
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function savePlayer(p: Player): Promise<void> {
  check(await supabase().from('players').upsert({ id: p.id, name: p.name, updated_at: new Date().toISOString() }));
}

// ---------------------------------------------------------------------------
// Leaderboards for the solo challenges
// ---------------------------------------------------------------------------

/** Ranked modes: the solo challenges with a pool preset. Returns null for anything else. */
export function rankedKey(localKey: string, pool: PoolFilter): string | null {
  const [rule, combo, input] = localKey.split(':');
  if (!['survival', 'timed', 'streak'].includes(rule)) return null;
  const preset = presetOf(pool);
  if (!preset) return null;
  return `${rule}:${combo}:${input}:${preset.key}`;
}

export async function submitScore(playerId: string, mode: string, score: number): Promise<void> {
  check(await supabase().from('scores').insert({ player_id: playerId, mode, score }));
}

export async function leaderboard(mode: string, limit = 50): Promise<BoardRow[]> {
  return check(
    await supabase().from('leaderboard').select('player_id,name,score').eq('mode', mode).order('score', { ascending: false }).limit(limit),
  ) ?? [];
}

// ---------------------------------------------------------------------------
// Daily challenge
// ---------------------------------------------------------------------------

export async function submitDaily(day: string, playerId: string, r: GameResult): Promise<void> {
  check(await supabase().from('daily_results').upsert({ day, player_id: playerId, score: r.score, time_ms: r.timeMs }, { onConflict: 'day,player_id', ignoreDuplicates: true }));
}

export async function dailyBoard(day: string): Promise<BoardRow[]> {
  return check(
    await supabase().from('daily_board').select('player_id,name,score,time_ms').eq('day', day)
      .order('score', { ascending: false }).order('time_ms', { ascending: true }).limit(100),
  ) ?? [];
}

// ---------------------------------------------------------------------------
// Challenges between friends (play the same game at different times)
// ---------------------------------------------------------------------------

export interface Challenge {
  code: string;
  creator_id: string;
  config: OnlineGameConfig & { version?: string };
  seed: number;
  created_at: string;
}

export async function createChallenge(c: Omit<Challenge, 'created_at'>): Promise<void> {
  check(await supabase().from('challenges').insert(c));
}

export async function getChallenge(code: string): Promise<Challenge | null> {
  return check(await supabase().from('challenges').select('*').eq('code', code).maybeSingle());
}

export async function submitChallenge(code: string, playerId: string, r: GameResult): Promise<void> {
  check(await supabase().from('challenge_results').upsert({ code, player_id: playerId, score: r.score, time_ms: r.timeMs }, { onConflict: 'code,player_id', ignoreDuplicates: true }));
}

export async function challengeBoard(code: string): Promise<BoardRow[]> {
  return check(
    await supabase().from('challenge_board').select('player_id,name,score,time_ms').eq('code', code)
      .order('score', { ascending: false }).order('time_ms', { ascending: true }),
  ) ?? [];
}

/** Challenges the player created or played, newest first. */
export async function myChallenges(playerId: string): Promise<{ code: string; created_at: string }[]> {
  return check(
    await supabase().from('challenge_results').select('code,created_at').eq('player_id', playerId).order('created_at', { ascending: false }).limit(20),
  ) ?? [];
}
