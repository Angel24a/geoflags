import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QuestionView } from '@/components/QuestionView';
import { GameBar, Lives, MissedList, ResultView, useCountdown } from '@/components/game';
import { Button, ProgressBar, Screen, T } from '@/components/ui';
import type { Entity } from '@/data';
import { ATTR_LABEL, buildDeck, eligibleFor, makeQuestion, nextTarget, RULE_LABEL, type Attr, type InputMode, type Question, type Rule } from '@/lib/quiz';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

const LIVES = 3;
const TIME = 60;

export default function Quiz() {
  const p = useLocalSearchParams<{ prompt: Attr; answer: Attr; input: InputMode; rule: Rule; n?: string }>();
  const cfg = useMemo(() => ({ prompt: p.prompt ?? 'flag', answer: p.answer ?? 'name', input: p.input ?? 'choice' }), [p.prompt, p.answer, p.input]);
  const rule: Rule = p.rule ?? 'classic';
  const c = useTheme();
  const { poolEntities, settings, stats, recordAnswer, submitRecord } = useApp();

  const candidates = useMemo(() => eligibleFor(cfg, poolEntities), [cfg, poolEntities]);
  const deckSize = rule === 'classic' ? (Number(p.n) || candidates.length) : Infinity;

  const [round, setRound] = useState(0); // restart counter
  const [deck, setDeck] = useState<Entity[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null); // option id / map id / typed text marker
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [missed, setMissed] = useState<Entity[]>([]);
  const [finished, setFinished] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const recent = useRef<string[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeQ = useCallback(
    (target: Entity) => makeQuestion(target, cfg, poolEntities, { similar: settings.similarOptions }),
    [cfg, poolEntities, settings.similarOptions],
  );

  // (Re)start
  useEffect(() => {
    const d = rule === 'classic' ? buildDeck(candidates, Math.min(deckSize, candidates.length), stats) : [];
    const first = rule === 'classic' ? d[0] : nextTarget(candidates, [], stats);
    setDeck(d);
    setIndex(0);
    setScore(0);
    setLives(LIVES);
    setMissed([]);
    setFinished(false);
    setNewRecord(false);
    setPicked(null);
    setAnswered(null);
    recent.current = first ? [first.id] : [];
    setQuestion(first ? makeQ(first) : null);
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const poolKey = JSON.stringify(settings.pool);
  const recordKey = `${rule}:${cfg.prompt}>${cfg.answer}:${cfg.input}:${poolKey}`;

  const finish = useCallback(
    (finalScore: number, total: number) => {
      setFinished(true);
      const value = rule === 'classic' ? Math.round((100 * finalScore) / Math.max(1, total)) : finalScore;
      setNewRecord(submitRecord(recordKey, value));
    },
    [rule, recordKey, submitRecord],
  );

  const scoreRef = useRef(score);
  scoreRef.current = score;
  const timer = useCountdown(TIME, rule === 'timed' && !finished && !!question, () => finish(scoreRef.current, 0));

  const next = useCallback(
    (newScore: number, newLives: number) => {
      setPicked(null);
      setAnswered(null);
      if (rule === 'classic') {
        const ni = index + 1;
        if (ni >= deck.length) return finish(newScore, deck.length);
        setIndex(ni);
        setQuestion(makeQ(deck[ni]));
        return;
      }
      if ((rule === 'survival' && newLives <= 0) || (rule === 'streak' && newLives < LIVES)) return finish(newScore, 0);
      const t = nextTarget(candidates, recent.current, stats);
      recent.current = [...recent.current, t.id].slice(-50);
      setIndex(i => i + 1);
      setQuestion(makeQ(t));
    },
    [rule, index, deck, candidates, stats, makeQ, finish],
  );

  const answer = (ok: boolean, pickedId: string | null) => {
    if (!question || answered !== null || finished) return;
    setPicked(pickedId);
    setAnswered(ok);
    recordAnswer(question.target.id, ok);
    const newScore = score + (ok ? 1 : 0);
    const newLives = lives - (ok ? 0 : 1);
    setScore(newScore);
    setLives(newLives);
    if (!ok) setMissed(m => (m.some(x => x.id === question.target.id) ? m : [...m, question.target]));
    // Correct answers move on quickly; wrong ones wait for "Siguiente" (except against the clock).
    if (ok || rule === 'timed') {
      advanceTimer.current = setTimeout(() => next(newScore, newLives), ok ? 650 : 1200);
    } else if ((rule === 'survival' && newLives <= 0) || rule === 'streak') {
      // show the answer briefly, then the result
      advanceTimer.current = setTimeout(() => next(newScore, newLives), 1600);
    }
  };

  if (!candidates.length || !question) {
    return (
      <Screen edges={[]}>
        <T style={{ marginTop: space.xl }} center muted>No hay banderas que encajen con esta combinación. Cambia las banderas en juego.</T>
      </Screen>
    );
  }

  const title = `${RULE_LABEL[rule]} · ${ATTR_LABEL[cfg.prompt]} → ${ATTR_LABEL[cfg.answer]}`;

  if (finished) {
    const total = rule === 'classic' ? deck.length : score + missed.length;
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title }} />
        <ResultView
          title={rule === 'classic' ? 'Aciertos' : rule === 'timed' ? 'Aciertos en 60 s' : 'Puntuación'}
          score={rule === 'classic' ? `${score}/${total}` : String(score)}
          detail={rule === 'classic' ? `${Math.round((100 * score) / Math.max(1, total))}% de acierto` : undefined}
          newRecord={newRecord}
          onAgain={() => setRound(r => r + 1)}
        >
          <MissedList items={missed} />
        </ResultView>
      </Screen>
    );
  }

  return (
    <Screen edges={[]} scroll={cfg.input !== 'map'}>
      <Stack.Screen options={{ title }} />
      <GameBar
        left={
          rule === 'survival' ? <Lives left={lives} /> :
          rule === 'timed' ? <T variant="heading" color={timer.left < 10 ? c.error : c.text}>{Math.ceil(timer.left)} s</T> :
          rule === 'streak' ? <T variant="heading">Racha: {score}</T> :
          <T variant="label" muted>{index + 1} / {deck.length}</T>
        }
        right={<T variant="heading">{rule === 'classic' ? `${score} ✓` : rule === 'streak' ? '' : `${score} pts`}</T>}
      />
      {rule === 'classic' && <ProgressBar value={index / deck.length} />}
      {rule === 'timed' && <ProgressBar value={timer.left / TIME} color={timer.left < 10 ? c.error : c.accent} />}

      <QuestionView key={`${round}-${index}`} question={question} cfg={cfg} answered={answered} picked={picked} onAnswer={answer} />

      {answered === false && rule !== 'timed' && !(rule === 'survival' && lives <= 0) && rule !== 'streak' && (
        <Button title="Siguiente" onPress={() => next(score, lives)} style={{ marginTop: space.lg }} />
      )}
    </Screen>
  );
}

