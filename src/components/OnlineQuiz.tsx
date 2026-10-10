import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { modeOf, pointsFor, type GameResult, type OnlineGameConfig } from '@/lib/online/seeded';
import type { Question } from '@/lib/quiz';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';
import { GameBar } from './game';
import { QuestionView } from './QuestionView';
import { Button, ProgressBar, T } from './ui';

interface Props {
  cfg: OnlineGameConfig;
  questions: Question[];
  /** Called after every answer with the running totals. */
  onProgress?: (p: { answered: number; score: number; timeMs: number }) => void;
  onFinish: (r: GameResult) => void;
}

/** Plays a fixed list of questions (the same for every player) with points for speed. */
export function OnlineQuiz({ cfg, questions, onProgress, onFinish }: Props) {
  const c = useTheme();
  const { recordAnswer } = useApp();
  const mode = modeOf(cfg.mode);
  const quiz = useMemo(() => ({ prompt: mode.prompt, answer: mode.answer, input: mode.input }), [mode]);
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const shownAt = useRef(Date.now());
  const totalMs = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const q = questions[i];
  if (!q) return null;

  const next = (newScore: number, newCorrect: number) => {
    setAnswered(null);
    setPicked(null);
    setLastPoints(null);
    if (i + 1 >= questions.length) {
      onFinish({ score: newScore, correct: newCorrect, total: questions.length, timeMs: totalMs.current });
    } else {
      setI(i + 1);
    }
  };

  const onAnswer = (ok: boolean, p: string | null) => {
    const ms = Date.now() - shownAt.current;
    totalMs.current += ms;
    const pts = pointsFor(ok, ms);
    const newScore = score + pts;
    const newCorrect = correct + (ok ? 1 : 0);
    setAnswered(ok);
    setPicked(p);
    setScore(newScore);
    setCorrect(newCorrect);
    setLastPoints(pts);
    recordAnswer(q.target.id, ok);
    onProgress?.({ answered: i + 1, score: newScore, timeMs: totalMs.current });
    if (ok) timer.current = setTimeout(() => next(newScore, newCorrect), 700);
  };

  return (
    <View>
      <GameBar left={<T variant="label" muted>{i + 1} / {questions.length}</T>} right={<T variant="heading">{score} pts</T>} />
      <ProgressBar value={i / questions.length} />
      <QuestionView key={i} question={q} cfg={quiz} answered={answered} picked={picked} onAnswer={onAnswer} />
      {lastPoints !== null && lastPoints > 0 && (
        <T center variant="label" color={c.success} style={{ marginTop: space.sm }}>+{lastPoints}</T>
      )}
      {answered === false && (
        <Button title={i + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'} onPress={() => next(score, correct)} style={{ marginTop: space.lg }} />
      )}
    </View>
  );
}
