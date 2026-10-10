import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { NameForm, NotConfigured } from '@/components/online';
import { Card, Icon, Row, Screen, SectionTitle, T, type IconName } from '@/components/ui';
import { onlineConfigured } from '@/lib/online/client';
import { dayKey } from '@/lib/online/seeded';
import { useApp } from '@/state/app-state';
import { space, useTheme } from '@/theme';

const ITEMS: { href: Href; title: string; text: string; icon: IconName }[] = [
  { href: '/online/daily', title: 'Reto diario', text: 'Las mismas 10 preguntas para todos, una vez al día', icon: 'timer' },
  { href: '/online/duel', title: 'Duelo en directo', text: 'Crea una sala y jugad a la vez con un código', icon: 'flame' },
  { href: '/online/challenge', title: 'Retar a amigos', text: 'Juega una partida y pásales el código para que la superen', icon: 'shuffle' },
  { href: '/online/leaderboard', title: 'Clasificación', text: 'Mejores marcas de supervivencia, contrarreloj y racha', icon: 'chart' },
];

export default function Online() {
  const c = useTheme();
  const { profile, daily } = useApp();
  const today = daily[dayKey()];

  return (
    <Screen>
      <T variant="title" style={{ paddingTop: space.lg }}>Online</T>
      <T muted>Juega contra tus amigos</T>

      {!onlineConfigured ? (
        <View style={{ marginTop: space.xl }}>
          <NotConfigured />
        </View>
      ) : (
        <>
          <SectionTitle>Tu perfil</SectionTitle>
          <Card style={{ gap: space.md }}>
            {profile.name ? <T variant="heading">{profile.name}</T> : <T muted>Elige un nombre para jugar online.</T>}
            <NameForm />
          </Card>

          <SectionTitle>Jugar</SectionTitle>
          <View style={{ gap: space.sm }}>
            {ITEMS.map(it => (
              <Card key={it.title} onPress={() => router.push(it.href)}>
                <Row gap={space.md}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={it.icon} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="label">{it.title}</T>
                    <T variant="caption" muted>
                      {it.href === '/online/daily' && today ? `Hoy: ${today.score} puntos · ${today.correct}/${today.total}` : it.text}
                    </T>
                  </View>
                  <Icon name="chevron" color={c.textSecondary} />
                </Row>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
