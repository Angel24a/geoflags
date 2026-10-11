import { Platform, useColorScheme, type TextStyle } from 'react-native';

const light = {
  bg: '#F6F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEFEA',
  text: '#16171A',
  textSecondary: '#6A6C72',
  border: '#E3E3DE',
  // dark purple, as in the app icon
  accent: '#5B21B6',
  accentSoft: '#EDE7FA',
  /** Text on accent backgrounds. */
  onAccent: '#FFFFFF',
  success: '#1E9E5A',
  successSoft: '#DDF3E6',
  error: '#D64545',
  errorSoft: '#FBE3E3',
  warning: '#D9911A',
  flagBorder: 'rgba(0,0,0,0.12)',
  ocean: '#E9EEF3',
  land: '#D5D8DC',
  landStroke: '#FFFFFF',
};

const dark: typeof light = {
  bg: '#0B0A10',
  surface: '#17151D',
  surfaceAlt: '#221F2A',
  text: '#F1F0F4',
  textSecondary: '#9D9AA6',
  border: '#2B2833',
  // lighter purple so it reads on black
  accent: '#A78BFA',
  accentSoft: '#2A1F45',
  onAccent: '#140B26',
  success: '#3CC17A',
  successSoft: '#163223',
  error: '#F06A6A',
  errorSoft: '#3A1D1D',
  warning: '#F0B04A',
  flagBorder: 'rgba(255,255,255,0.16)',
  ocean: '#131119',
  land: '#3A3744',
  landStroke: '#131119',
};

export type Palette = typeof light;

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const MAX_WIDTH = 640;

/** Removes the browser focus ring from text inputs on web. */
export const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;
