import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from './client';
import type { OnlineGameConfig } from './seeded';

/** What each player shares with the room (Supabase Realtime presence). */
export interface RoomPlayer {
  id: string;
  name: string;
  host: boolean;
  score: number;
  answered: number;
  finished: boolean;
  timeMs: number;
  version: string;
}

export interface RoomGame {
  cfg: OnlineGameConfig;
  seed: number;
}

export type RoomStatus = 'connecting' | 'lobby' | 'playing' | 'error';

/**
 * Live duel room. The host's config is sent to everyone who joins; when the
 * host starts, all players get the same seed and play the same questions,
 * sharing their progress through presence.
 */
export function useDuelRoom(code: string | null, me: { id: string; name: string; host: boolean; version: string }, hostCfg?: OnlineGameConfig) {
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  const [cfg, setCfg] = useState<OnlineGameConfig | null>(hostCfg ?? null);
  const [game, setGame] = useState<RoomGame | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const mine = useRef<RoomPlayer>({ ...me, score: 0, answered: 0, finished: false, timeMs: 0 });
  const cfgRef = useRef(hostCfg);
  cfgRef.current = hostCfg;

  useEffect(() => {
    if (!code) return;
    const ch = supabase().channel(`duel:${code}`, { config: { presence: { key: me.id }, broadcast: { self: true } } });
    channel.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<RoomPlayer>();
      setPlayers(Object.values(state).map(list => list[0]).filter(Boolean));
    });
    ch.on('presence', { event: 'join' }, () => {
      // the host tells newcomers which game is being played
      if (me.host && cfgRef.current) ch.send({ type: 'broadcast', event: 'config', payload: cfgRef.current });
    });
    ch.on('broadcast', { event: 'hello' }, () => {
      if (me.host && cfgRef.current) ch.send({ type: 'broadcast', event: 'config', payload: cfgRef.current });
    });
    ch.on('broadcast', { event: 'config' }, ({ payload }) => setCfg(payload as OnlineGameConfig));
    ch.on('broadcast', { event: 'start' }, ({ payload }) => {
      const g = payload as RoomGame;
      mine.current = { ...mine.current, score: 0, answered: 0, finished: false, timeMs: 0 };
      ch.track(mine.current);
      setCfg(g.cfg);
      setGame(g);
      setStatus('playing');
    });
    ch.subscribe(async s => {
      if (s === 'SUBSCRIBED') {
        await ch.track(mine.current);
        setStatus(st => (st === 'connecting' ? 'lobby' : st));
        if (!me.host) ch.send({ type: 'broadcast', event: 'hello', payload: {} });
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
        setStatus('error');
      }
    });
    return () => {
      supabase().removeChannel(ch);
      channel.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  /** Host only: change the game shown in the lobby. */
  const announce = useCallback((c: OnlineGameConfig) => {
    setCfg(c);
    channel.current?.send({ type: 'broadcast', event: 'config', payload: c });
  }, []);

  const start = useCallback((g: RoomGame) => {
    channel.current?.send({ type: 'broadcast', event: 'start', payload: g });
  }, []);

  const report = useCallback((p: Partial<RoomPlayer>) => {
    mine.current = { ...mine.current, ...p };
    channel.current?.track(mine.current);
  }, []);

  const backToLobby = useCallback(() => {
    setGame(null);
    setStatus('lobby');
  }, []);

  return { players, status, cfg, game, announce, start, report, backToLobby };
}
