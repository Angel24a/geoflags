import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, useWindowDimensions, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { ShapeView } from '@/components/ShapeView';
import { WorldMap } from '@/components/WorldMap';
import {
  EntityPrompt, GameBar, Lives, MissedList, OptionTile, PromptBox, ResultView, useCountdown, type OptionState,
} from '@/components/game';
import { Button, ProgressBar, Row, Screen, T } from '@/components/ui';
import { BY_ID, type Entity } from '@/data';
import { ATTR_LABEL, buildDeck, checkTyped, eligibleFor, makeQuestion, nextTarget, RULE_LABEL, type Attr, type InputMode, type Question, type Rule } from '@/lib/quiz';
import { locate } from '@/lib/geo';
import { useApp } from '@/state/app-state';
import { MAX_WIDTH, radius, space, useTheme, noOutline } from '@/theme';

const LIVES = 3;
const TIME = 60;

function questionText(prompt: Attr, answer: Attr, target: Entity): string {
  if (answer === 'map') return prompt === 'name' ? 'Tócalo en el mapa' : prompt === 'capital' ? '¿Dónde está esta capital?' : '¿Dónde está? Tócalo en el mapa';
  if (answer === 'name') return prompt === 'flag' ? '¿De quién es esta bandera?' : prompt === 'capital' ? '¿De qué país es la capital?' : '¿Qué territorio es?';
  if (answer === 'capital') return '¿Cuál es la capital?';
  if (answer === 'flag') return '¿Cuál es su bandera?';
  if (answer === 'shape') return '¿Cuál es su forma?';
  return target.name;
}

export default function Quiz() {
  const p = useLocalSearchParams<{ prompt: Attr; answer: Attr; input: InputMode; rule: Rule; n?: string }>();
  const cfg = useMemo(() => ({ prompt: p.prompt ?? 'flag', answer: p.answer ?? 'name', input: p.input ?? 'choice' }), [p.prompt, p.answer, p.input]);
  const rule: Rule = p.rule ?? 'classic';
  const c = useTheme();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MAX_WIDTH) - space.lg * 2;
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
  const [typed, setTyped] = useState('');
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
      setTyped('');
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

  const t = question.target;
  const stateOf = (id: string): OptionState => {
    if (answered === null) return 'idle';
    if (id === t.id) return 'correct';
    if (id === picked) return 'wrong';
    return 'dim';
  };

  const renderOptions = () => {
    if (cfg.answer === 'flag' || cfg.answer === 'shape') {
      const tileW = (contentW - space.md) / 2;
      return (
        <Row wrap gap={space.md}>
          {question.options.map(o => (
            <OptionTile key={o.id} state={stateOf(o.id)} onPress={() => answer(o.id === t.id, o.id)} style={{ width: tileW, height: tileW * 0.72 }}>
              {cfg.answer === 'flag' ? <Flag id={o.id} width={tileW - 24} height={tileW * 0.72 - 24} /> : <ShapeView id={o.id} size={tileW * 0.72 - 20} />}
            </OptionTile>
          ))}
        </Row>
      );
    }
    return (
      <View style={{ gap: space.sm }}>
        {question.options.map(o => (
          <OptionTile key={o.id} state={stateOf(o.id)} onPress={() => answer(o.id === t.id, o.id)} style={{ alignItems: 'flex-start', paddingVertical: 15 }}>
            <T variant="heading" style={{ fontWeight: '500' }}>{cfg.answer === 'capital' ? o.capital : o.name}</T>
          </OptionTile>
        ))}
      </View>
    );
  };

  const correctLabel = cfg.answer === 'capital' ? t.capital : t.name;

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

      <T variant="label" muted center style={{ marginTop: space.lg }}>{questionText(cfg.prompt, cfg.answer, t)}</T>
      <PromptBox>
        <EntityPrompt e={t} attr={cfg.prompt as 'flag'} width={contentW} />
      </PromptBox>

      {cfg.input === 'choice' && renderOptions()}

      {cfg.input === 'type' && (
        <View style={{ gap: space.sm }}>
          <View style={{ borderWidth: answered === null ? 1 : 2, borderColor: answered === null ? c.border : answered ? c.success : c.error, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md }}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={answered === null}
              autoFocus
              autoCorrect={false}
              placeholder={cfg.answer === 'capital' ? 'Escribe la capital' : 'Escribe el nombre'}
              placeholderTextColor={c.textSecondary}
              onSubmitEditing={() => typed.trim() && answer(checkTyped(typed, t, cfg.answer), typed.trim())}
              returnKeyType="send"
              style={[{ fontSize: 18, color: c.text, paddingVertical: 14 }, noOutline]}
            />
          </View>
          {answered === null ? (
            <Row gap={space.sm}>
              <Button title="No lo sé" kind="secondary" style={{ flex: 1 }} onPress={() => answer(false, null)} />
              <Button title="Comprobar" style={{ flex: 1 }} disabled={!typed.trim()} onPress={() => answer(checkTyped(typed, t, cfg.answer), typed.trim())} />
            </Row>
          ) : (
            <T center color={answered ? c.success : c.error} variant="heading">{answered ? '¡Correcto!' : `Era: ${correctLabel}`}</T>
          )}
        </View>
      )}

      {cfg.input === 'map' && (
        <View style={{ flex: 1, gap: space.sm }}>
          <WorldMap
            height={Math.max(260, Math.min(420, contentW * 0.75))}
            onPick={id => answer(id === t.id, id ?? '__none')}
            pin={answered === false ? locate(t.id) : null}
            pinColor={c.success}
            highlights={
              answered === null ? [] : [
                { id: t.id, color: c.success },
                ...(picked && picked !== t.id && picked !== '__none' ? [{ id: picked, color: c.error }] : []),
              ]
            }
          />
          {answered === false && <T center color={c.error} variant="label">Era {t.name}{picked && picked !== '__none' ? ` · tocaste ${nameOf(picked)}` : ''}</T>}
          {answered === null && <T center variant="caption" muted>Pellizca o usa + / − para ampliar</T>}
        </View>
      )}

      {answered === false && rule !== 'timed' && !(rule === 'survival' && lives <= 0) && rule !== 'streak' && (
        <Button title="Siguiente" onPress={() => next(score, lives)} style={{ marginTop: space.lg }} />
      )}
    </Screen>
  );
}

function nameOf(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}
