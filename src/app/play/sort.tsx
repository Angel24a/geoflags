import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { GameBar } from '@/components/game';
import { Button, Chip, Row, Screen, T } from '@/components/ui';
import type { Entity } from '@/data';
import { pickSortable, SORT_COUNT as COUNT } from '@/lib/games';
import { useApp } from '@/state/app-state';
import { radius, space, useTheme } from '@/theme';

type Criterion = 'population' | 'area' | 'lat' | 'lng';

const CRITERIA: { key: Criterion; label: string; order: string; get: (e: Entity) => number | undefined; fmt: (v: number) => string }[] = [
  { key: 'population', label: 'Población', order: 'De más a menos habitantes', get: e => e.population, fmt: v => `${(v / 1e6).toLocaleString('es-ES', { maximumFractionDigits: v < 1e6 ? 2 : 1 })} M hab.` },
  { key: 'area', label: 'Superficie', order: 'De mayor a menor superficie', get: e => e.area, fmt: v => `${Math.round(v).toLocaleString('es-ES')} km²` },
  { key: 'lat', label: 'Latitud', order: 'De más al norte a más al sur', get: e => e.latlng?.[0], fmt: v => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? 'N' : 'S'}` },
  { key: 'lng', label: 'Longitud', order: 'De más al oeste a más al este', get: e => (e.latlng ? -e.latlng[1] : undefined), fmt: v => `${Math.abs(v).toFixed(1)}° ${-v >= 0 ? 'E' : 'O'}` },
];


export default function Sort() {
  const c = useTheme();
  const { poolEntities, submitRecord, records } = useApp();
  const [crit, setCrit] = useState<Criterion>('population');
  const def = CRITERIA.find(x => x.key === crit)!;
  const [items, setItems] = useState<Entity[]>(() => pickSortable(poolEntities, def.get));
  const [order, setOrder] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [total, setTotal] = useState(0);

  const correctOrder = [...items].sort((a, b) => def.get(b)! - def.get(a)!).map(e => e.id);
  const hits = checked ? order.filter((id, k) => correctOrder[k] === id).length : 0;

  const newRound = (k: Criterion = crit) => {
    const d = CRITERIA.find(x => x.key === k)!;
    setItems(pickSortable(poolEntities, d.get));
    setOrder([]);
    setChecked(false);
  };

  const tap = (id: string) => {
    if (checked) return;
    setOrder(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  };

  const check = () => {
    setChecked(true);
    const h = order.filter((id, k) => correctOrder[k] === id).length;
    const t = total + h;
    setTotal(t);
    if (h === COUNT) submitRecord(`sort:${crit}`, (records[`sort:${crit}`] ?? 0) + 1);
  };

  const list = checked ? correctOrder.map(id => items.find(e => e.id === id)!) : items;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Ordenar' }} />
      <Row wrap gap={6} style={{ marginTop: space.sm }}>
        {CRITERIA.map(x => (
          <Chip key={x.key} label={x.label} selected={crit === x.key} onPress={() => { setCrit(x.key); newRound(x.key); }} />
        ))}
      </Row>
      <GameBar left={<T variant="label">{def.order}</T>} right={<T variant="caption" muted>Puntos: {total}</T>} />
      <T variant="caption" muted>Toca los elementos en orden. Toca otra vez para quitarlo.</T>

      <View style={{ gap: space.sm, marginTop: space.md }}>
        {list.map((e, k) => {
          const pos = order.indexOf(e.id);
          const ok = checked && order[k] === e.id;
          const userPos = order.indexOf(e.id);
          return (
            <Pressable
              key={e.id}
              onPress={() => tap(e.id)}
              style={({ pressed }) => [{
                flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md,
                backgroundColor: c.surface, borderWidth: checked ? 2 : 1,
                borderColor: checked ? (correctOrder[userPos] === e.id ? c.success : c.error) : pos >= 0 ? c.accent : c.border,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: pos >= 0 || checked ? c.accent : c.surfaceAlt }}>
                <T variant="label" color={pos >= 0 || checked ? '#fff' : c.textSecondary}>{checked ? k + 1 : pos >= 0 ? pos + 1 : '·'}</T>
              </View>
              <Flag id={e.id} height={28} normalized />
              <View style={{ flex: 1 }}>
                <T numberOfLines={1}>{e.name}</T>
                {checked && <T variant="caption" muted>{def.fmt(def.get(e)!)}{userPos !== k ? ` · lo pusiste ${userPos + 1}.º` : ''}</T>}
              </View>
              {checked && <T>{ok || correctOrder[userPos] === e.id ? '✓' : '✗'}</T>}
            </Pressable>
          );
        })}
      </View>

      {checked ? (
        <>
          <T variant="heading" center style={{ marginTop: space.lg }} color={hits === COUNT ? c.success : c.text}>
            {hits === COUNT ? '¡Orden perfecto!' : `${hits} de ${COUNT} en su sitio`}
          </T>
          <Button title="Siguiente" onPress={() => newRound()} style={{ marginTop: space.md }} />
        </>
      ) : (
        <Button title="Comprobar" disabled={order.length < COUNT} onPress={check} style={{ marginTop: space.lg }} />
      )}
    </Screen>
  );
}
