import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Flag } from '@/components/Flag';
import { WorldMap } from '@/components/WorldMap';
import { Button, Card, Chip, Row, Screen, Segmented, T } from '@/components/ui';
import { BY_ID, type Entity } from '@/data';
import { hasShape } from '@/lib/geo';
import { checkHomeland, nextPeople, peopleTargets } from '@/lib/peoples';
import { populationFact } from '@/lib/population';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

type Show = 'both' | 'flag';
const NO_DOTS: string[] = [];

export default function Peoples() {
  const c = useTheme();
  const { poolEntities, recordAnswer, submitRecord, records } = useApp();
  const targets = useMemo(() => peopleTargets(poolEntities), [poolEntities]);
  const [target, setTarget] = useState<Entity>(() => nextPeople(targets));
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState<Show>('both');
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ points: 0, rounds: 0 });

  const homeland = target.homeland ?? [];
  const result = checked ? checkHomeland(homeland, picked) : null;
  const name = (id: string) => BY_ID.get(id)?.name ?? id;

  const toggle = (id: string | null) => {
    if (checked || !id || !hasShape(id)) return;
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  };

  const check = () => {
    const r = checkHomeland(homeland, picked);
    setChecked(true);
    setScore(s => ({ points: s.points + r.points, rounds: s.rounds + 1 }));
    recordAnswer(target.id, r.perfect);
    const st = r.perfect ? streak + 1 : 0;
    setStreak(st);
    if (r.perfect) submitRecord('peoples:streak', st);
  };

  const next = () => {
    setTarget(nextPeople(targets, target.id));
    setPicked([]);
    setChecked(false);
  };

  const highlights = result
    ? [
        ...result.found.map(id => ({ id, color: c.success })),
        ...result.missed.map(id => ({ id, color: c.warning })),
        ...result.wrong.map(id => ({ id, color: c.error })),
      ]
    : picked.map(id => ({ id, color: c.accent }));
  const pop = populationFact(target);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Pueblos del mundo' }} />
      <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
        <T variant="caption" muted>Racha {streak} · Récord {records['peoples:streak'] ?? 0}</T>
        {score.rounds > 0 && <T variant="caption" muted>{score.points} pts en {score.rounds} rondas</T>}
      </Row>

      <Card style={{ marginTop: space.sm, alignItems: 'center', gap: space.sm }}>
        <Flag id={target.id} height={72} />
        {show === 'both' || checked ? <T variant="heading" center>{target.name}</T> : <T variant="heading" center>¿Qué pueblo es?</T>}
        <T muted center>
          {checked ? 'Vive principalmente en:' : `Toca en el mapa ${homeland.length === 1 ? 'el país' : `los ${homeland.length} países`} donde vive principalmente.`}
        </T>
        {checked && <T variant="label" center>{homeland.map(name).join(', ')}</T>}
      </Card>

      <View style={{ marginTop: space.md }}>
        {/* no dots for small territories: a tap picks the country under the finger */}
        <WorldMap height={280} highlights={highlights} onPick={id => toggle(id)} dotIds={NO_DOTS} />
      </View>

      {!checked && (
        <Row wrap gap={6} style={{ marginTop: space.sm, minHeight: 34 }}>
          {picked.length ? (
            picked.map(id => <Chip key={id} label={`${name(id)} ✕`} selected onPress={() => toggle(id)} />)
          ) : (
            <T variant="caption" muted>Aún no has marcado ningún país.</T>
          )}
        </Row>
      )}

      {result ? (
        <Card style={{ marginTop: space.md, gap: space.sm }}>
          <T variant="heading" color={result.perfect ? c.success : c.text}>
            {result.perfect ? '¡Perfecto!' : `${result.found.length} de ${homeland.length} países`}
          </T>
          {result.missed.length > 0 && <T variant="caption" color={c.warning}>Te faltó: {result.missed.map(name).join(', ')}</T>}
          {result.wrong.length > 0 && <T variant="caption" color={c.error}>No: {result.wrong.map(name).join(', ')}</T>}
          {target.language && <T><T variant="label">Lengua: </T>{target.language}</T>}
          {pop && <T><T variant="label">{pop.label}: </T>{pop.value}</T>}
          <Button title="Siguiente" onPress={next} style={{ marginTop: space.sm }} />
        </Card>
      ) : (
        <>
          <Row gap={space.sm} style={{ marginTop: space.md }}>
            <Button title="Borrar" kind="secondary" disabled={!picked.length} onPress={() => setPicked([])} style={{ flex: 1 }} />
            <Button title="Comprobar" disabled={!picked.length} onPress={check} style={{ flex: 2 }} />
          </Row>
          <View style={{ marginTop: space.lg, gap: 6 }}>
            <T variant="caption" muted>Mostrar</T>
            <Segmented
              options={[{ key: 'both', label: 'Bandera y nombre' }, { key: 'flag', label: 'Solo bandera (difícil)' }]}
              value={show}
              onChange={setShow}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
