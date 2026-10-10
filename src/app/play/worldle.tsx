import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Flag } from '@/components/Flag';
import { ShapeView } from '@/components/ShapeView';
import { EntityInput, GameBar } from '@/components/game';
import { Button, Card, Row, Screen, T } from '@/components/ui';
import { ENTITIES, type Entity } from '@/data';
import { bearing, compass, distanceKm, locate, proximity } from '@/lib/geo';
import { pick } from '@/lib/random';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

const MAX_GUESSES = 6;

interface Guess {
  e: Entity;
  km: number;
  deg: number;
  pct: number;
}

function Arrow({ deg, color }: { deg: number; color: string }) {
  return (
    <View style={{ transform: [{ rotate: `${deg}deg` }] }}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M12 3l6 9h-4v9h-4v-9H6z" fill={color} />
      </Svg>
    </View>
  );
}

export default function Worldle() {
  const c = useTheme();
  const { poolEntities, recordAnswer, submitRecord, records } = useApp();
  const targets = useMemo(() => {
    const inPool = poolEntities.filter(e => e.geo === 'shape' && locate(e.id));
    return inPool.length ? inPool : ENTITIES.filter(e => e.base && e.geo === 'shape');
  }, [poolEntities]);
  // any territory with a location can be guessed
  const guessable = useMemo(() => ENTITIES.filter(e => e.geo && locate(e.id)), []);

  const [target, setTarget] = useState<Entity>(() => pick(targets));
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const won = guesses.some(g => g.e.id === target.id);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const over = won || lost;

  const guess = (text: string, picked?: Entity) => {
    const e = picked ?? guessable.find(x => x.name.toLowerCase() === text.trim().toLowerCase());
    if (!e) return setMessage('Elige un nombre de la lista');
    if (guesses.some(g => g.e.id === e.id)) return setMessage('Ya lo has probado');
    setMessage(null);
    const a = locate(e.id)!;
    const b = locate(target.id)!;
    const km = e.id === target.id ? 0 : distanceKm(a, b);
    const g: Guess = { e, km, deg: bearing(a, b), pct: e.id === target.id ? 100 : proximity(km) };
    const next = [...guesses, g];
    setGuesses(next);
    const isWin = e.id === target.id;
    if (isWin || next.length >= MAX_GUESSES) {
      recordAnswer(target.id, isWin);
      const s = isWin ? streak + 1 : 0;
      setStreak(s);
      if (isWin) submitRecord('worldle:streak', s);
    }
  };

  const nextRound = () => {
    setTarget(pick(targets.filter(t => t.id !== target.id)) ?? pick(targets));
    setGuesses([]);
    setMessage(null);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Worldle' }} />
      <GameBar
        left={<T variant="label" muted>Intento {Math.min(guesses.length + (over ? 0 : 1), MAX_GUESSES)} / {MAX_GUESSES}</T>}
        right={<T variant="label" muted>Racha {streak} · Récord {records['worldle:streak'] ?? 0}</T>}
      />
      <Card style={{ alignItems: 'center', marginTop: space.sm }}>
        <ShapeView id={target.id} size={200} />
      </Card>

      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {guesses.map(g => (
          <Row key={g.e.id} gap={space.sm} style={{ backgroundColor: c.surface, borderRadius: 10, padding: space.md, borderWidth: 1, borderColor: g.km === 0 ? c.success : c.border }}>
            <T style={{ flex: 1 }} numberOfLines={1}>{g.e.name}</T>
            <T variant="label">{g.km === 0 ? '🎯' : `${Math.round(g.km).toLocaleString('es-ES')} km`}</T>
            {g.km > 0 ? <Arrow deg={g.deg} color={c.accent} /> : null}
            <T variant="caption" muted style={{ width: 54, textAlign: 'right' }}>{g.km > 0 ? `${compass(g.deg)} ${g.pct}%` : '100%'}</T>
          </Row>
        ))}
      </View>

      {!over && (
        <View style={{ marginTop: space.md }}>
          <EntityInput candidates={guessable} onSubmit={guess} placeholder="¿Qué país o territorio es?" />
          {message && <T variant="caption" color={c.error} style={{ marginTop: 4 }}>{message}</T>}
        </View>
      )}

      {over && (
        <Card style={{ marginTop: space.lg, alignItems: 'center', gap: space.sm }}>
          <T variant="heading" color={won ? c.success : c.error}>{won ? `¡Acertaste en ${guesses.length}!` : 'Era…'}</T>
          <Flag id={target.id} height={80} />
          <T variant="title">{target.name}</T>
          <Button title="Siguiente" onPress={nextRound} style={{ alignSelf: 'stretch' }} />
        </Card>
      )}
    </Screen>
  );
}
