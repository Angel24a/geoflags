import { useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { BUILD, checkForUpdate, updatesSupported, type RemoteVersion } from '@/lib/updates';
import { space, useTheme } from '@/theme';
import { Button, Card, T } from './ui';

/** Settings card: check for a newer APK and download it. Progress is kept when installing over the app. */
export function UpdateCard() {
  const c = useTheme();
  const [state, setState] = useState<'idle' | 'checking' | 'latest' | 'error'>('idle');
  const [update, setUpdate] = useState<RemoteVersion | null>(null);
  const [error, setError] = useState('');

  const check = async () => {
    setState('checking');
    try {
      const u = await checkForUpdate();
      setUpdate(u);
      setState(u ? 'idle' : 'latest');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  };

  return (
    <Card style={{ gap: space.sm }}>
      <T variant="heading">Actualizaciones</T>
      <T variant="caption" muted>{BUILD > 0 ? `Versión instalada: ${BUILD}` : 'Versión de desarrollo'}</T>
      {!updatesSupported ? (
        <T variant="caption" muted>Las actualizaciones automáticas están disponibles en el APK de Android.</T>
      ) : update ? (
        <View style={{ gap: space.sm }}>
          <T>Hay una versión nueva ({update.build}).</T>
          {!!update.notes && <T variant="caption" muted>{update.notes}</T>}
          <Button title="Descargar e instalar" onPress={() => Linking.openURL(update.apk)} />
          <T variant="caption" muted>Se descarga el APK: ábrelo e instálalo encima. No perderás tu progreso.</T>
        </View>
      ) : (
        <>
          <Button title="Buscar actualizaciones" kind="secondary" onPress={check} disabled={state === 'checking'} />
          {state === 'checking' && <ActivityIndicator />}
          {state === 'latest' && <T variant="caption" color={c.success}>Ya tienes la última versión.</T>}
          {state === 'error' && <T variant="caption" color={c.error}>No se pudo comprobar: {error}</T>}
        </>
      )}
    </Card>
  );
}
