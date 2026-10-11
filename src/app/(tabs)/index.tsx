import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Flag } from '@/components/Flag';
import { Card, Icon, Row, Screen, SectionTitle, T, type IconName } from '@/components/ui';
import { describePool } from '@/lib/pool';
import { useAvailableUpdate } from '@/lib/updates';
import { Linking } from 'react-native';
import type { Attr, Rule } from '@/lib/quiz';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

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

const GAMES: { href: Href; title: string; text: string; icon: IconName }[] = [
  { href: '/play/complete', title: 'Completa la región', text: 'Escribe todos los de un continente o región', icon: 'grid' },
  { href: '/play/reveal', title: 'Pixelada o zoom', text: 'Adivina la bandera mientras se revela', icon: 'search' },
  { href: '/play/build', title: 'Construye la bandera', text: 'Elige las franjas y sus colores', icon: 'filter' },
  { href: '/play/spot', title: 'Encuentra el error', text: '¿Cuál de las cuatro es la correcta?', icon: 'check' },
  { href: '/play/worldle', title: 'Worldle', text: 'Adivina por la forma con pistas de distancia', icon: 'globe' },
  { href: '/play/chain', title: 'Cadena de vecinos', text: 'Llega de un país a otro por sus fronteras', icon: 'shuffle' },
  { href: '/play/sort', title: 'Ordenar', text: 'Por población, superficie, vecinos, forma de la bandera…', icon: 'chart' },
  { href: '/play/peoples', title: 'Pueblos del mundo', text: 'Marca en el mapa dónde vive cada pueblo', icon: 'people' },
];

export default function Home() {
  const c = useTheme();
  const { settings, poolEntities } = useApp();
  const sample = poolEntities.slice(0, 3);
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
        <T muted>Aprende las banderas del mundo</T>
      </View>

      {update && (
        <Card onPress={() => Linking.openURL(update.apk)} style={{ marginTop: space.lg, backgroundColor: c.accentSoft, borderColor: c.accent }}>
          <T variant="label" color={c.accent}>Nueva versión disponible ({update.build})</T>
          <T variant="caption" muted>Toca para descargarla e instalarla encima. Tu progreso se mantiene.</T>
        </Card>
      )}

      <Card onPress={() => router.push('/pool')} style={{ marginTop: space.xl }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="caption" muted>Banderas en juego</T>
            <T variant="heading">{describePool(settings.pool)}</T>
            <T variant="caption" muted>{poolEntities.length} banderas</T>
          </View>
          <Row gap={4}>
            {sample.map(e => (
              <Flag key={e.id} id={e.id} height={22} normalized />
            ))}
          </Row>
          <Icon name="chevron" color={c.textSecondary} />
        </Row>
      </Card>

      <SectionTitle>Test</SectionTitle>
      <Card onPress={() => router.push('/play/setup')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="heading">Test personalizado</T>
            <T variant="caption" muted>Combina banderas, nombres, capitales, formas y mapa</T>
          </View>
          <Icon name="chevron" color={c.textSecondary} />
        </Row>
      </Card>
      <Row wrap gap={space.sm} style={{ marginTop: space.sm }}>
        {QUICK.map(q => (
          <Card key={q.label} onPress={() => startQuiz(q)} style={{ paddingVertical: space.md, paddingHorizontal: space.md, flexGrow: 1, flexBasis: '45%' }}>
            <T variant="label">{q.label}</T>
          </Card>
        ))}
      </Row>

      <SectionTitle>Desafíos</SectionTitle>
      <Row gap={space.sm}>
        {CHALLENGES.map(ch => (
          <Card
            key={ch.rule}
            onPress={() => router.push({ pathname: '/play/setup', params: { rule: ch.rule } })}
            style={{ flex: 1, alignItems: 'flex-start', gap: space.sm }}
          >
            <Icon name={ch.icon} color={c.accent} />
            <View>
              <T variant="label">{ch.title}</T>
              <T variant="caption" muted>{ch.text}</T>
            </View>
          </Card>
        ))}
      </Row>

      <SectionTitle>Juegos</SectionTitle>
      <View style={{ gap: space.sm }}>
        {GAMES.map(g => (
          <Card key={g.title} onPress={() => router.push(g.href)}>
            <Row gap={space.md}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={g.icon} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="label">{g.title}</T>
                <T variant="caption" muted>{g.text}</T>
              </View>
              <Icon name="chevron" color={c.textSecondary} />
            </Row>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
