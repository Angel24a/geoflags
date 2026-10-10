import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { MissedList, GameBar, OptionTile, ResultView, type OptionState } from '@/components/game';
import { PixelFlag, PIXEL_LEVELS, RevealFrame, ZoomFlag, focusPoint } from '@/components/RevealFlag';
import { Flag } from '@/components/Flag';
import { Button, ProgressBar, Screen, Segmented, T } from '@/components/ui';
import type { Entity } from '@/data';
import { buildDeck, makeQuestion, type Question } from '@/lib/quiz';
import { useApp } from '@/state/app-state';
import { MAX_WIDTH, space, useTheme } from '@/theme';

const ROUNDS = 10;
const STEP_MS = 2200;
const LEVELS = PIXEL_LEVELS.length; // 5 steps before the full flag

type Mode = 'pixel' | 'zoom';

export default function Reveal() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { poolEntities, stats, settings, recordAnswer, submitRecord } = useApp();
  const [mode, setMode] = useState<Mode>('pixel');
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<Entity[]>([]);
  const [i, setI] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  const [level, setLevel] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Entity[]>([]);
  const [done, setDone] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const focus = useMemo(() => (q ? focusPoint(q.target.id) : ([0.5, 0.5] as [number, number])), [q]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const ask = (target: Entity) => {
    setQ(makeQuestion(target, { prompt: 'flag', answer: 'name', input: 'choice' }, poolEntities, { similar: settings.similarOptions }));
    setLevel(0);
    setPicked(null);
  };

  const start = () => {
    const d = buildDeck(poolEntities, Math.min(ROUNDS, poolEntities.length), stats);
    setDeck(d);
    setI(0);
    setScore(0);
    setMissed([]);
    setDone(false);
    setNewRecord(false);
    setStarted(true);
    ask(d[0]);
  };

  // reveal a bit more every few seconds
  useEffect(() => {
    if (!q || picked) return;
    timer.current = setInterval(() => setLevel(l => Math.min(l + 1, LEVELS)), STEP_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [q, picked]);

  const choose = (e: Entity) => {
    if (!q || picked) return;
    const ok = e.id === q.target.id;
    setPicked(e.id);
    recordAnswer(q.target.id, ok);
    const pts = ok ? LEVELS + 1 - Math.min(level, LEVELS) : 0; // 6 … 1
    setScore(s => s + pts);
    if (!ok) setMissed(m => [...m, q.target]);
    setLevel(LEVELS);
  };

  const next = () => {
    const ni = i + 1;
    if (ni >= deck.length) {
      setDone(true);
      setNewRecord(submitRecord(`reveal:${mode}:${JSON.stringify(settings.pool)}`, score));
      return;
    }
    setI(ni);
    ask(deck[ni]);
  };

  const flagW = Math.min(width, MAX_WIDTH) - space.lg * 2;
  const flagH = flagW / 1.5;

  if (!started) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Pixelada o zoom' }} />
        <T muted style={{ marginTop: space.sm }}>
          La bandera empieza muy pixelada (o muy ampliada) y se va revelando. Cuanto antes aciertes, más puntos.
        </T>
        <View style={{ marginTop: space.xl }}>
          <Segmented options={[{ key: 'pixel', label: 'Pixelada' }, { key: 'zoom', label: 'Zoom' }]} value={mode} onChange={setMode} />
        </View>
        <View style={{ flex: 1 }} />
        <Button title="Empezar" onPress={start} disabled={poolEntities.length < 4} style={{ marginTop: space.xl }} />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Pixelada o zoom' }} />
        <ResultView title="Puntuación" score={String(score)} detail={`Máximo posible: ${deck.length * (LEVELS + 1)}`} newRecord={newRecord} onAgain={start}>
          <MissedList items={missed} />
        </ResultView>
      </Screen>
    );
  }

  if (!q) return null;
  const stateOf = (id: string): OptionState => (!picked ? 'idle' : id === q.target.id ? 'correct' : id === picked ? 'wrong' : 'dim');
  const full = level >= LEVELS;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: mode === 'pixel' ? 'Pixelada' : 'Zoom' }} />
      <GameBar left={<T variant="label" muted>{i + 1} / {deck.length}</T>} right={<T variant="heading">{score} pts</T>} />
      <ProgressBar value={Math.min(level, LEVELS) / LEVELS} color={c.warning} />
      <View style={{ alignItems: 'center', marginVertical: space.lg }}>
        <RevealFrame width={flagW} height={flagH}>
          {full ? (
            <Flag id={q.target.id} width={flagW} height={flagH} normalized />
          ) : mode === 'pixel' ? (
            <PixelFlag id={q.target.id} level={level} width={flagW} height={flagH} />
          ) : (
            <ZoomFlag id={q.target.id} level={level} focus={focus} width={flagW} height={flagH} />
          )}
        </RevealFrame>
        {!picked && <T variant="caption" muted style={{ marginTop: space.sm }}>Ahora vale {LEVELS + 1 - Math.min(level, LEVELS)} puntos</T>}
      </View>
      <View style={{ gap: space.sm }}>
        {q.options.map(o => (
          <OptionTile key={o.id} state={stateOf(o.id)} onPress={() => choose(o)} style={{ alignItems: 'flex-start', paddingVertical: 14 }}>
            <T variant="heading" style={{ fontWeight: '500' }}>{o.name}</T>
          </OptionTile>
        ))}
      </View>
      {picked && <Button title={i + 1 >= deck.length ? 'Ver resultado' : 'Siguiente'} onPress={next} style={{ marginTop: space.lg }} />}
    </Screen>
  );
}
