import { router, Stack, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { ShapeView } from '@/components/ShapeView';
import { WorldMap } from '@/components/WorldMap';
import { Card, Chip, Row, Screen, SectionTitle, T } from '@/components/ui';
import { BY_ID, CATEGORY_LABEL, COLOR_HEX, COLOR_LABEL, CONTINENT_LABEL } from '@/data';
import { density, populationFact } from '@/lib/population';
import { MASTERY_LABEL, masteryLevel, useApp } from '@/state/app-state';
import { MAX_WIDTH, space, useTheme } from '@/theme';

const fmt = (n: number) => n.toLocaleString('es-ES');

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ paddingVertical: space.sm }}>
      <T variant="caption" muted>{label}</T>
      <T>{children}</T>
    </View>
  );
}

export default function EntityDetail() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stats } = useApp();
  const { width } = useWindowDimensions();
  const e = BY_ID.get(id ?? '');
  if (!e) return <Screen><T>No encontrada</T></Screen>;

  const s = stats[e.id];
  const m = masteryLevel(s);
  const flagW = Math.min(width, MAX_WIDTH) - space.lg * 2;
  const go = (other: string) => router.push({ pathname: '/glossary/[id]', params: { id: other } });
  const pop = populationFact(e);
  const dens = density(e);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: e.name }} />
      <View style={{ alignItems: 'center', paddingTop: space.md }}>
        <Flag id={e.id} width={flagW} height={flagW * 0.62} />
      </View>
      <T variant="title" style={{ marginTop: space.lg }}>{e.name}</T>
      {e.aliases.length > 0 && <T muted>{e.aliases.join(' · ')}</T>}
      <Row wrap gap={6} style={{ marginTop: space.sm }}>
        <Chip label={CATEGORY_LABEL[e.category]} />
        {e.continent !== 'world' && <Chip label={CONTINENT_LABEL[e.continent]} />}
        {e.subregion && <Chip label={e.subregion} />}
      </Row>
      {e.simplified && (
        <T variant="caption" muted style={{ marginTop: space.sm }}>
          Versión simplificada del emblema.
        </T>
      )}

      <Card style={{ marginTop: space.lg }}>
        {e.capital && <Fact label="Capital">{e.capital}</Fact>}
        {e.years && <Fact label="Periodo">{e.years}</Fact>}
        {pop && <Fact label={pop.label}>{pop.value}</Fact>}
        {e.area && <Fact label="Superficie">{fmt(Math.round(e.area))} km²</Fact>}
        {dens !== undefined && <Fact label="Densidad">{dens.toLocaleString('es-ES', { maximumFractionDigits: dens < 10 ? 1 : 0 })} hab./km²</Fact>}
        {e.language && <Fact label="Lengua propia">{e.language}</Fact>}
        <Fact label="Proporción">{proportion(e.ratio)}</Fact>
        <View style={{ paddingVertical: space.sm }}>
          <T variant="caption" muted>Colores</T>
          <Row wrap gap={6} style={{ marginTop: 4 }}>
            {e.colors.map(col => <Chip key={col} label={COLOR_LABEL[col]} color={COLOR_HEX[col]} />)}
          </Row>
        </View>
        {e.note && <Fact label="Nota">{e.note}</Fact>}
        <Fact label="Tu nivel">
          {MASTERY_LABEL[m]}
          {s ? ` · ${s.c} aciertos, ${s.w} fallos` : ''}
        </Fact>
      </Card>

      {e.geo === 'shape' && (
        <>
          <SectionTitle>Forma</SectionTitle>
          <Card style={{ alignItems: 'center' }}>
            <ShapeView id={e.id} size={180} />
          </Card>
        </>
      )}
      {e.geo && (
        <>
          <SectionTitle>Ubicación</SectionTitle>
          <WorldMap height={220} highlights={[{ id: e.id, color: c.accent }]} />
        </>
      )}

      {e.borders.length > 0 && (
        <>
          <SectionTitle>Fronteras</SectionTitle>
          <Row wrap gap={6}>
            {e.borders.map(b => {
              const other = BY_ID.get(b);
              return other ? <Chip key={b} label={other.name} onPress={() => go(b)} /> : null;
            })}
          </Row>
        </>
      )}

      {e.sameFlag.length > 0 && (
        <>
          <SectionTitle>Misma bandera</SectionTitle>
          <Row wrap gap={6}>
            {e.sameFlag.map(b => <Chip key={b} label={BY_ID.get(b)!.name} onPress={() => go(b)} />)}
          </Row>
        </>
      )}

      <SectionTitle>Banderas parecidas</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
        {e.similar.slice(0, 8).map(sid => (
          <Pressable key={sid} onPress={() => go(sid)} style={({ pressed }) => ({ width: 100, opacity: pressed ? 0.6 : 1 })}>
            <Flag id={sid} width={100} height={64} />
            <T variant="caption" numberOfLines={2} style={{ marginTop: 4 }}>{BY_ID.get(sid)!.name}</T>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

function proportion(r: number): string {
  // find small integers h:w with w/h ≈ r
  let best = '';
  let bestErr = Infinity;
  for (let h = 1; h <= 30; h++) {
    const w = Math.round(r * h);
    const err = Math.abs(w / h - r);
    if (err < bestErr - 1e-3) {
      bestErr = err;
      best = `${h}:${w}`;
    }
    if (err < 0.01) break;
  }
  return best;
}
