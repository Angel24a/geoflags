import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { formatTime } from '@/components/game';
import { Card, Icon, ProgressBar, Row, Screen, SectionTitle, T } from '@/components/ui';
import { BY_ID, CATEGORY_ORDER, CATEGORY_SHORT, ENTITIES, LANGUAGE_BY_ID, LANGUAGES } from '@/data';
import { langKey } from '@/lib/languages';
import { groupRecords } from '@/lib/records';
import { MASTERY_LABEL, masteryLevel, useApp, type EntityStat } from '@/state/app-state';
import { space, useTheme } from '@/theme';

const errorRate = (s: EntityStat) => s.w / (s.c + s.w);
const weakestOf = (list: [string, EntityStat][]) =>
  list.filter(([, s]) => s.w > 0).sort((a, b) => errorRate(b[1]) - errorRate(a[1]) || b[1].w - a[1].w).slice(0, 6);

export default function Progress() {
  const c = useTheme();
  const { stats, records } = useApp();
  const LEVEL_COLOR = [c.border, c.warning, c.accent, c.success];

  const answered = Object.values(stats).reduce((a, s) => a + s.c + s.w, 0);
  const correct = Object.values(stats).reduce((a, s) => a + s.c, 0);
  const levels = (keys: string[]) => {
    const l = [0, 0, 0, 0];
    for (const k of keys) l[masteryLevel(stats[k])]++;
    return l;
  };
  const flagLevels = levels(ENTITIES.map(e => e.id));
  const langLevels = levels(LANGUAGES.map(l => langKey(l.id)));
  const entries = Object.entries(stats);
  const weakFlags = weakestOf(entries.filter(([id]) => BY_ID.has(id)));
  const weakLangs = weakestOf(entries.filter(([k]) => k.startsWith('lang:') && LANGUAGE_BY_ID.has(k.slice(5))));
  const groups = groupRecords(records);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', paddingTop: space.lg }}>
        <T variant="title">Progreso</T>
        <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 })}>
          <Icon name="settings" color={c.text} />
          <T variant="label">Ajustes</T>
        </Pressable>
      </Row>

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

      <SectionTitle>Banderas: dominas {flagLevels[3]} de {ENTITIES.length}</SectionTitle>
      <Card>
        <LevelBar levels={flagLevels} colors={LEVEL_COLOR} />
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

      <SectionTitle>Idiomas: dominas {langLevels[3]} de {LANGUAGES.length}</SectionTitle>
      <Card>
        <LevelBar levels={langLevels} colors={LEVEL_COLOR} />
      </Card>

      {(weakFlags.length > 0 || weakLangs.length > 0) && (
        <>
          <SectionTitle>Para repasar</SectionTitle>
          <Card style={{ gap: space.md }}>
            {weakFlags.map(([id, s]) => (
              <Pressable key={id} onPress={() => router.push({ pathname: '/glossary/[id]', params: { id } })}>
                <Row gap={space.md}>
                  <Flag id={id} height={24} normalized />
                  <T style={{ flex: 1 }} numberOfLines={1}>{BY_ID.get(id)!.name}</T>
                  <T variant="caption" muted>{s.w} {s.w === 1 ? 'fallo' : 'fallos'}</T>
                </Row>
              </Pressable>
            ))}
            {weakLangs.map(([k, s]) => {
              const l = LANGUAGE_BY_ID.get(k.slice(5))!;
              return (
                <Pressable key={k} onPress={() => router.push({ pathname: '/language/[id]', params: { id: l.id } })}>
                  <Row gap={space.md}>
                    <View style={{ width: 36, alignItems: 'center' }}><Icon name="language" size={20} color={c.accent} /></View>
                    <T style={{ flex: 1 }} numberOfLines={1}>{l.name}</T>
                    <T variant="caption" muted>{s.w} {s.w === 1 ? 'fallo' : 'fallos'}</T>
                  </Row>
                </Pressable>
              );
            })}
          </Card>
        </>
      )}

      {groups.map(g => (
        <View key={g.title}>
          <SectionTitle>Récords · {g.title}</SectionTitle>
          <Card style={{ gap: space.sm }}>
            {g.rows.map(r => (
              <Row key={r.key} style={{ justifyContent: 'space-between' }}>
                <T style={{ flex: 1 }}>{r.label}</T>
                <T variant="label">{r.time ? formatTime(r.value) : r.value}</T>
              </Row>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function LevelBar({ levels, colors }: { levels: number[]; colors: string[] }) {
  return (
    <>
      <Row gap={2} style={{ height: 10, borderRadius: 5, overflow: 'hidden' }}>
        {levels.map((n, i) => (n ? <View key={i} style={{ flex: n, height: '100%', backgroundColor: colors[i] }} /> : null))}
      </Row>
      <Row wrap gap={space.md} style={{ marginTop: space.md }}>
        {levels.map((n, i) => (
          <Row key={i} gap={6}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors[i] }} />
            <T variant="caption">{MASTERY_LABEL[i]}: {n}</T>
          </Row>
        ))}
      </Row>
    </>
  );
}
