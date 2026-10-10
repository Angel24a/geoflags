import { Tabs } from 'expo-router/js-tabs';

import { Icon } from '@/components/ui';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Jugar', tabBarIcon: ({ color }) => <Icon name="play" color={String(color)} /> }} />
      <Tabs.Screen name="online" options={{ title: 'Online', tabBarIcon: ({ color }) => <Icon name="globe" color={String(color)} /> }} />
      <Tabs.Screen name="glossary" options={{ title: 'Glosario', tabBarIcon: ({ color }) => <Icon name="book" color={String(color)} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progreso', tabBarIcon: ({ color }) => <Icon name="chart" color={String(color)} /> }} />
    </Tabs>
  );
}
