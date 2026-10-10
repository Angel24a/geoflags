import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ALL, filterPool, type PoolFilter } from '@/lib/pool';
import { rankedKey, submitScore } from '@/lib/online/api';
import { onlineConfigured } from '@/lib/online/client';
import type { GameResult } from '@/lib/online/seeded';
import type { Entity } from '@/data/types';

export interface Settings {
  pool: PoolFilter;
  /** Show flags with their official proportions (otherwise all 3:2). */
  realRatio: boolean;
  /** Use visually similar flags as wrong options. */
  similarOptions: boolean;
}

/** Per-entity learning record. */
export interface EntityStat {
  /** correct answers */
  c: number;
  /** wrong answers */
  w: number;
  /** last seen (ms) */
  t: number;
}

export interface Profile {
  /** Random id that identifies this phone online. */
  id: string;
  /** Name shown to friends ('' until chosen). */
  name: string;
}

interface Persisted {
  settings: Settings;
  stats: Record<string, EntityStat>;
  records: Record<string, number>;
  profile: Profile;
  /** Daily challenge results by day (YYYY-MM-DD). */
  daily: Record<string, GameResult>;
}

/** RFC 4122 v4 id (crypto.randomUUID is not available everywhere in React Native). */
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const DEFAULT: Persisted = {
  settings: { pool: ALL, realRatio: true, similarOptions: true },
  stats: {},
  records: {},
  profile: { id: '', name: '' },
  daily: {},
};

const KEY = 'geoflags:v1';

interface AppState extends Persisted {
  ready: boolean;
  poolEntities: Entity[];
  updateSettings: (patch: Partial<Settings>) => void;
  recordAnswer: (id: string, correct: boolean) => void;
  /** Saves a score if it beats the previous record. Returns true when it is a new record. */
  submitRecord: (key: string, score: number, lowerIsBetter?: boolean) => boolean;
  resetProgress: () => void;
  setProfileName: (name: string) => void;
  saveDaily: (day: string, r: GameResult) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(DEFAULT);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        setData({
          settings: { ...DEFAULT.settings, ...parsed.settings },
          stats: parsed.stats ?? {},
          records: parsed.records ?? {},
          profile: parsed.profile?.id ? parsed.profile : { id: uuid(), name: '' },
          daily: parsed.daily ?? {},
        });
      })
      .catch(() => {})
      .finally(() => {
        setData(d => (d.profile.id ? d : { ...d, profile: { ...d.profile, id: uuid() } }));
        setReady(true);
      });
  }, []);

  // Debounced persistence.
  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
    }, 400);
  }, [data, ready]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const recordAnswer = useCallback((id: string, correct: boolean) => {
    setData(d => {
      const s = d.stats[id] ?? { c: 0, w: 0, t: 0 };
      return { ...d, stats: { ...d.stats, [id]: { c: s.c + (correct ? 1 : 0), w: s.w + (correct ? 0 : 1), t: Date.now() } } };
    });
  }, []);

  const dataRef = useRef(data);
  dataRef.current = data;
  const submitRecord = useCallback((key: string, score: number, lowerIsBetter = false) => {
    const { records, profile, settings } = dataRef.current;
    const prev = records[key];
    const better = prev === undefined || (lowerIsBetter ? score < prev : score > prev);
    if (better) {
      setData(d => ({ ...d, records: { ...d.records, [key]: score } }));
      // personal bests of the solo challenges also go to the online leaderboard
      const ranked = rankedKey(key, settings.pool);
      if (ranked && onlineConfigured && profile.name && score > 0) submitScore(profile.id, ranked, score).catch(() => {});
    }
    return better && prev !== undefined;
  }, []);

  const setProfileName = useCallback((name: string) => {
    setData(d => ({ ...d, profile: { ...d.profile, name } }));
  }, []);

  const saveDaily = useCallback((day: string, r: GameResult) => {
    setData(d => ({ ...d, daily: { ...d.daily, [day]: r } }));
  }, []);

  const resetProgress = useCallback(() => setData(d => ({ ...d, stats: {}, records: {} })), []);

  const poolEntities = useMemo(() => filterPool(data.settings.pool), [data.settings.pool]);

  const value = useMemo<AppState>(
    () => ({ ...data, ready, poolEntities, updateSettings, recordAnswer, submitRecord, resetProgress, setProfileName, saveDaily }),
    [data, ready, poolEntities, updateSettings, recordAnswer, submitRecord, resetProgress, setProfileName, saveDaily],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

/** 0 = new, 1 = learning, 2 = known, 3 = mastered */
export function masteryLevel(s?: EntityStat): 0 | 1 | 2 | 3 {
  if (!s || s.c + s.w === 0) return 0;
  const acc = s.c / (s.c + s.w);
  if (s.c >= 5 && acc >= 0.85) return 3;
  if (s.c >= 2 && acc >= 0.6) return 2;
  return 1;
}

export const MASTERY_LABEL = ['Nueva', 'Aprendiendo', 'Conocida', 'Dominada'] as const;
