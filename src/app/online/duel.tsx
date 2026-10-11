import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Share, TextInput, View } from 'react-native';

import { OnlineQuiz } from '@/components/OnlineQuiz';
import { describeGame, GamePicker, OnlineGate } from '@/components/online';
import { Button, Card, Row, Screen, SectionTitle, T } from '@/components/ui';
import { useDuelRoom, type RoomPlayer } from '@/lib/online/room';
import { DATA_VERSION, normalizeCode, randomCode, seededQuestions, type OnlineGameConfig } from '@/lib/online/seeded';
import { useApp } from '@/state/app-state';
import { noOutline, radius, space, useTheme } from '@/theme';

const DEFAULT_GAME: OnlineGameConfig = { mode: 'flag-name', pool: 'all', count: 10 };

export default function Duel() {
  const [room, setRoom] = useState<{ code: string; host: boolean } | null>(null);
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Duelo en directo' }} />
      <OnlineGate>
        {room ? <Room code={room.code} host={room.host} onLeave={() => setRoom(null)} /> : <Menu onEnter={setRoom} />}
      </OnlineGate>
    </Screen>
  );
}

function Menu({ onEnter }: { onEnter: (r: { code: string; host: boolean }) => void }) {
  const c = useTheme();
  const [code, setCode] = useState('');
  return (
    <View style={{ gap: space.lg, marginTop: space.md }}>
      <Card style={{ gap: space.sm }}>
        <T variant="heading">Crear sala</T>
        <T muted>Te daremos un código para que tus amigos entren. Todos jugáis las mismas preguntas a la vez.</T>
        <Button title="Crear sala" onPress={() => onEnter({ code: randomCode(4), host: true })} />
      </Card>
      <Card style={{ gap: space.sm }}>
        <T variant="heading">Unirse a una sala</T>
        <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: space.md }}>
          <TextInput
            value={code}
            onChangeText={t => setCode(normalizeCode(t).slice(0, 4))}
            placeholder="Código de 4 letras"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[{ fontSize: 22, letterSpacing: 6, color: c.text, paddingVertical: 12, textAlign: 'center' }, noOutline]}
          />
        </View>
        <Button title="Entrar" disabled={code.length !== 4} onPress={() => onEnter({ code, host: false })} />
      </Card>
    </View>
  );
}

function Room({ code, host, onLeave }: { code: string; host: boolean; onLeave: () => void }) {
  const c = useTheme();
  const { profile } = useApp();
  const [hostCfg, setHostCfg] = useState<OnlineGameConfig>(DEFAULT_GAME);
  const me = useMemo(() => ({ id: profile.id, name: profile.name, host, version: DATA_VERSION }), [profile, host]);
  const room = useDuelRoom(code, me, host ? hostCfg : undefined);
  // Tied to the round, so a new game started from the results screen is played instead of skipped.
  const [finishedRound, setFinishedRound] = useState<number | null>(null);
  const finished = !!room.game && finishedRound === room.game.seed;
  const questions = useMemo(() => (room.game ? seededQuestions(room.game.cfg, room.game.seed) : []), [room.game]);
  const newGame = () => room.start({ cfg: hostCfg, seed: Math.floor(Math.random() * 2 ** 31) });

  // only players taking part in this game count for the ranking
  const inGame = room.game ? room.players.filter(p => p.round === room.game!.seed) : [];
  const sorted = [...inGame].sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
  const others = room.players.filter(p => p.id !== profile.id);
  const mismatch = room.players.some(p => p.version !== DATA_VERSION);

  if (room.status === 'connecting') return <ActivityIndicator style={{ marginTop: space.xl }} />;
  if (room.status === 'error') {
    return (
      <View style={{ gap: space.md, marginTop: space.lg }}>
        <T color={c.error}>No se pudo conectar con la sala. Comprueba tu conexión.</T>
        <Button title="Volver" onPress={onLeave} />
      </View>
    );
  }

  // --- Playing / results -----------------------------------------------------
  if (room.status === 'playing' && room.game) {
    if (!finished) {
      return (
        <View>
          <LiveStrip players={inGame.filter(p => p.id !== profile.id)} total={questions.length} />
          <OnlineQuiz
            cfg={room.game.cfg}
            questions={questions}
            onProgress={p => room.report({ score: p.score, answered: p.answered, timeMs: p.timeMs })}
            onFinish={r => {
              room.report({ score: r.score, answered: r.total, timeMs: r.timeMs, finished: true });
              setFinishedRound(room.game!.seed);
            }}
          />
        </View>
      );
    }
    const allDone = sorted.every(p => p.finished);
    return (
      <View style={{ gap: space.md, marginTop: space.md }}>
        <T variant="title" center>{allDone ? (sorted[0]?.id === profile.id ? '¡Has ganado!' : `Gana ${sorted[0]?.name}`) : 'Esperando al resto…'}</T>
        <Ranking players={sorted} total={questions.length} />
        {host && <Button title="Otra partida" onPress={newGame} />}
        <Button title="Volver a la sala" kind={host ? 'secondary' : 'primary'} onPress={room.backToLobby} />
        {!host && <T variant="caption" muted center>Si el anfitrión empieza otra partida, entrarás automáticamente.</T>}
      </View>
    );
  }

  // --- Lobby ------------------------------------------------------------------
  return (
    <View style={{ gap: space.md, marginTop: space.md }}>
      <Card style={{ alignItems: 'center', gap: space.xs }}>
        <T muted>Código de la sala</T>
        <T variant="big" style={{ letterSpacing: 8 }}>{code}</T>
        <Button
          title="Compartir código"
          kind="ghost"
          onPress={() => Share.share({ message: `¡Juega conmigo en GeoFlags! Entra en Online → Duelo en directo con el código ${code}` })}
        />
      </Card>

      <SectionTitle>Jugadores ({room.players.length})</SectionTitle>
      <Card style={{ gap: space.sm }}>
        {room.players.map(p => (
          <Row key={p.id} style={{ justifyContent: 'space-between' }}>
            <T>{p.name}{p.id === profile.id ? ' (tú)' : ''}</T>
            <T variant="caption" muted>{[p.host && 'Anfitrión', p.inLobby === false && 'viendo resultados'].filter(Boolean).join(' · ')}</T>
          </Row>
        ))}
      </Card>
      {mismatch && <T variant="caption" color={c.warning}>Alguien tiene otra versión de la app: actualizad todos para ver las mismas preguntas.</T>}

      {host ? (
        <>
          <GamePicker value={hostCfg} onChange={cfg => { setHostCfg(cfg); room.announce(cfg); }} />
          <Button
            title={others.length ? 'Empezar' : 'Empezar (aún estás solo)'}
            onPress={newGame}
            style={{ marginTop: space.md }}
          />
        </>
      ) : (
        <Card style={{ gap: 4 }}>
          <T variant="label">Partida</T>
          <T muted>{room.cfg ? describeGame(room.cfg) : 'Esperando al anfitrión…'}</T>
          <T variant="caption" muted>El anfitrión empezará la partida.</T>
        </Card>
      )}
      <Button title="Salir de la sala" kind="ghost" onPress={onLeave} />
    </View>
  );
}

function LiveStrip({ players, total }: { players: RoomPlayer[]; total: number }) {
  if (!players.length) return null;
  return (
    <Row wrap gap={space.md} style={{ paddingVertical: space.xs }}>
      {players.map(p => (
        <T key={p.id} variant="caption" muted>
          {p.name}: {p.score} pts ({p.answered}/{total}){p.finished ? ' ✓' : ''}
        </T>
      ))}
    </Row>
  );
}

function Ranking({ players, total }: { players: RoomPlayer[]; total: number }) {
  const c = useTheme();
  const { profile } = useApp();
  return (
    <Card style={{ gap: space.sm }}>
      {players.map((p, k) => (
        <Row key={p.id} gap={space.md}>
          <T variant="label" color={k === 0 ? c.accent : c.textSecondary} style={{ width: 24 }}>{k + 1}</T>
          <T style={{ flex: 1, fontWeight: p.id === profile.id ? '700' : '400' }}>{p.name}</T>
          <T variant="caption" muted>{p.finished ? `${p.answered}/${total}` : `jugando ${p.answered}/${total}`}</T>
          <T variant="label">{p.score}</T>
        </Row>
      ))}
    </Card>
  );
}
