import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** Build number of this APK (0 in development). */
export const BUILD: number = Number(Constants.expoConfig?.extra?.buildNumber ?? 0) || 0;
const BASE: string = Constants.expoConfig?.extra?.updateUrl ?? '';

export interface RemoteVersion {
  build: number;
  date: string;
  notes: string;
  apk: string;
}

/** Updates are only offered on Android builds made by GitHub Actions. */
export const updatesSupported = Platform.OS === 'android' && BUILD > 0 && !!BASE;

/** Returns the published version if it is newer than this one. */
export async function checkForUpdate(): Promise<RemoteVersion | null> {
  const res = await fetch(`${BASE}/version.json?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(res.status === 404 ? 'No se encuentra la versión publicada (¿repositorio privado?)' : `HTTP ${res.status}`);
  const v = (await res.json()) as Omit<RemoteVersion, 'apk'>;
  return v.build > BUILD ? { ...v, apk: `${BASE}/geoflags.apk` } : null;
}

/** Checks once in the background (used for the banner on the home screen). */
export function useAvailableUpdate(): RemoteVersion | null {
  const [update, setUpdate] = useState<RemoteVersion | null>(null);
  useEffect(() => {
    if (!updatesSupported) return;
    checkForUpdate().then(setUpdate).catch(() => {});
  }, []);
  return update;
}
