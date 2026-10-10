import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { OnlineQuiz } from '@/components/OnlineQuiz';
import { Board, describeGame, OnlineGate } from '@/components/online';
import { formatTime } from '@/components/game';
import { Button, Card, Screen, SectionTitle, T } from '@/components/ui';
import { dailyBoard, submitDaily, type BoardRow } from '@/lib/online/api';
import { dailyGame, dayKey, seededQuestions, type GameResult } from '@/lib/online/seeded';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

export default function Daily() {
  const c = useTheme();
  const { profile, daily, saveDaily } = useApp();
  const day = dayKey();
  const { cfg, seed } = useMemo(() => dailyGame(day), [day]);
  const questions = useMemo(() => seededQuestions(cfg, seed), [cfg, seed]);
  const done = daily[day];
  const [playing, setPlaying] = useState(false);
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => dailyBoard(day).then(setRows).catch(e => setError((e as Error).message));
  useEffect(() => {
    if (done) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const finish = async (r: GameResult) => {
    saveDaily(day, r);
    setPlaying(false);
    try {
      await submitDaily(day, profile.id, r);
    } catch (e) {
      setError(`No se pudo enviar el resultado: ${(e as Error).message}`);
    }
    load();
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Reto diario' }} />
      <OnlineGate>
        {playing ? (
          <OnlineQuiz cfg={cfg} questions={questions} onFinish={finish} />
        ) : done ? (
          <>
            <Card style={{ alignItems: 'center', gap: 4, marginTop: space.md }}>
              <T muted>Tu resultado de hoy</T>
              <T variant="big">{done.score}</T>
              <T muted>{done.correct}/{done.total} aciertos · {formatTime(done.timeMs / 1000)}</T>
            </Card>
            <SectionTitle>Clasificación de hoy</SectionTitle>
            <Board rows={rows} showTime />
            <T variant="caption" muted center style={{ marginTop: space.md }}>Mañana habrá un reto nuevo.</T>
          </>
        ) : (
          <>
            <Card style={{ gap: space.sm, marginTop: space.md }}>
              <T variant="heading">Reto de hoy</T>
              <T muted>{describeGame(cfg)}</T>
              <T muted>Todos juegan las mismas preguntas. Solo tienes un intento: cuenta la rapidez.</T>
            </Card>
            <Button title="Empezar" onPress={() => setPlaying(true)} style={{ marginTop: space.lg }} />
          </>
        )}
        {error && <T variant="caption" color={c.error} style={{ marginTop: space.md }}>{error}</T>}
      </OnlineGate>
    </Screen>
  );
}
