import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Flag } from '@/components/Flag';
import { EntityInput, GameBar } from '@/components/game';
import { WorldMap } from '@/components/WorldMap';
import { Button, Card, Chip, Row, Screen, T } from '@/components/ui';
import { BY_ID, ENTITIES, type Entity } from '@/data';
import { areNeighbors, graph, makeChain, type ChainPuzzle } from '@/lib/chain';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

export default function Chain() {
  const c = useTheme();
  const { poolEntities, recordAnswer, submitRecord, settings } = useApp();
  const [puzzle, setPuzzle] = useState<ChainPuzzle | null>(() => makeChain(poolEntities));
  const [path, setPath] = useState<string[]>(() => (puzzle ? [puzzle.start.id] : []));
  const [message, setMessage] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const candidates = useMemo(() => ENTITIES.filter(e => graph().has(e.id)), []);

  if (!puzzle) {
    return <Screen edges={[]}><T muted center style={{ marginTop: space.xl }}>No hay países con fronteras en tu selección.</T></Screen>;
  }

  const current = path[path.length - 1];
  const won = current === puzzle.target.id;
  // count the countries the player has to name (everything between start and destination)
  const steps = path.filter(id => id !== puzzle.start.id && id !== puzzle.target.id).length;
  const optimal = puzzle.optimal.length - 2;

  const submit = (text: string, picked?: Entity) => {
    const e = picked ?? candidates.find(x => x.name.toLowerCase() === text.trim().toLowerCase());
    if (!e) return setMessage('Elige un nombre de la lista');
    if (!areNeighbors(current, e.id)) return setMessage(`${e.name} no limita con ${BY_ID.get(current)!.name}`);
    setMessage(null);
    setHint(false);
    // Reaching a neighbour of the destination completes the chain: the last hop is automatic.
    const next = e.id !== puzzle.target.id && areNeighbors(e.id, puzzle.target.id) ? [...path, e.id, puzzle.target.id] : [...path, e.id];
    setPath(next);
    if (next[next.length - 1] === puzzle.target.id) {
      recordAnswer(puzzle.target.id, true);
      submitRecord(`chain:${JSON.stringify(settings.pool)}`, Math.max(0, 10 - (next.length - 2 - optimal)));
    }
  };

  const undo = () => path.length > 1 && setPath(path.slice(0, -1));

  const newPuzzle = () => {
    const p = makeChain(poolEntities);
    setPuzzle(p);
    setPath(p ? [p.start.id] : []);
    setMessage(null);
    setHint(false);
    setGaveUp(false);
  };

  const shown = gaveUp ? puzzle.optimal : path;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Cadena de vecinos' }} />
      <GameBar left={<T variant="label" muted>Países: {steps}</T>} right={<T variant="label" muted>Mínimo posible: {optimal}</T>} />

      <Row gap={space.md} style={{ marginTop: space.sm }}>
        <Card style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <T variant="caption" muted>Desde</T>
          <Flag id={puzzle.start.id} height={44} />
          <T variant="label" center>{puzzle.start.name}</T>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <T variant="caption" muted>Hasta</T>
          <Flag id={puzzle.target.id} height={44} />
          <T variant="label" center>{puzzle.target.name}</T>
        </Card>
      </Row>

      <View style={{ marginTop: space.md }}>
        <WorldMap
          height={240}
          focus={[puzzle.start.id, puzzle.target.id, ...puzzle.optimal]}
          highlights={[
            ...shown.map(id => ({ id, color: c.accent })),
            { id: puzzle.start.id, color: c.warning },
            { id: puzzle.target.id, color: c.success },
          ]}
        />
      </View>

      <Row wrap gap={6} style={{ marginTop: space.md }}>
        {shown.map((id, k) => (
          <Chip key={`${id}-${k}`} label={`${k}. ${BY_ID.get(id)!.name}`} selected={k === shown.length - 1} />
        ))}
      </Row>

      {won || gaveUp ? (
        <Card style={{ marginTop: space.lg, gap: space.sm }}>
          <T variant="heading" color={won ? c.success : c.text}>
            {won ? (steps === optimal ? '¡Perfecto! Camino más corto' : `¡Lo lograste con ${steps} países!`) : 'Un camino más corto'}
          </T>
          {won && steps > optimal && <T muted>El camino más corto necesitaba {optimal}: {puzzle.optimal.map(id => BY_ID.get(id)!.name).join(' → ')}</T>}
          <Button title="Otra cadena" onPress={newPuzzle} />
        </Card>
      ) : (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <T variant="caption" muted>Escribe un país que limite con {BY_ID.get(current)!.name}. Cuando llegues a un vecino de {puzzle.target.name}, la cadena se completa sola.</T>
          <EntityInput candidates={candidates} onSubmit={submit} placeholder="País vecino" />
          {message && <T variant="caption" color={c.error}>{message}</T>}
          {hint && (
            <T variant="caption" muted>
              Vecinos: {[...(graph().get(current) ?? [])].map(id => BY_ID.get(id)!.name).sort((a, b) => a.localeCompare(b, 'es')).join(', ')}
            </T>
          )}
          <Row gap={space.sm}>
            <Button title="Deshacer" kind="secondary" onPress={undo} disabled={path.length <= 1} style={{ flex: 1 }} />
            <Button title="Pista" kind="secondary" onPress={() => setHint(true)} style={{ flex: 1 }} />
            <Button title="Rendirse" kind="ghost" onPress={() => setGaveUp(true)} style={{ flex: 1 }} />
          </Row>
        </View>
      )}
    </Screen>
  );
}
