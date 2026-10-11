import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Flag } from '@/components/Flag';
import { GameBar, OptionTile, SummaryCard } from '@/components/game';
import { Slider } from '@/components/Slider';
import { Button, Card, ProgressBar, Row, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import type { Entity } from '@/data';
import { describePool } from '@/lib/pool';
import {
  estimatePoints, formatPopulation, fromSlider, nextHigherLower, populationOptions, populationTargets, POP_MODE_HELP, POP_MODE_LABEL,
  roundPopulation, type PopDifficulty, type PopMode,
} from '@/lib/population-game';
import { pick, shuffle } from '@/lib/random';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

type Show = 'both' | 'flag';
interface Options { mode: PopMode; rounds: number; difficulty: PopDifficulty; show: Show }

const DIFFICULTY = [
  { key: 'easy' as const, label: 'Fácil' },
  { key: 'normal' as const, label: 'Normal' },
  { key: 'hard' as const, label: 'Difícil' },
];

const exact = (e: Entity) => `${e.population!.toLocaleString('es-ES')} hab.${e.popYear ? ` (${e.popYear})` : ''}`;

export default function Population() {
  const { settings, poolEntities } = useApp();
  const [opts, setOpts] = useState<Options>({ mode: 'choice', rounds: 10, difficulty: 'normal', show: 'both' });
  const [playing, setPlaying] = useState(false);
  const [game, setGame] = useState(0);
  const set = (p: Partial<Options>) => setOpts(o => ({ ...o, ...p }));

  if (playing) {
    const props = { opts, onAgain: () => setGame(g => g + 1), onOptions: () => setPlaying(false) };
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: POP_MODE_LABEL[opts.mode] }} />
        {opts.mode === 'choice' ? <ChoiceGame key={game} {...props} /> : opts.mode === 'higher' ? <HigherGame key={game} {...props} /> : <EstimateGame key={game} {...props} />}
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Población' }} />
      <SectionTitle>Modo</SectionTitle>
      <Segmented options={(['choice', 'higher', 'estimate'] as const).map(k => ({ key: k, label: POP_MODE_LABEL[k] }))} value={opts.mode} onChange={mode => set({ mode })} />
      <T variant="caption" muted style={{ marginTop: space.sm }}>{POP_MODE_HELP[opts.mode]}</T>

      {opts.mode !== 'higher' && (
        <>
          <SectionTitle>Rondas</SectionTitle>
          <Segmented options={[5, 10, 20].map(n => ({ key: String(n), label: String(n) }))} value={String(opts.rounds)} onChange={k => set({ rounds: Number(k) })} />
        </>
      )}
      {opts.mode !== 'estimate' && (
        <>
          <SectionTitle>Dificultad</SectionTitle>
          <Segmented options={DIFFICULTY} value={opts.difficulty} onChange={difficulty => set({ difficulty })} />
          <T variant="caption" muted style={{ marginTop: space.sm }}>
            {opts.mode === 'choice'
              ? { easy: 'Cifras muy distintas entre sí.', normal: 'Cifras que al menos se doblan.', hard: 'Cifras cercanas a la buena.' }[opts.difficulty]
              : { easy: 'Uno tiene al menos el triple que el otro.', normal: 'Diferencias variadas.', hard: 'Poblaciones parecidas.' }[opts.difficulty]}
          </T>
        </>
      )}
      <SectionTitle>Mostrar</SectionTitle>
      <Segmented options={[{ key: 'both', label: 'Bandera y nombre' }, { key: 'flag', label: 'Solo bandera' }]} value={opts.show} onChange={show => set({ show: show as Show })} />

      <Card style={{ marginTop: space.lg }}>
        <T variant="caption" muted>Territorios en juego</T>
        <T variant="label">{describePool(settings.pool)} · {populationTargets(poolEntities).length} con población</T>
      </Card>
      <Button title="Empezar" onPress={() => { setGame(g => g + 1); setPlaying(true); }} style={{ marginTop: space.lg }} />
    </Screen>
  );
}

interface GameProps { opts: Options; onAgain: () => void; onOptions: () => void }

function Who({ e, show, size = 64, reveal }: { e: Entity; show: Show; size?: number; reveal?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: space.xs }}>
      <Flag id={e.id} height={size} />
      <T variant="heading" center numberOfLines={2}>{show === 'both' || reveal ? e.name : '¿?'}</T>
    </View>
  );
}

function useTargets() {
  const { poolEntities } = useApp();
  const [targets] = useState(() => populationTargets(poolEntities));
  return targets;
}

// --- Elige la cifra -------------------------------------------------------------
function ChoiceGame({ opts, onAgain, onOptions }: GameProps) {
  const c = useTheme();
  const { recordAnswer, submitRecord } = useApp();
  const targets = useTargets();
  const [deck] = useState(() => shuffle(targets).slice(0, opts.rounds));
  const [i, setI] = useState(0);
  const [options, setOptions] = useState(() => populationOptions(deck[0], targets, opts.difficulty));
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [record, setRecord] = useState(false);
  const e = deck[i];
  const right = e ? roundPopulation(e.population!) : 0;

  if (!e) {
    const pct = Math.round((100 * correct) / deck.length);
    return (
      <SummaryCard title={`${correct} de ${deck.length}`} lines={[`${pct}% de acierto`]} record={record} onAgain={onAgain} onOptions={onOptions} />
    );
  }

  const answer = (v: number) => {
    if (picked !== null) return;
    setPicked(v);
    const ok = v === right;
    recordAnswer(e.id, ok);
    if (ok) setCorrect(n => n + 1);
  };
  const next = () => {
    const n = i + 1;
    if (n >= deck.length) {
      const finalCorrect = correct;
      setRecord(submitRecord('population:choice', Math.round((100 * finalCorrect) / deck.length)));
    } else {
      setOptions(populationOptions(deck[n], targets, opts.difficulty));
    }
    setPicked(null);
    setI(n);
  };

  return (
    <View>
      <GameBar left={<T variant="label" muted>{i + 1} / {deck.length}</T>} right={<T variant="label">{correct} aciertos</T>} />
      <ProgressBar value={i / deck.length} />
      <Card style={{ marginTop: space.md, paddingVertical: space.xl }}>
        <Who e={e} show={opts.show} size={90} reveal={picked !== null} />
        <T muted center style={{ marginTop: space.sm }}>¿Cuántos habitantes tiene?</T>
      </Card>
      <View style={{ gap: space.sm, marginTop: space.md }}>
        {options.map(v => (
          <OptionTile
            key={v}
            onPress={() => answer(v)}
            disabled={picked !== null}
            state={picked === null ? 'idle' : v === right ? 'correct' : v === picked ? 'wrong' : 'dim'}
            style={{ paddingVertical: space.md, alignItems: 'center' }}
          >
            <T variant="heading">{formatPopulation(v)}</T>
          </OptionTile>
        ))}
      </View>
      {picked !== null && (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <T center color={picked === right ? c.success : c.error}>{picked === right ? '¡Correcto!' : 'No'} · {e.name}: {exact(e)}</T>
          <Button title={i + 1 >= deck.length ? 'Ver resultado' : 'Siguiente'} onPress={next} />
        </View>
      )}
    </View>
  );
}

// --- ¿Más o menos? --------------------------------------------------------------
function HigherGame({ opts, onAgain, onOptions }: GameProps) {
  const c = useTheme();
  const { recordAnswer, submitRecord, records } = useApp();
  const targets = useTargets();
  const [a, setA] = useState<Entity>(() => pick(targets));
  const [b, setB] = useState<Entity>(() => nextHigherLower(a, targets, opts.difficulty));
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<null | boolean>(null);
  const [over, setOver] = useState(false);
  const [record, setRecord] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (over) {
    return (
      <SummaryCard
        title={`Racha de ${streak}`}
        lines={[`Récord: ${Math.max(streak, records['population:higher'] ?? 0)}`]}
        record={record}
        onAgain={onAgain}
        onOptions={onOptions}
      />
    );
  }

  const guess = (more: boolean) => {
    if (result !== null) return;
    const ok = more ? b.population! >= a.population! : b.population! <= a.population!;
    setResult(ok);
    recordAnswer(b.id, ok);
    if (ok) {
      const s = streak + 1;
      setStreak(s);
      // the second territory becomes the reference for the next question
      timer.current = setTimeout(() => {
        setA(b);
        setB(nextHigherLower(b, targets, opts.difficulty));
        setResult(null);
      }, 1100);
    } else {
      setRecord(submitRecord('population:higher', streak));
    }
  };

  return (
    <View>
      <GameBar left={<T variant="label" muted>Racha {streak}</T>} right={<T variant="caption" muted>Récord {records['population:higher'] ?? 0}</T>} />
      <Card style={{ marginTop: space.sm, gap: space.sm }}>
        <Who e={a} show={opts.show} reveal />
        <T variant="title" center>{formatPopulation(a.population!)}</T>
      </Card>
      <T center muted style={{ marginVertical: space.md }}>¿Tiene más o menos habitantes…</T>
      <Card style={{ gap: space.sm, borderColor: result === null ? c.border : result ? c.success : c.error, borderWidth: result === null ? 1 : 2 }}>
        <Who e={b} show={opts.show} reveal={result !== null} />
        <T variant="title" center color={result === null ? c.textSecondary : c.text}>{result === null ? '?' : formatPopulation(b.population!)}</T>
      </Card>
      {result === null ? (
        <Row gap={space.sm} style={{ marginTop: space.lg }}>
          <Button title="▲ Más" onPress={() => guess(true)} style={{ flex: 1 }} />
          <Button title="▼ Menos" onPress={() => guess(false)} style={{ flex: 1 }} />
        </Row>
      ) : result ? (
        <T variant="heading" center color={c.success} style={{ marginTop: space.lg }}>¡Correcto!</T>
      ) : (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <T center color={c.error}>{b.name} tiene {exact(b)}</T>
          <Button title="Ver resultado" onPress={() => setOver(true)} />
        </View>
      )}
    </View>
  );
}

// --- Estima ----------------------------------------------------------------------
function EstimateGame({ opts, onAgain, onOptions }: GameProps) {
  const c = useTheme();
  const { submitRecord, recordAnswer } = useApp();
  const targets = useTargets();
  const [deck] = useState(() => shuffle(targets).slice(0, opts.rounds));
  const [i, setI] = useState(0);
  const [slider, setSlider] = useState(0.5);
  const [points, setPoints] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [record, setRecord] = useState(false);
  const e = deck[i];
  const guess = roundPopulation(fromSlider(slider));

  if (!e) {
    const avg = Math.round(total / deck.length);
    return <SummaryCard title={`${total} puntos`} lines={[`Media: ${avg} de 100 por ronda`]} record={record} onAgain={onAgain} onOptions={onOptions} />;
  }

  const check = () => {
    const p = estimatePoints(guess, e.population!);
    setPoints(p);
    setTotal(t => t + p);
    recordAnswer(e.id, p >= 70);
  };
  const next = () => {
    const n = i + 1;
    if (n >= deck.length) setRecord(submitRecord('population:estimate', Math.round(total / deck.length)));
    setPoints(null);
    setSlider(0.5);
    setI(n);
  };

  return (
    <View>
      <GameBar left={<T variant="label" muted>{i + 1} / {deck.length}</T>} right={<T variant="label">{total} pts</T>} />
      <ProgressBar value={i / deck.length} />
      <Card style={{ marginTop: space.md, paddingVertical: space.xl }}>
        <Who e={e} show={opts.show} size={90} reveal={points !== null} />
      </Card>
      <T variant="caption" muted center style={{ marginTop: space.lg }}>Tu estimación</T>
      <T variant="title" center>{formatPopulation(guess)}</T>
      <Slider value={slider} onChange={setSlider} disabled={points !== null} />
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="caption" muted>10</T>
        <T variant="caption" muted>10.000</T>
        <T variant="caption" muted>10 M</T>
        <T variant="caption" muted>2.000 M</T>
      </Row>
      {points === null ? (
        <Button title="Comprobar" onPress={check} style={{ marginTop: space.lg }} />
      ) : (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <T variant="heading" center color={points >= 70 ? c.success : points >= 30 ? c.warning : c.error}>+{points} puntos</T>
          <T center>{e.name}: {exact(e)}</T>
          <Button title={i + 1 >= deck.length ? 'Ver resultado' : 'Siguiente'} onPress={next} />
        </View>
      )}
    </View>
  );
}
