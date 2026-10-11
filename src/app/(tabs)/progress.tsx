import { router } from 'expo-router';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { UpdateCard } from '@/components/UpdateCard';
import { formatTime } from '@/components/game';
import { Button, Card, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import { BY_ID, CATEGORY_ORDER, CATEGORY_SHORT, ENTITIES } from '@/data';
import { MASTERY_LABEL, masteryLevel, useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

const RECORD_LABELS: Record<string, string> = {
  survival: 'Supervivencia',
  timed: 'Contrarreloj',
  streak: 'Racha',
  classic: 'Clásico (% acierto)',
  reveal: 'Pixelada / zoom',
  build: 'Construye la bandera',
  spot: 'Encuentra el error',
  worldle: 'Worldle',
  chain: 'Cadena de vecinos',
  sort: 'Ordenar',
  peoples: 'Pueblos del mundo (racha)',
  complete: 'Completa la región (mejor tiempo)',
};

export default function Progress() {
  const c = useTheme();
  const { stats, records, settings, updateSettings, resetProgress } = useApp();

  const answered = Object.values(stats).reduce((a, s) => a + s.c + s.w, 0);
  const correct = Object.values(stats).reduce((a, s) => a + s.c, 0);
  const levels = [0, 0, 0, 0];
  for (const e of ENTITIES) levels[masteryLevel(stats[e.id])]++;
  const LEVEL_COLOR = [c.border, c.warning, c.accent, c.success];

  const weakest = Object.entries(stats)
    .filter(([id, s]) => s.w > 0 && BY_ID.has(id))
    .sort((a, b) => b[1].w / (b[1].c + b[1].w) - a[1].w / (a[1].c + a[1].w) || b[1].w - a[1].w)
    .slice(0, 8);

  // "complete" stores times (lower is better); the rest store scores
  const bestByMode = Object.entries(records).reduce<Record<string, number>>((acc, [k, v]) => {
    const mode = k.split(':')[0];
    acc[mode] = mode === 'complete' ? Math.min(acc[mode] ?? Infinity, v) : Math.max(acc[mode] ?? 0, v);
    return acc;
  }, {});

  const confirmReset = () => {
    const run = () => resetProgress();
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('¿Borrar todo el progreso?')) run();
    } else {
      Alert.alert('Borrar progreso', '¿Seguro que quieres borrar todas las estadísticas y récords?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: run },
      ]);
    }
  };

  return (
    <Screen>
      <T variant="title" style={{ paddingTop: space.lg }}>Progreso</T>

      <Row gap={space.sm} style={{ marginTop: space.lg }}>
        <Card style={{ flex: 1 }}>
          <T variant="caption" muted>Respuestas</T>
          <T variant="title">{answered}</T>
        </Card>
        <Card style={{ flex: 1 }}>
          <T variant="caption" muted>Acierto</T>
          <T variant="title">{answered ? Math.round((100 * correct) / answered) : 0}%</T>
        </Card>
      </Row>

      <SectionTitle>Dominio de las {ENTITIES.length} banderas</SectionTitle>
      <Card>
        <Row gap={2} style={{ height: 10, borderRadius: 5, overflow: 'hidden' }}>
          {levels.map((n, i) => (n ? <View key={i} style={{ flex: n, height: '100%', backgroundColor: LEVEL_COLOR[i] }} /> : null))}
        </Row>
        <Row wrap gap={space.md} style={{ marginTop: space.md }}>
          {levels.map((n, i) => (
            <Row key={i} gap={6}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: LEVEL_COLOR[i] }} />
              <T variant="caption">{MASTERY_LABEL[i]}: {n}</T>
            </Row>
          ))}
        </Row>
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {CATEGORY_ORDER.map(cat => {
            const list = ENTITIES.filter(e => e.category === cat);
            const known = list.filter(e => masteryLevel(stats[e.id]) >= 2).length;
            return (
              <View key={cat}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="caption">{CATEGORY_SHORT[cat]}</T>
                  <T variant="caption" muted>{known}/{list.length}</T>
                </Row>
                <ProgressBar value={known / list.length} color={c.success} />
              </View>
            );
          })}
        </View>
      </Card>

      {weakest.length > 0 && (
        <>
          <SectionTitle>Para repasar</SectionTitle>
          <Card style={{ gap: space.md }}>
            {weakest.map(([id, s]) => (
              <Pressable key={id} onPress={() => router.push({ pathname: '/glossary/[id]', params: { id } })}>
                <Row gap={space.md}>
                  <Flag id={id} height={24} normalized />
                  <T style={{ flex: 1 }} numberOfLines={1}>{BY_ID.get(id)!.name}</T>
                  <T variant="caption" muted>{s.w} fallos</T>
                </Row>
              </Pressable>
            ))}
          </Card>
        </>
      )}

      {Object.keys(bestByMode).length > 0 && (
        <>
          <SectionTitle>Récords</SectionTitle>
          <Card style={{ gap: space.sm }}>
            {Object.entries(bestByMode).map(([mode, v]) => (
              <Row key={mode} style={{ justifyContent: 'space-between' }}>
                <T>{RECORD_LABELS[mode] ?? mode}</T>
                <T variant="label">{mode === 'complete' ? formatTime(v) : v}</T>
              </Row>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Ajustes</SectionTitle>
      <Card style={{ gap: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T>Proporción real de las banderas</T>
            <T variant="caption" muted>Si se desactiva, todas se muestran en 3:2</T>
          </View>
          <Switch value={settings.realRatio} onValueChange={v => updateSettings({ realRatio: v })} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T>Opciones parecidas</T>
            <T variant="caption" muted>Las respuestas incorrectas se parecen a la correcta</T>
          </View>
          <Switch value={settings.similarOptions} onValueChange={v => updateSettings({ similarOptions: v })} />
        </Row>
      </Card>
      <View style={{ marginTop: space.md }}>
        <UpdateCard />
      </View>
      <Button title="Borrar progreso" kind="ghost" onPress={confirmReset} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
