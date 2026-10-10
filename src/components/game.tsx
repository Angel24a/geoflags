import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Entity } from '@/data';
import { suggest } from '@/lib/text';
import { radius, space, useTheme, noOutline } from '@/theme';
import { Flag } from './Flag';
import { ShapeView } from './ShapeView';
import { Button, Card, Icon, Row, T } from './ui';

export type OptionState = 'idle' | 'correct' | 'wrong' | 'dim';

/** Tappable answer tile. */
export function OptionTile({
  children, state = 'idle', onPress, style, disabled,
}: { children: ReactNode; state?: OptionState; onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const c = useTheme();
  const border = state === 'correct' ? c.success : state === 'wrong' ? c.error : c.border;
  const bg = state === 'correct' ? c.successSoft : state === 'wrong' ? c.errorSoft : c.surface;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: border, backgroundColor: bg, opacity: state === 'dim' ? 0.45 : pressed ? 0.7 : 1, borderWidth: state === 'idle' || state === 'dim' ? StyleSheet.hairlineWidth : 2 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Big centred element used as the question prompt. */
export function PromptBox({ children }: { children: ReactNode }) {
  return <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 170, paddingVertical: space.md }}>{children}</View>;
}

export function EntityPrompt({ e, attr, width }: { e: Entity; attr: 'flag' | 'name' | 'capital' | 'shape'; width: number }) {
  if (attr === 'flag') return <Flag id={e.id} width={Math.min(width, 320)} height={190} />;
  if (attr === 'shape') return <ShapeView id={e.id} size={190} />;
  if (attr === 'capital') {
    return (
      <View style={{ alignItems: 'center' }}>
        <T variant="caption" muted>Capital</T>
        <T variant="title" center>{e.capital}</T>
      </View>
    );
  }
  return <T variant="title" center>{e.name}</T>;
}

/** Score / lives / timer strip at the top of a game. */
export function GameBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: space.sm, minHeight: 36 }}>
      <Row gap={space.sm}>{left}</Row>
      <Row gap={space.sm}>{right}</Row>
    </Row>
  );
}

export function Lives({ left, total = 3 }: { left: number; total?: number }) {
  const c = useTheme();
  return (
    <Row gap={4}>
      {Array.from({ length: total }, (_, i) => (
        <Icon key={i} name="heart" size={20} color={i < left ? c.error : c.border} filled={i < left} />
      ))}
    </Row>
  );
}

export function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const base = left;
    const t = setInterval(() => {
      const next = Math.max(0, base - (Date.now() - started) / 1000);
      setLeft(next);
      if (next <= 0) {
        clearInterval(t);
        endRef.current();
      }
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return { left, reset: () => setLeft(seconds) };
}

/** Elapsed seconds while running. */
export function useStopwatch(running: boolean) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - sec * 1000;
    const t = setInterval(() => setSec(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return sec;
}

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Text input with name suggestions. */
export function EntityInput({
  candidates, onSubmit, placeholder = 'Escribe un nombre', autoFocus = true, showSuggestions = true,
}: {
  candidates: Entity[];
  onSubmit: (text: string, picked?: Entity) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}) {
  const c = useTheme();
  const [text, setText] = useState('');
  const list = useMemo(() => (showSuggestions ? suggest(text, candidates, 5) : []), [text, candidates, showSuggestions]);
  const submit = (value: string, picked?: Entity) => {
    if (!value.trim()) return;
    onSubmit(value, picked);
    setText('');
  };
  return (
    <View>
      <View style={[styles.input, { backgroundColor: c.surface, borderColor: c.border }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={c.textSecondary}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="send"
          onSubmitEditing={() => submit(text, list.length === 1 ? list[0] : undefined)}
          blurOnSubmit={false}
          style={[{ flex: 1, fontSize: 17, color: c.text, paddingVertical: 12 }, noOutline]}
        />
        <Pressable onPress={() => submit(text, list.length === 1 ? list[0] : undefined)} hitSlop={8}>
          <Icon name="check" color={c.accent} />
        </Pressable>
      </View>
      {list.length > 0 && (
        <View style={[styles.suggestions, { backgroundColor: c.surface, borderColor: c.border }]}>
          {list.map(e => (
            <Pressable key={e.id} onPress={() => submit(e.name, e)} style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: c.surfaceAlt }]}>
              <T>{e.name}</T>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** End-of-game summary. */
export function ResultView({
  title, score, detail, newRecord, onAgain, children,
}: { title: string; score: string; detail?: string; newRecord?: boolean; onAgain: () => void; children?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={{ gap: space.lg, paddingTop: space.xl }}>
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <T muted>{title}</T>
        <T variant="big">{score}</T>
        {detail && <T muted center>{detail}</T>}
        {newRecord && (
          <View style={{ backgroundColor: c.successSoft, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, marginTop: space.sm }}>
            <T variant="label" color={c.success}>¡Nuevo récord!</T>
          </View>
        )}
      </View>
      {children}
      <View style={{ gap: space.sm }}>
        <Button title="Jugar otra vez" onPress={onAgain} />
        <Button title="Volver" kind="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}

/** List of missed entities with their flag. */
export function MissedList({ items, title = 'Para repasar' }: { items: Entity[]; title?: string }) {
  if (!items.length) return null;
  return (
    <Card style={{ gap: space.md }}>
      <T variant="label">{title}</T>
      {items.map(e => (
        <Pressable key={e.id} onPress={() => router.push({ pathname: '/glossary/[id]', params: { id: e.id } })}>
          <Row gap={space.md}>
            <Flag id={e.id} height={24} normalized />
            <View style={{ flex: 1 }}>
              <T numberOfLines={1}>{e.name}</T>
              {e.capital && <T variant="caption" muted numberOfLines={1}>{e.capital}</T>}
            </View>
          </Row>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, padding: space.md, alignItems: 'center', justifyContent: 'center' },
  input: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md },
  suggestions: { marginTop: 4, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, overflow: 'hidden' },
  suggestion: { paddingVertical: 12, paddingHorizontal: space.md },
});
