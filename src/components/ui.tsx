import type { ReactNode } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
  type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { MAX_WIDTH, radius, space, useTheme } from '@/theme';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption' | 'big';

const VARIANT: Record<Variant, TextStyle> = {
  big: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13 },
};

export function T({
  variant = 'body', muted, color, center, style, ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string; center?: boolean }) {
  const c = useTheme();
  return (
    <Text
      {...rest}
      style={[VARIANT[variant], { color: color ?? (muted ? c.textSecondary : c.text) }, center && { textAlign: 'center' }, style]}
    />
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Screen({
  children, scroll = true, edges = ['top'], contentStyle,
}: { children: ReactNode; scroll?: boolean; edges?: Edge[]; contentStyle?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Row({ children, gap = space.sm, style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useTheme();
  const base = [styles.card, { backgroundColor: c.surface, borderColor: c.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <T variant="label" muted style={{ marginTop: space.xl, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 12 }}>
      {children}
    </T>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

type ButtonKind = 'primary' | 'secondary' | 'ghost';

export function Button({
  title, onPress, kind = 'primary', disabled, style, icon,
}: { title: string; onPress?: () => void; kind?: ButtonKind; disabled?: boolean; style?: StyleProp<ViewStyle>; icon?: ReactNode }) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'secondary' ? c.surfaceAlt : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : kind === 'secondary' ? c.text : c.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 }, style]}
    >
      {icon}
      <T variant="label" color={fg} style={{ fontSize: 16 }}>{title}</T>
    </Pressable>
  );
}

export function Chip({
  label, selected, onPress, color,
}: { label: string; selected?: boolean; onPress?: () => void; color?: string }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? c.accent : c.border, backgroundColor: selected ? c.accentSoft : c.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {color && <View style={[styles.swatch, { backgroundColor: color, borderColor: c.flagBorder }]} />}
      <T variant="caption" color={selected ? c.accent : c.text} style={{ fontWeight: '600' }}>{label}</T>
    </Pressable>
  );
}

/** Segmented control. */
export function Segmented<K extends string>({
  options, value, onChange,
}: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}>
      {options.map(o => {
        const sel = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={[styles.segment, sel && { backgroundColor: c.surface }]}>
            <T variant="caption" color={sel ? c.text : c.textSecondary} style={{ fontWeight: '600' }} center>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = useTheme();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color ?? c.accent }} />
    </View>
  );
}

export function PressableRow({ children, onPress, style }: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Icons (24×24, stroke based)
// ---------------------------------------------------------------------------

const ICONS = {
  play: 'M7 5l12 7-12 7z',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z',
  timer: 'M12 21a8 8 0 100-16 8 8 0 000 16zM12 9v4l2 2M9 2h6',
  flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-9-2 2-2 4-3 5-1-2-2-3-2-5-3 3-5 6-5 9 0 4 3 7 7 7z',
  filter: 'M3 5h18M6 12h12M10 19h4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  shuffle: 'M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M16 11a3 3 0 000-6M18 15c2 .6 3 2.3 3 5',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  language: 'M4 4h16v12H10l-5 4v-4H4zM8 8h8M8 12h5',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  flag: 'M5 21V4M5 4h12l-2.5 4L17 12H5',
  population: 'M8 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM16 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 19c0-3 2.2-5 5-5s5 2 5 5M11 19c0-3 2.2-5 5-5s5 2 5 5',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color, filled }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  const c = useTheme();
  const col = color ?? c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICONS[name]} stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={filled ? col : 'none'} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, paddingBottom: space.xxl, flexGrow: 1 },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  button: { flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: space.xl, borderRadius: radius.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: { flex: 1, paddingVertical: 8, borderRadius: radius.sm },
});
