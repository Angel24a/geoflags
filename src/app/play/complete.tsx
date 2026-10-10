import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Switch, useWindowDimensions, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { EntityInput, formatTime, GameBar, ResultView, useStopwatch } from '@/components/game';
import { Button, Card, Chip, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import {
  CATEGORY_LABEL, CONTINENT_LABEL, CONTINENT_ORDER, ENTITIES, SUBREGIONS, type Entity,
} from '@/data';
import { matchesName } from '@/lib/text';
import { useApp } from '@/state/app-state';
import { MAX_WIDTH, space, useTheme } from '@/theme';

interface Group {
  key: string;
  label: string;
  list: Entity[];
}

const isCountryLike = (e: Entity) => e.category === 'sovereign' || e.category === 'limited' || e.category === 'territory';

function buildGroups(withTerritories: boolean): { title: string; groups: Group[] }[] {
  const scope = (e: Entity) => (withTerritories ? isCountryLike(e) : e.category === 'sovereign');
  const continents = CONTINENT_ORDER.filter(c => c !== 'world' && c !== 'antarctica').map(c => ({
    key: `c:${c}`, label: CONTINENT_LABEL[c], list: ENTITIES.filter(e => e.continent === c && scope(e)),
  }));
  const subregions = SUBREGIONS.map(s => ({ key: `s:${s}`, label: s, list: ENTITIES.filter(e => e.subregion === s && scope(e)) }))
    .filter(g => g.list.length >= 3);
  const others = (['spain', 'historical', 'cultural', 'organization', 'limited'] as const).map(cat => ({
    key: `k:${cat}`, label: CATEGORY_LABEL[cat], list: ENTITIES.filter(e => e.category === cat),
  }));
  return [
    { title: 'Continentes', groups: continents },
    { title: 'Regiones', groups: subregions },
    { title: 'Otros', groups: [{ key: 'all', label: withTerritories ? 'Todo el mundo' : 'Todos los soberanos', list: ENTITIES.filter(scope) }, ...others] },
  ];
}

export default function Complete() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { submitRecord, recordAnswer } = useApp();
  const [withTerritories, setWithTerritories] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [gaveUp, setGaveUp] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState(false);

  const sections = useMemo(() => buildGroups(withTerritories), [withTerritories]);
  const done = !!group && (gaveUp || found.length === group.list.length);
  const seconds = useStopwatch(!!group && !done);

  const submit = (text: string) => {
    if (!group) return;
    const hit = group.list.find(e => !found.includes(e.id) && matchesName(text, e));
    if (hit) {
      const next = [...found, hit.id];
      setFound(next);
      setFlash(`✓ ${hit.name}`);
      recordAnswer(hit.id, true);
      if (next.length === group.list.length) setNewRecord(submitRecord(`complete:${group.key}:${withTerritories}`, seconds, true));
    } else {
      setFlash(group.list.some(e => matchesName(text, e)) ? 'Ya lo tienes' : `“${text}” no está`);
    }
  };

  const giveUp = () => {
    if (!group) return;
    setGaveUp(true);
    group.list.filter(e => !found.includes(e.id)).forEach(e => recordAnswer(e.id, false));
  };

  const restart = () => {
    setFound([]);
    setGaveUp(false);
    setFlash(null);
    setNewRecord(false);
  };

  if (!group) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Completa la región' }} />
        <T muted style={{ marginTop: space.sm }}>Escribe los nombres de todos los territorios del grupo. Puedes ver sus banderas como pista.</T>
        <Card style={{ marginTop: space.lg, gap: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T style={{ flex: 1 }}>Incluir territorios y no reconocidos</T>
            <Switch value={withTerritories} onValueChange={setWithTerritories} />
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <T style={{ flex: 1 }}>Mostrar banderas como pista</T>
            <Switch value={showFlags} onValueChange={setShowFlags} />
          </Row>
        </Card>
        {sections.map(s => (
          <View key={s.title}>
            <SectionTitle>{s.title}</SectionTitle>
            <Row wrap>
              {s.groups.map(g => (
                <Chip key={g.key} label={`${g.label} (${g.list.length})`} onPress={() => { restart(); setGroup(g); }} />
              ))}
            </Row>
          </View>
        ))}
      </Screen>
    );
  }

  const cols = 4;
  const cellW = (Math.min(width, MAX_WIDTH) - space.lg * 2 - space.sm * (cols - 1)) / cols;
  const sorted = [...group.list].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: group.label }} />
      <GameBar
        left={<T variant="heading">{found.length} / {group.list.length}</T>}
        right={<T variant="heading">{formatTime(seconds)}</T>}
      />
      <ProgressBar value={found.length / group.list.length} color={c.success} />

      {done ? (
        <ResultView
          title={gaveUp ? 'Te has rendido' : '¡Completado!'}
          score={`${found.length}/${group.list.length}`}
          detail={`Tiempo: ${formatTime(seconds)}`}
          newRecord={newRecord}
          onAgain={restart}
        />
      ) : (
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <EntityInput candidates={[]} showSuggestions={false} onSubmit={submit} placeholder="Escribe un nombre" />
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="caption" muted>{flash ?? ' '}</T>
            <Button title="Rendirse" kind="ghost" onPress={giveUp} />
          </Row>
        </View>
      )}

      <Row wrap gap={space.sm} style={{ marginTop: space.md }}>
        {sorted.map(e => {
          const ok = found.includes(e.id);
          const missed = done && !ok;
          return (
            <View key={e.id} style={{ width: cellW, alignItems: 'center', gap: 4, opacity: ok || missed || showFlags ? 1 : 0.6 }}>
              {showFlags || ok || missed ? (
                <Flag id={e.id} width={cellW - 8} height={(cellW - 8) * 0.66} />
              ) : (
                <View style={{ width: cellW - 8, height: (cellW - 8) * 0.66, borderRadius: 3, backgroundColor: c.surfaceAlt }} />
              )}
              <T variant="caption" numberOfLines={2} center color={ok ? c.success : missed ? c.error : c.textSecondary} style={{ fontSize: 11 }}>
                {ok || missed ? e.name : '· · ·'}
              </T>
            </View>
          );
        })}
      </Row>
    </Screen>
  );
}
