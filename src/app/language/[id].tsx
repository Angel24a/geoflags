import { router, Stack, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { Card, Chip, Row, Screen, SectionTitle, T } from '@/components/ui';
import { BY_ID, LANGUAGE_BY_ID, LANGUAGES } from '@/data';
import { formatSpeakers, langKey } from '@/lib/languages';
import { MASTERY_LABEL, masteryLevel, useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ paddingVertical: space.sm }}>
      <T variant="caption" muted>{label}</T>
      <T>{children}</T>
    </View>
  );
}

export default function LanguageDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stats } = useApp();
  const l = LANGUAGE_BY_ID.get(id ?? '');
  if (!l) return <Screen><T>No encontrado</T></Screen>;

  const relatives = LANGUAGES.filter(x => x.id !== l.id && x.family === l.family && (x.branch ?? '') === (l.branch ?? '')).slice(0, 10);
  const go = (path: '/glossary/[id]' | '/language/[id]', other: string) => router.push({ pathname: path, params: { id: other } });

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: l.name }} />
      <T variant="title" style={{ marginTop: space.md }}>{l.name}</T>
      <T muted style={{ fontSize: 20 }}>{l.native}</T>
      <Row wrap gap={6} style={{ marginTop: space.sm }}>
        <Chip label={l.family} />
        {l.branch && <Chip label={l.branch} />}
        <Chip label={`Escritura: ${l.script}`} />
      </Row>

      <SectionTitle>Frases</SectionTitle>
      <Card style={{ gap: space.md }}>
        {l.phrases.map(([text, es]) => (
          <View key={text}>
            <T style={{ fontSize: 18, fontWeight: '500' }}>{text}</T>
            <T variant="caption" muted>{es}</T>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: space.lg }}>
        <Fact label="Hablantes nativos (aprox.)">{formatSpeakers(l.speakers)}</Fact>
        {l.aliases?.length ? <Fact label="También llamado">{l.aliases.join(', ')}</Fact> : null}
        {l.note && <Fact label="Nota">{l.note}</Fact>}
        <Fact label="Tu nivel">{MASTERY_LABEL[masteryLevel(stats[langKey(l.id)])]}</Fact>
      </Card>

      <SectionTitle>Dónde se habla</SectionTitle>
      <View style={{ gap: space.sm }}>
        {l.countries.map(cid => {
          const e = BY_ID.get(cid)!;
          return (
            <Pressable key={cid} onPress={() => go('/glossary/[id]', cid)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Row gap={space.md}>
                <Flag id={cid} height={24} normalized />
                <T style={{ flex: 1 }}>{e.name}</T>
                <T variant="caption" color={c.accent}>›</T>
              </Row>
            </Pressable>
          );
        })}
      </View>

      {relatives.length > 0 && (
        <>
          <SectionTitle>Lenguas emparentadas</SectionTitle>
          <Row wrap gap={6}>
            {relatives.map(r => <Chip key={r.id} label={r.name} onPress={() => go('/language/[id]', r.id)} />)}
          </Row>
        </>
      )}
    </Screen>
  );
}
