import { Alert, Platform, Switch, View } from 'react-native';

import { UpdateCard } from '@/components/UpdateCard';
import { Button, Card, Row, Screen, SectionTitle, T } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { space } from '@/theme';

export default function Settings() {
  const { settings, updateSettings, resetProgress } = useApp();

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
    <Screen edges={[]}>
      <SectionTitle>Juego</SectionTitle>
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

      <SectionTitle>Aplicación</SectionTitle>
      <UpdateCard />

      <SectionTitle>Datos</SectionTitle>
      <Card style={{ gap: space.sm }}>
        <T variant="caption" muted>Borra estadísticas, récords y niveles de banderas e idiomas. Los ajustes y tu nombre se mantienen.</T>
        <Button title="Borrar progreso" kind="secondary" onPress={confirmReset} />
      </Card>
    </Screen>
  );
}
