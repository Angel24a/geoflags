import { router, type Href } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';

import { Flag } from '@/components/Flag';
import { Card, Icon, Row, Screen, SectionTitle, T, type IconName } from '@/components/ui';
import { describePool } from '@/lib/pool';
import type { Attr, Rule } from '@/lib/quiz';
import { useAvailableUpdate } from '@/lib/updates';
import { useApp } from '@/state/app-state';
import { radius, space, useTheme } from '@/theme';

interface QuickQuiz {
  label: string;
  prompt: Attr;
  answer: Attr;
}

const QUICK: QuickQuiz[] = [
  { label: 'Bandera → Nombre', prompt: 'flag', answer: 'name' },
  { label: 'Nombre → Bandera', prompt: 'name', answer: 'flag' },
  { label: 'Bandera → Capital', prompt: 'flag', answer: 'capital' },
  { label: 'Forma → Nombre', prompt: 'shape', answer: 'name' },
  { label: 'Bandera → Mapa', prompt: 'flag', answer: 'map' },
  { label: 'Capital → Mapa', prompt: 'capital', answer: 'map' },
];

const CHALLENGES: { rule: Rule; title: string; text: string; icon: IconName }[] = [
  { rule: 'survival', title: 'Supervivencia', text: '3 vidas', icon: 'heart' },
  { rule: 'timed', title: 'Contrarreloj', text: '60 segundos', icon: 'timer' },
  { rule: 'streak', title: 'Racha', text: 'Sin fallar', icon: 'flame' },
];

interface Game {
  href: Href;
  title: string;
  text: string;
  icon: IconName;
  isNew?: boolean;
}

const CATEGORIES: { title: string; games: Game[] }[] = [
  {
    title: 'Banderas',
    games: [
      { href: '/play/reveal', title: 'Pixelada o zoom', text: 'Adivina mientras se revela', icon: 'search' },
      { href: '/play/build', title: 'Construye la bandera', text: 'Elige franjas y colores', icon: 'filter' },
      { href: '/play/spot', title: 'Encuentra el error', text: '¿Cuál es la correcta?', icon: 'check' },
    ],
  },
  {
    title: 'Mapas',
    games: [
      { href: '/play/complete', title: 'Completa la región', text: 'Todos los de un continente', icon: 'grid' },
      { href: '/play/worldle', title: 'Worldle', text: 'Por la forma y la distancia', icon: 'globe' },
      { href: '/play/chain', title: 'Cadena de vecinos', text: 'De un país a otro por tierra', icon: 'shuffle' },
    ],
  },
  {
    title: 'Datos',
    games: [
      { href: '/play/population', title: 'Población', text: 'Cifras, más o menos y estimar', icon: 'population', isNew: true },
      { href: '/play/sort', title: 'Ordenar', text: 'Población, superficie, vecinos…', icon: 'chart' },
    ],
  },
  {
    title: 'Pueblos e idiomas',
    games: [
      { href: '/play/languages', title: 'Idiomas', text: '¿En qué idioma está la frase?', icon: 'language', isNew: true },
      { href: '/play/peoples', title: 'Pueblos del mundo', text: '¿Dónde vive cada pueblo?', icon: 'people' },
    ],
  },
];

export default function Home() {
  const c = useTheme();
  const { settings, poolEntities } = useApp();
  const update = useAvailableUpdate();

  const startQuiz = (q: { prompt: Attr; answer: Attr; rule?: Rule }) =>
    router.push({
      pathname: '/play/quiz',
      params: { prompt: q.prompt, answer: q.answer, input: q.answer === 'map' ? 'map' : 'choice', rule: q.rule ?? 'classic' },
    });

  return (
    <Screen>
      <View style={{ paddingTop: space.lg }}>
        <T variant="title">GeoFlags</T>
        <T muted>Banderas, mapas, idiomas y pueblos del mundo</T>
      </View>

      {update && (
        <Card onPress={() => Linking.openURL(update.apk)} style={{ marginTop: space.lg, backgroundColor: c.accentSoft, borderColor: c.accent }}>
          <T variant="label" color={c.accent}>Nueva versión disponible ({update.build})</T>
          <T variant="caption" muted>Toca para descargarla e instalarla encima. Tu progreso se mantiene.</T>
        </Card>
      )}

      <Card onPress={() => router.push('/pool')} style={{ marginTop: space.lg, paddingVertical: space.md }}>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="caption" muted>Banderas en juego</T>
            <T variant="label">{describePool(settings.pool)} · {poolEntities.length}</T>
          </View>
          <Row gap={4}>
            {poolEntities.slice(0, 3).map(e => <Flag key={e.id} id={e.id} height={20} normalized />)}
          </Row>
          <Icon name="chevron" color={c.textSecondary} />
        </Row>
      </Card>

      <SectionTitle>Test</SectionTitle>
      <Card onPress={() => router.push('/play/setup')} style={{ backgroundColor: c.accent, borderColor: c.accent }}>
        <Row>
          <View style={{ flex: 1 }}>
            <T variant="heading" color={c.onAccent}>Test personalizado</T>
            <T variant="caption" color={c.onAccent} style={{ opacity: 0.85 }}>Banderas, nombres, capitales, formas y mapa</T>
          </View>
          <Icon name="chevron" color={c.onAccent} />
        </Row>
      </Card>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: space.sm, marginHorizontal: -space.lg, flexGrow: 0 }}
        contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg, alignItems: 'flex-start' }}
      >
        {QUICK.map(q => (
          <Card key={q.label} onPress={() => startQuiz(q)} style={{ paddingVertical: space.sm, paddingHorizontal: space.md }}>
            <T variant="label">{q.label}</T>
          </Card>
        ))}
      </ScrollView>

      <SectionTitle>Desafíos</SectionTitle>
      <Row gap={space.sm}>
        {CHALLENGES.map(ch => (
          <Card
            key={ch.rule}
            onPress={() => router.push({ pathname: '/play/setup', params: { rule: ch.rule } })}
            style={{ flex: 1, alignItems: 'flex-start', gap: space.sm, padding: space.md }}
          >
            <Icon name={ch.icon} color={c.accent} />
            <View>
              <T variant="label">{ch.title}</T>
              <T variant="caption" muted>{ch.text}</T>
            </View>
          </Card>
        ))}
      </Row>

      {CATEGORIES.map(cat => (
        <View key={cat.title}>
          <SectionTitle>{cat.title}</SectionTitle>
          <Row wrap gap={space.sm} style={{ alignItems: 'stretch' }}>
            {cat.games.map(g => (
              <Card key={g.title} onPress={() => router.push(g.href)} style={{ flexBasis: '47%', flexGrow: 1, maxWidth: '49%', padding: space.md, gap: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={g.icon} size={20} color={c.accent} />
                  </View>
                  {g.isNew && (
                    <View style={{ backgroundColor: c.accent, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <T variant="caption" color={c.onAccent} style={{ fontSize: 11, fontWeight: '700' }}>NUEVO</T>
                    </View>
                  )}
                </Row>
                <View>
                  <T variant="label">{g.title}</T>
                  <T variant="caption" muted numberOfLines={2}>{g.text}</T>
                </View>
              </Card>
            ))}
          </Row>
        </View>
      ))}
    </Screen>
  );
}
