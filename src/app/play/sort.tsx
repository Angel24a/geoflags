import { Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { Button, Card, Chip, Row, Screen, Segmented, T } from '@/components/ui';
import type { Entity } from '@/data';
import {
  correctOrder, criterion, CRITERIA, DEFAULT_SORT, pickSortItems, positionsOk, randomCriterion, SORT_COUNTS,
  type SortCriterion, type SortOptions,
} from '@/lib/sort';
import { useApp } from '@/state/app-state';
import { radius, space, useTheme } from '@/theme';

interface Round {
  crit: SortCriterion;
  items: Entity[];
}

export default function Sort() {
  const c = useTheme();
  const { poolEntities, submitRecord, records, settings, updateSettings } = useApp();
  const opts: SortOptions = { ...DEFAULT_SORT, ...settings.sort };
  const [showOptions, setShowOptions] = useState(false);

  const makeRound = (o: SortOptions, prev?: SortCriterion): Round => {
    const crit = o.criterion === 'random' ? randomCriterion(Math.random, prev) : o.criterion;
    return { crit, items: pickSortItems(poolEntities, criterion(crit).get, o.count, o.difficulty) };
  };

  const [round, setRound] = useState<Round>(() => makeRound(opts));
  const [order, setOrder] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ points: 0, rounds: 0, perfect: 0 });

  const def = criterion(round.crit);
  const count = round.items.length;
  const reverse = opts.reverse;
  const correct = correctOrder(round.items, def.get, reverse);
  const ok = checked ? positionsOk(order, round.items, def.get, reverse) : [];
  const hits = ok.filter(Boolean).length;

  const newRound = (o: SortOptions = opts) => {
    setRound(makeRound(o, round.crit));
    setOrder([]);
    setChecked(false);
  };

  const setOption = (patch: Partial<SortOptions>) => {
    const o = { ...opts, ...patch };
    updateSettings({ sort: o });
    // the direction only changes the question, the same items can stay
    if (Object.keys(patch).some(k => k !== 'reverse')) newRound(o);
    else if (checked) newRound(o);
  };

  const tap = (id: string) => {
    if (checked) return;
    setOrder(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  };

  const check = () => {
    setChecked(true);
    const h = positionsOk(order, round.items, def.get, reverse).filter(Boolean).length;
    const perfect = h === count;
    setScore(s => ({ points: s.points + h, rounds: s.rounds + 1, perfect: s.perfect + (perfect ? 1 : 0) }));
    if (perfect) submitRecord(`sort:${round.crit}`, (records[`sort:${round.crit}`] ?? 0) + 1);
  };

  // after checking, show the right order with the player's mistakes
  const list = checked ? correct.map(id => round.items.find(e => e.id === id)!) : round.items;
  const showFlag = opts.show !== 'name';
  const showName = opts.show !== 'flag' || checked;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Ordenar' }} />

      <Card style={{ marginTop: space.sm, gap: space.sm }} onPress={showOptions ? undefined : () => setShowOptions(true)}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="label">{opts.criterion === 'random' ? `Aleatorio: ${def.label}` : def.label}</T>
          <Pressable onPress={() => setShowOptions(v => !v)} hitSlop={8}>
            <T variant="caption" color={c.accent}>{showOptions ? 'Cerrar' : 'Opciones'}</T>
          </Pressable>
        </Row>
        {!showOptions && (
          <T variant="caption" muted>
            {opts.count} elementos · {DIFFICULTY.find(d => d.key === opts.difficulty)!.label}
            {opts.show !== 'both' ? ` · ${SHOW.find(d => d.key === opts.show)!.label}` : ''}
            {reverse ? ' · Orden invertido' : ''}
          </T>
        )}
        {showOptions && (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 6 }}>
              <T variant="caption" muted>Ordenar por</T>
              <Row wrap gap={6}>
                {CRITERIA.map(x => (
                  <Chip key={x.key} label={x.label} selected={opts.criterion === x.key} onPress={() => setOption({ criterion: x.key })} />
                ))}
                <Chip label="Aleatorio" selected={opts.criterion === 'random'} onPress={() => setOption({ criterion: 'random' })} />
              </Row>
            </View>
            <Option label="Cuántos">
              <Segmented options={SORT_COUNTS.map(n => ({ key: String(n), label: String(n) }))} value={String(opts.count)} onChange={k => setOption({ count: Number(k) })} />
            </Option>
            <Option label="Dificultad">
              <Segmented options={DIFFICULTY} value={opts.difficulty} onChange={k => setOption({ difficulty: k })} />
              <T variant="caption" muted>{DIFFICULTY.find(d => d.key === opts.difficulty)!.help}</T>
            </Option>
            <Option label="Mostrar">
              <Segmented options={SHOW} value={opts.show} onChange={k => setOption({ show: k })} />
            </Option>
            <Option label="Sentido">
              <Segmented
                options={[{ key: 'normal', label: 'Normal' }, { key: 'reverse', label: 'Invertido' }]}
                value={reverse ? 'reverse' : 'normal'}
                onChange={k => setOption({ reverse: k === 'reverse' })}
              />
            </Option>
          </View>
        )}
      </Card>

      <T variant="heading" style={{ marginTop: space.md }}>{reverse ? def.reversed : def.order}</T>
      <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
        <T variant="caption" muted style={{ flex: 1 }}>Toca en orden; otra vez para quitarlo.</T>
        {score.rounds > 0 && <T variant="caption" muted>Perfectas {score.perfect}/{score.rounds} · {score.points} pts</T>}
      </Row>

      <View style={{ gap: count > 7 ? 6 : space.sm, marginTop: space.md }}>
        {list.map((e, k) => {
          const pos = order.indexOf(e.id);
          // after checking, the row is the k-th correct item; was the player's choice for its position right?
          const placedRight = checked && pos >= 0 && ok[pos];
          const value = def.fmt(def.get(e)!);
          return (
            <Pressable
              key={e.id}
              onPress={() => tap(e.id)}
              style={({ pressed }) => [{
                flexDirection: 'row', alignItems: 'center', gap: space.md,
                padding: count > 7 ? space.sm : space.md, borderRadius: radius.md,
                backgroundColor: c.surface, borderWidth: checked ? 2 : 1,
                borderColor: checked ? (placedRight ? c.success : c.error) : pos >= 0 ? c.accent : c.border,
                opacity: pressed ? 0.7 : 1,
              }]}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: pos >= 0 || checked ? c.accent : c.surfaceAlt }}>
                <T variant="label" color={pos >= 0 || checked ? c.onAccent : c.textSecondary}>{checked ? k + 1 : pos >= 0 ? pos + 1 : '·'}</T>
              </View>
              {showFlag && <Flag id={e.id} height={opts.show === 'flag' ? 36 : 28} real={round.crit === 'ratio'} normalized={round.crit !== 'ratio'} />}
              <View style={{ flex: 1 }}>
                {showName && <T numberOfLines={1}>{e.name}</T>}
                {checked && (
                  <T variant="caption" muted>
                    {[value, !placedRight && pos >= 0 ? `lo pusiste ${pos + 1}.º` : ''].filter(Boolean).join(' · ')}
                  </T>
                )}
              </View>
              {checked && <T>{placedRight ? '✓' : '✗'}</T>}
            </Pressable>
          );
        })}
      </View>

      {checked ? (
        <>
          <T variant="heading" center style={{ marginTop: space.lg }} color={hits === count ? c.success : c.text}>
            {hits === count ? '¡Orden perfecto!' : `${hits} de ${count} en su sitio`}
          </T>
          <Button title="Siguiente" onPress={() => newRound()} style={{ marginTop: space.md }} />
        </>
      ) : (
        <Row gap={space.sm} style={{ marginTop: space.lg }}>
          <Button title="Borrar" kind="secondary" disabled={!order.length} onPress={() => setOrder([])} style={{ flex: 1 }} />
          <Button title="Comprobar" disabled={order.length < count} onPress={check} style={{ flex: 2 }} />
        </Row>
      )}
    </Screen>
  );
}

const DIFFICULTY = [
  { key: 'easy' as const, label: 'Fácil', help: 'Valores muy distintos entre sí.' },
  { key: 'normal' as const, label: 'Normal', help: 'Elementos al azar.' },
  { key: 'hard' as const, label: 'Difícil', help: 'Valores parecidos: hay que afinar.' },
];

const SHOW = [
  { key: 'both' as const, label: 'Bandera y nombre' },
  { key: 'flag' as const, label: 'Solo bandera' },
  { key: 'name' as const, label: 'Solo nombre' },
];

function Option({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <T variant="caption" muted>{label}</T>
      {children}
    </View>
  );
}
