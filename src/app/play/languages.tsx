import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { GameBar, OptionTile, SummaryCard } from '@/components/game';
import { Button, Card, Chip, ProgressBar, Row, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import { BY_ID, type Language } from '@/data';
import {
  langKey, languagesFor, LANG_MODE_HELP, LANG_MODE_LABEL, makeLangQuestion, matchesLanguage, nextLanguage, spokenIn, suggestLanguages,
  type LangDifficulty, type LangMode, type LangQuestion,
} from '@/lib/languages';
import { useApp } from '@/state/app-state';
import { noOutline, radius, space, useTheme } from '@/theme';

interface Options { mode: LangMode; rounds: number; difficulty: LangDifficulty }

const DIFFICULTY_HELP: Record<LangDifficulty, string> = {
  easy: 'Las opciones son de familias y alfabetos distintos.',
  normal: 'Opciones al azar.',
  hard: 'Lenguas hermanas: portugués y gallego, ruso y ucraniano…',
};

export default function Languages() {
  const [opts, setOpts] = useState<Options>({ mode: 'choice', rounds: 10, difficulty: 'normal' });
  const [playing, setPlaying] = useState(false);
  const [game, setGame] = useState(0);
  const set = (p: Partial<Options>) => setOpts(o => ({ ...o, ...p }));

  if (playing) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: LANG_MODE_LABEL[opts.mode] }} />
        <LangGame key={game} opts={opts} onAgain={() => setGame(g => g + 1)} onOptions={() => setPlaying(false)} />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Idiomas' }} />
      <T muted style={{ marginTop: space.md }}>
        Lee una frase y adivina en qué idioma está. Hay {languagesFor('choice').length} idiomas, de los más hablados a lenguas pequeñas como el feroés, el maltés o el tok pisin.
      </T>
      <SectionTitle>Modo</SectionTitle>
      <Segmented options={(['choice', 'type', 'where'] as const).map(k => ({ key: k, label: LANG_MODE_LABEL[k] }))} value={opts.mode} onChange={mode => set({ mode })} />
      <T variant="caption" muted style={{ marginTop: space.sm }}>{LANG_MODE_HELP[opts.mode]}</T>

      <SectionTitle>Rondas</SectionTitle>
      <Segmented options={[{ key: '10', label: '10' }, { key: '20', label: '20' }, { key: '0', label: 'Sin fin' }]} value={String(opts.rounds)} onChange={k => set({ rounds: Number(k) })} />

      {opts.mode !== 'type' && (
        <>
          <SectionTitle>Dificultad</SectionTitle>
          <Segmented
            options={[{ key: 'easy', label: 'Fácil' }, { key: 'normal', label: 'Normal' }, { key: 'hard', label: 'Difícil' }]}
            value={opts.difficulty}
            onChange={k => set({ difficulty: k as LangDifficulty })}
          />
          <T variant="caption" muted style={{ marginTop: space.sm }}>
            {opts.mode === 'where'
              ? { easy: 'Las otras banderas son de otros continentes.', normal: 'Banderas al azar.', hard: 'Banderas del mismo continente.' }[opts.difficulty]
              : DIFFICULTY_HELP[opts.difficulty]}
          </T>
        </>
      )}
      <Button title="Empezar" onPress={() => { setGame(g => g + 1); setPlaying(true); }} style={{ marginTop: space.xl }} />
      <Button title="Ver todos los idiomas" kind="ghost" onPress={() => router.push({ pathname: '/(tabs)/glossary', params: { tab: 'languages' } })} style={{ marginTop: space.sm }} />
    </Screen>
  );
}

function LangGame({ opts, onAgain, onOptions }: { opts: Options; onAgain: () => void; onOptions: () => void }) {
  const c = useTheme();
  const { stats, recordAnswer, submitRecord } = useApp();
  const list = languagesFor(opts.mode);
  const [recent, setRecent] = useState<string[]>([]);
  const [q, setQ] = useState<LangQuestion>(() => makeLangQuestion(nextLanguage(stats, [], Math.random, list), opts.mode, opts.difficulty));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; picked: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState<null | { record: boolean }>(null);
  const endless = opts.rounds === 0;

  if (done) {
    const pct = Math.round((100 * correct) / Math.max(1, i));
    return <SummaryCard title={`${correct} de ${i}`} lines={[`${pct}% de acierto`]} record={done.record} onAgain={onAgain} onOptions={onOptions} />;
  }

  const respond = (ok: boolean, picked: string) => {
    if (answer) return;
    setAnswer({ ok, picked });
    recordAnswer(langKey(q.lang.id), ok);
    if (ok) setCorrect(n => n + 1);
    setStreak(s => (ok ? s + 1 : 0));
    if (endless && ok) submitRecord(`languages:streak`, streak + 1);
  };

  const next = () => {
    const n = i + 1;
    if (!endless && n >= opts.rounds) {
      setI(n);
      setDone({ record: submitRecord(`languages:${opts.mode}`, Math.round((100 * correct) / n)) });
      return;
    }
    const r = [...recent, q.lang.id].slice(-10);
    setRecent(r);
    setQ(makeLangQuestion(nextLanguage(stats, r, Math.random, list), opts.mode, opts.difficulty, Math.random, q.phrase[0]));
    setAnswer(null);
    setTyped('');
    setI(n);
  };

  const suggestions = opts.mode === 'type' && !answer ? suggestLanguages(typed, 5) : [];
  const submitTyped = (text: string) => text.trim() && respond(matchesLanguage(text, q.lang), text.trim());

  return (
    <View>
      <GameBar
        left={<T variant="label" muted>{endless ? `Ronda ${i + 1}` : `${i + 1} / ${opts.rounds}`}</T>}
        right={<T variant="label">{endless ? `Racha ${streak}` : `${correct} aciertos`}</T>}
      />
      {!endless && <ProgressBar value={i / opts.rounds} />}

      <Card style={{ marginTop: space.md, paddingVertical: space.xl, gap: space.sm }}>
        <T variant="caption" muted center>{opts.mode === 'where' ? '¿En qué país se habla?' : '¿Qué idioma es?'}</T>
        <T center style={{ fontSize: 24, lineHeight: 34, fontWeight: '500' }}>«{q.phrase[0]}»</T>
        {answer && <T center muted>«{q.phrase[1]}»</T>}
      </Card>

      {opts.mode === 'choice' && (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          {q.options.map(l => (
            <OptionTile
              key={l.id}
              onPress={() => respond(l.id === q.lang.id, l.id)}
              disabled={!!answer}
              state={!answer ? 'idle' : l.id === q.lang.id ? 'correct' : l.id === answer.picked ? 'wrong' : 'dim'}
              style={{ paddingVertical: space.md, alignItems: 'center' }}
            >
              <T variant="heading">{l.name}</T>
            </OptionTile>
          ))}
        </View>
      )}

      {opts.mode === 'where' && (
        <Row wrap gap={space.sm} style={{ marginTop: space.md }}>
          {q.flags.map(id => {
            const ok = spokenIn(q.lang, id);
            return (
              <OptionTile
                key={id}
                onPress={() => respond(ok, id)}
                disabled={!!answer}
                state={!answer ? 'idle' : ok ? 'correct' : id === answer.picked ? 'wrong' : 'dim'}
                style={{ flexBasis: '47%', flexGrow: 1, alignItems: 'center', paddingVertical: space.md, gap: 4 }}
              >
                <Flag id={id} height={56} />
                {answer && <T variant="caption" center numberOfLines={1}>{BY_ID.get(id)!.name}</T>}
              </OptionTile>
            );
          })}
        </Row>
      )}

      {opts.mode === 'type' && !answer && (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md }}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              onSubmitEditing={() => submitTyped(typed)}
              placeholder="Nombre del idioma"
              placeholderTextColor={c.textSecondary}
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              style={[{ fontSize: 18, color: c.text, paddingVertical: 12 }, noOutline]}
            />
          </View>
          <Row wrap gap={6}>
            {suggestions.map(l => <Chip key={l.id} label={l.name} onPress={() => submitTyped(l.name)} />)}
          </Row>
          <Row gap={space.sm}>
            <Button title="No lo sé" kind="secondary" onPress={() => respond(false, '')} style={{ flex: 1 }} />
            <Button title="Comprobar" disabled={!typed.trim()} onPress={() => submitTyped(typed)} style={{ flex: 2 }} />
          </Row>
        </View>
      )}

      {answer && <Feedback lang={q.lang} ok={answer.ok} />}
      {answer && (
        <Row gap={space.sm} style={{ marginTop: space.md }}>
          {endless && <Button title="Terminar" kind="secondary" onPress={() => setDone({ record: false })} style={{ flex: 1 }} />}
          <Button title={!endless && i + 1 >= opts.rounds ? 'Ver resultado' : 'Siguiente'} onPress={next} style={{ flex: 2 }} />
        </Row>
      )}
    </View>
  );
}

function Feedback({ lang, ok }: { lang: Language; ok: boolean }) {
  const c = useTheme();
  return (
    <Pressable onPress={() => router.push({ pathname: '/language/[id]', params: { id: lang.id } })}>
      <Card style={{ marginTop: space.md, gap: 4, borderColor: ok ? c.success : c.error }}>
        <T variant="heading" color={ok ? c.success : c.error}>{ok ? '¡Correcto!' : 'No'} · {lang.name}</T>
        <T muted>{lang.native} · {lang.family}{lang.branch ? ` (${lang.branch})` : ''} · escritura: {lang.script.toLowerCase()}</T>
        <Row wrap gap={4} style={{ marginTop: 4 }}>
          {lang.countries.slice(0, 8).map(id => <Flag key={id} id={id} height={18} normalized />)}
        </Row>
        <T variant="caption" color={c.accent} style={{ marginTop: 4 }}>Ver ficha del idioma ›</T>
      </Card>
    </Pressable>
  );
}
