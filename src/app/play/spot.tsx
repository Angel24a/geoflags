import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { Flag } from '@/components/Flag';
import { GameBar, MissedList, OptionTile, ResultView, type OptionState } from '@/components/game';
import { Button, Row, Screen, T } from '@/components/ui';
import { FLAGS, type Entity } from '@/data';
import { shuffle } from '@/lib/random';
import { buildDeck } from '@/lib/quiz';
import { makeVariants } from '@/lib/variants';
import { useApp } from '@/state/app-state';
import { MAX_WIDTH, space, useTheme } from '@/theme';

const ROUNDS = 10;

interface Round {
  target: Entity;
  /** 4 svg strings; `correct` is the index of the real flag. */
  options: string[];
  correct: number;
}

function makeRound(target: Entity): Round | null {
  const variants = makeVariants(target, FLAGS[target.id], 3);
  if (variants.length < 3) return null;
  const options = shuffle([FLAGS[target.id], ...variants.map(v => v.svg)]);
  return { target, options, correct: options.indexOf(FLAGS[target.id]) };
}

function buildRounds(pool: Entity[], stats: Record<string, { c: number; w: number }>): Round[] {
  const rounds: Round[] = [];
  for (const e of buildDeck(pool, pool.length, stats)) {
    const r = makeRound(e);
    if (r) rounds.push(r);
    if (rounds.length >= ROUNDS) break;
  }
  return rounds;
}

export default function Spot() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { poolEntities, stats, recordAnswer, submitRecord, settings } = useApp();
  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rounds = useMemo(() => buildRounds(poolEntities, stats), [poolEntities, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Entity[]>([]);
  const [done, setDone] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  const r = rounds[i];
  const tileW = (Math.min(width, MAX_WIDTH) - space.lg * 2 - space.md) / 2;

  if (!r) return <Screen edges={[]}><T muted center style={{ marginTop: space.xl }}>No hay suficientes banderas.</T></Screen>;

  const choose = (k: number) => {
    if (picked !== null) return;
    const ok = k === r.correct;
    setPicked(k);
    recordAnswer(r.target.id, ok);
    if (ok) setScore(s => s + 1);
    else setMissed(m => [...m, r.target]);
  };

  const next = () => {
    if (i + 1 >= rounds.length) {
      setDone(true);
      setNewRecord(submitRecord(`spot:${JSON.stringify(settings.pool)}`, score));
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  const again = () => {
    setSeed(s => s + 1);
    setI(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
    setDone(false);
    setNewRecord(false);
  };

  if (done) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Encuentra el error' }} />
        <ResultView title="Aciertos" score={`${score}/${rounds.length}`} newRecord={newRecord} onAgain={again}>
          <MissedList items={missed} />
        </ResultView>
      </Screen>
    );
  }

  const stateOf = (k: number): OptionState => (picked === null ? 'idle' : k === r.correct ? 'correct' : k === picked ? 'wrong' : 'dim');

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Encuentra el error' }} />
      <GameBar left={<T variant="label" muted>{i + 1} / {rounds.length}</T>} right={<T variant="heading">{score} ✓</T>} />
      <T variant="caption" muted center style={{ marginTop: space.md }}>¿Cuál es la bandera correcta de…</T>
      <T variant="title" center style={{ marginBottom: space.lg }}>{r.target.name}</T>
      <Row wrap gap={space.md}>
        {r.options.map((xml, k) => (
          <OptionTile key={k} state={stateOf(k)} onPress={() => choose(k)} style={{ width: tileW, height: tileW * 0.75 }}>
            <Flag id={r.target.id} xml={xml} width={tileW - 24} height={tileW * 0.75 - 24} />
          </OptionTile>
        ))}
      </Row>
      {picked !== null && (
        <>
          <T center color={picked === r.correct ? c.success : c.error} variant="heading" style={{ marginTop: space.lg }}>
            {picked === r.correct ? '¡Correcto!' : 'Esa tenía un error'}
          </T>
          <Button title={i + 1 >= rounds.length ? 'Ver resultado' : 'Siguiente'} onPress={next} style={{ marginTop: space.md }} />
        </>
      )}
    </Screen>
  );
}
