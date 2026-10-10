import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Flag } from '@/components/Flag';
import { GameBar, MissedList, ResultView } from '@/components/game';
import { Button, Row, Screen, Segmented, T } from '@/components/ui';
import { COLOR_HEX, COLOR_LABEL, COLOR_ORDER, ENTITIES, type ColorKey, type Entity } from '@/data';
import { sameDesign } from '@/lib/games';
import { buildDeck } from '@/lib/quiz';
import { useApp } from '@/state/app-state';
import { MAX_WIDTH, radius, space, useTheme } from '@/theme';

const ROUNDS = 8;
const MAX_BANDS = 7;

export default function Build() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const { poolEntities, stats, recordAnswer, submitRecord, settings } = useApp();
  const candidates = useMemo(() => {
    const inPool = poolEntities.filter(e => e.bands && e.bands.colors.length <= MAX_BANDS);
    return inPool.length >= 3 ? inPool : ENTITIES.filter(e => e.bands && e.bands.colors.length <= MAX_BANDS);
  }, [poolEntities]);
  const usingFallback = candidates.length && !poolEntities.some(e => e.bands);

  const [deck, setDeck] = useState<Entity[]>(() => buildDeck(candidates, Math.min(ROUNDS, candidates.length), stats));
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<'h' | 'v'>('h');
  const [colors, setColors] = useState<ColorKey[]>(['white', 'white', 'white']);
  const [selected, setSelected] = useState(0);
  const [result, setResult] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Entity[]>([]);
  const [done, setDone] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  const target = deck[i];
  const previewW = Math.min(width, MAX_WIDTH) - space.lg * 2;
  const previewH = previewW / 1.5;

  const reset = () => {
    setDir('h');
    setColors(['white', 'white', 'white']);
    setSelected(0);
    setResult(null);
  };

  const setCount = (n: number) => {
    const next = Array.from({ length: n }, (_, k) => colors[k] ?? 'white');
    setColors(next);
    setSelected(s => Math.min(s, n - 1));
  };

  const paint = (k: ColorKey) => {
    if (result !== null) return;
    setColors(cs => cs.map((x, idx) => (idx === selected ? k : x)));
    setSelected(s => Math.min(s + 1, colors.length - 1));
  };

  const check = () => {
    const ok = sameDesign(target, dir, colors);
    setResult(ok);
    recordAnswer(target.id, ok);
    if (ok) setScore(s => s + 1);
    else setMissed(m => [...m, target]);
  };

  const next = () => {
    if (i + 1 >= deck.length) {
      setDone(true);
      setNewRecord(submitRecord(`build:${JSON.stringify(settings.pool)}`, score));
      return;
    }
    setI(i + 1);
    reset();
  };

  const again = () => {
    setDeck(buildDeck(candidates, Math.min(ROUNDS, candidates.length), stats));
    setI(0);
    setScore(0);
    setMissed([]);
    setDone(false);
    setNewRecord(false);
    reset();
  };

  if (!target) {
    return <Screen edges={[]}><T muted center style={{ marginTop: space.xl }}>No hay banderas de franjas disponibles.</T></Screen>;
  }

  if (done) {
    return (
      <Screen edges={[]}>
        <Stack.Screen options={{ title: 'Construye la bandera' }} />
        <ResultView title="Banderas correctas" score={`${score}/${deck.length}`} newRecord={newRecord} onAgain={again}>
          <MissedList items={missed} />
        </ResultView>
      </Screen>
    );
  }

  const n = colors.length;
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Construye la bandera' }} />
      <GameBar left={<T variant="label" muted>{i + 1} / {deck.length}</T>} right={<T variant="heading">{score} ✓</T>} />
      {usingFallback ? <T variant="caption" muted>Tu selección no tiene banderas de franjas; se usan otras.</T> : null}
      <T variant="title" center style={{ marginTop: space.md }}>{target.name}</T>
      <T variant="caption" muted center>Elige la orientación, el número de franjas y sus colores</T>

      <View style={{ alignItems: 'center', marginTop: space.lg }}>
        {result === null ? (
          <View style={[styles.preview, { borderColor: c.flagBorder }]}>
            <Svg width={previewW} height={previewH}>
              {colors.map((col, k) =>
                dir === 'h' ? (
                  <Rect key={k} x={0} y={(k * previewH) / n} width={previewW} height={previewH / n + 0.5} fill={COLOR_HEX[col]} />
                ) : (
                  <Rect key={k} x={(k * previewW) / n} y={0} width={previewW / n + 0.5} height={previewH} fill={COLOR_HEX[col]} />
                ),
              )}
            </Svg>
            {/* tap targets for each band */}
            <View style={[StyleSheet.absoluteFill, { flexDirection: dir === 'h' ? 'column' : 'row' }]}>
              {colors.map((_, k) => (
                <Pressable key={k} onPress={() => setSelected(k)} style={[{ flex: 1 }, k === selected && { borderWidth: 3, borderColor: c.accent }]} />
              ))}
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <Flag id={target.id} width={previewW} height={previewH} />
            <T variant="heading" color={result ? c.success : c.error}>{result ? '¡Correcto!' : 'Así es la bandera'}</T>
          </View>
        )}
      </View>

      {result === null && (
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <Segmented options={[{ key: 'h', label: 'Horizontal' }, { key: 'v', label: 'Vertical' }]} value={dir} onChange={setDir} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T>Franjas: {n}</T>
            <Row gap={space.sm}>
              <Button title="−" kind="secondary" onPress={() => setCount(Math.max(2, n - 1))} disabled={n <= 2} style={styles.stepper} />
              <Button title="+" kind="secondary" onPress={() => setCount(Math.min(MAX_BANDS, n + 1))} disabled={n >= MAX_BANDS} style={styles.stepper} />
            </Row>
          </Row>
          <T variant="caption" muted>Franja seleccionada: {selected + 1}. Toca un color:</T>
          <Row wrap gap={space.sm}>
            {COLOR_ORDER.map(k => (
              <Pressable key={k} onPress={() => paint(k)} accessibilityLabel={COLOR_LABEL[k]} style={({ pressed }) => [styles.swatch, { backgroundColor: COLOR_HEX[k], borderColor: c.border, opacity: pressed ? 0.6 : 1 }]} />
            ))}
          </Row>
          <Button title="Comprobar" onPress={check} />
        </View>
      )}
      {result !== null && <Button title={i + 1 >= deck.length ? 'Ver resultado' : 'Siguiente'} onPress={next} style={{ marginTop: space.lg }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, overflow: 'hidden' },
  swatch: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1 },
  stepper: { paddingVertical: 8, paddingHorizontal: 18 },
});
