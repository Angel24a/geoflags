import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Adds the build number (GitHub Actions run number) so the app can tell
 * whether a newer APK has been published.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const build = Number(process.env.BUILD_NUMBER ?? 0) || 0;
  return {
    ...config,
    name: config.name ?? 'GeoFlags',
    slug: config.slug ?? 'geoflags',
    android: { ...config.android, versionCode: Math.max(1, build) },
    extra: {
      ...config.extra,
      buildNumber: build,
      updateUrl: process.env.EXPO_PUBLIC_UPDATE_URL || 'https://github.com/Angel24a/geoflags/releases/download/apk-latest',
    },
  };
};
