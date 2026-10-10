import { Platform, useColorScheme, type TextStyle } from 'react-native';

const light = {
  bg: '#F6F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEFEA',
  text: '#16171A',
  textSecondary: '#6A6C72',
  border: '#E3E3DE',
  accent: '#2F6FEB',
  accentSoft: '#E4ECFD',
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
  bg: '#0F1012',
  surface: '#191A1D',
  surfaceAlt: '#232428',
  text: '#F1F1F0',
  textSecondary: '#9B9DA3',
  border: '#2B2D31',
  accent: '#6B97FF',
  accentSoft: '#1E2A44',
  success: '#3CC17A',
  successSoft: '#163223',
  error: '#F06A6A',
  errorSoft: '#3A1D1D',
  warning: '#F0B04A',
  flagBorder: 'rgba(255,255,255,0.16)',
  ocean: '#14181D',
  land: '#3A3D43',
  landStroke: '#14181D',
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
