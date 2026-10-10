import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Share, TextInput, View } from 'react-native';

import { OnlineQuiz } from '@/components/OnlineQuiz';
import { Board, describeGame, GamePicker, OnlineGate } from '@/components/online';
import { Button, Card, Row, Screen, SectionTitle, T } from '@/components/ui';
import {
  challengeBoard, createChallenge, getChallenge, myChallenges, submitChallenge, type BoardRow, type Challenge,
} from '@/lib/online/api';
import { DATA_VERSION, normalizeCode, randomCode, seededQuestions, type GameResult, type OnlineGameConfig } from '@/lib/online/seeded';
import { useApp } from '@/state/app-state';
import { noOutline, radius, space, useTheme } from '@/theme';

type Phase = { kind: 'menu' } | { kind: 'play'; challenge: Challenge } | { kind: 'results'; code: string };

export default function ChallengeScreen() {
  const [phase, setPhase] = useState<Phase>({ kind: 'menu' });
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Retar a amigos' }} />
      <OnlineGate>
        {phase.kind === 'menu' && <Menu onPlay={challenge => setPhase({ kind: 'play', challenge })} onResults={code => setPhase({ kind: 'results', code })} />}
        {phase.kind === 'play' && <Play challenge={phase.challenge} onDone={() => setPhase({ kind: 'results', code: phase.challenge.code })} />}
        {phase.kind === 'results' && <Results code={phase.code} onBack={() => setPhase({ kind: 'menu' })} />}
      </OnlineGate>
    </Screen>
  );
}

function Menu({ onPlay, onResults }: { onPlay: (c: Challenge) => void; onResults: (code: string) => void }) {
  const c = useTheme();
  const { profile } = useApp();
  const [cfg, setCfg] = useState<OnlineGameConfig>({ mode: 'flag-name', pool: 'all', count: 10 });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<{ code: string; created_at: string }[] | null>(null);

  useEffect(() => {
    myChallenges(profile.id).then(setMine).catch(() => setMine([]));
  }, [profile.id]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const challenge = { code: randomCode(6), creator_id: profile.id, config: { ...cfg, version: DATA_VERSION }, seed: Math.floor(Math.random() * 2 ** 31) };
      await createChallenge(challenge);
      onPlay({ ...challenge, created_at: new Date().toISOString() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const ch = await getChallenge(code);
      if (!ch) {
        setError('No existe ningún reto con ese código.');
        return;
      }
      const results = await challengeBoard(code);
      if (results.some(r => r.player_id === profile.id)) onResults(code);
      else onPlay(ch);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.lg, marginTop: space.md }}>
      <Card style={{ gap: space.sm }}>
        <T variant="heading">Tengo un código</T>
        <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: space.md }}>
          <TextInput
            value={code}
            onChangeText={t => setCode(normalizeCode(t).slice(0, 6))}
            placeholder="Código de 6 letras"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[{ fontSize: 20, letterSpacing: 4, color: c.text, paddingVertical: 12, textAlign: 'center' }, noOutline]}
          />
        </View>
        <Button title="Jugar el reto" disabled={code.length !== 6 || busy} onPress={join} />
      </Card>

      <Card style={{ gap: space.sm }}>
        <T variant="heading">Crear un reto</T>
        <T muted>Juegas tú primero y luego compartes el código. Tus amigos jugarán exactamente las mismas preguntas.</T>
        <GamePicker value={cfg} onChange={setCfg} />
        <Button title="Crear y jugar" disabled={busy} onPress={create} style={{ marginTop: space.md }} />
      </Card>

      {error && <T color={c.error}>{error}</T>}

      <View>
        <SectionTitle>Tus retos</SectionTitle>
        {mine === null ? (
          <ActivityIndicator />
        ) : mine.length === 0 ? (
          <T muted>Aún no has jugado ningún reto.</T>
        ) : (
          <Card style={{ gap: space.sm }}>
            {mine.map(m => (
              <Pressable key={m.code} onPress={() => onResults(m.code)}>
                <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                  <T variant="label" style={{ letterSpacing: 2 }}>{m.code}</T>
                  <T variant="caption" muted>{new Date(m.created_at).toLocaleDateString('es-ES')} · ver resultados</T>
                </Row>
              </Pressable>
            ))}
          </Card>
        )}
      </View>
    </View>
  );
}

function Play({ challenge, onDone }: { challenge: Challenge; onDone: () => void }) {
  const c = useTheme();
  const { profile } = useApp();
  const questions = useMemo(() => seededQuestions(challenge.config, challenge.seed), [challenge]);
  const [error, setError] = useState<string | null>(null);
  const outdated = challenge.config.version && challenge.config.version !== DATA_VERSION;

  const finish = async (r: GameResult) => {
    try {
      await submitChallenge(challenge.code, profile.id, r);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <View>
      <T variant="caption" muted style={{ marginTop: space.sm }}>Reto {challenge.code} · {describeGame(challenge.config)}</T>
      {outdated ? <T variant="caption" color={c.warning}>Este reto se creó con otra versión de la app; las preguntas pueden no coincidir.</T> : null}
      <OnlineQuiz cfg={challenge.config} questions={questions} onFinish={finish} />
      {error && <T color={c.error}>No se pudo guardar el resultado: {error}</T>}
    </View>
  );
}

function Results({ code, onBack }: { code: string; onBack: () => void }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const load = () => {
    challengeBoard(code).then(setRows).catch(() => setRows([]));
    getChallenge(code).then(setChallenge).catch(() => {});
  };
  useEffect(load, [code]);

  return (
    <View style={{ gap: space.md, marginTop: space.md }}>
      <Card style={{ alignItems: 'center', gap: 4 }}>
        <T muted>Código del reto</T>
        <T variant="big" style={{ letterSpacing: 6 }}>{code}</T>
        {challenge && <T variant="caption" muted center>{describeGame(challenge.config)}</T>}
        <Button
          title="Compartir con amigos"
          kind="ghost"
          onPress={() => Share.share({ message: `Te reto en GeoFlags: entra en Online → Retar a amigos y usa el código ${code}` })}
        />
      </Card>
      <SectionTitle>Resultados</SectionTitle>
      <Board rows={rows} showTime emptyText="Nadie ha jugado este reto todavía." />
      <Row gap={space.sm}>
        <Button title="Actualizar" kind="secondary" onPress={load} style={{ flex: 1 }} />
        <Button title="Volver" kind="secondary" onPress={onBack} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}
