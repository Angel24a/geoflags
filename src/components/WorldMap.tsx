import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { BY_ID } from '@/data';
import { featureAt, locate, world } from '@/lib/geo';
import { useTheme } from '@/theme';
import { Icon, T } from './ui';

export interface MapHighlight {
  id: string;
  color: string;
}

interface Props {
  height?: number;
  highlights?: MapHighlight[];
  /** Called with the tapped territory (or the nearest small one) and the coordinates. */
  onPick?: (id: string | null, lonlat: [number, number]) => void;
  /** Ids that count as "tap targets" for small territories (shown as dots). */
  dotIds?: string[];
  /** Point to circle (e.g. the correct answer), as [lon, lat]. */
  pin?: [number, number] | null;
  pinColor?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 12;
const DOT_TOLERANCE = 14;

function WorldMapImpl({ height = 300, highlights = [], onPick, dotIds, pin, pinColor }: Props) {
  const c = useTheme();
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const w = width || 1;
  const h = height;
  const { shapes, proj, sphere } = useMemo(() => world(w, h), [w, h]);

  // Small territories get a dot so they can be seen and tapped.
  const dots = useMemo(() => {
    const ids = dotIds ?? [...BY_ID.values()].filter(e => e.geo === 'marker' || e.geo === 'tiny' || (e.geo === 'shape' && (e.area ?? 1e9) < 1500)).map(e => e.id);
    return ids
      .map(id => {
        const ll = locate(id);
        const p = ll ? proj(ll) : null;
        return p ? { id, x: p[0], y: p[1] } : null;
      })
      .filter((d): d is { id: string; x: number; y: number } => !!d);
  }, [dotIds, proj]);

  const hl = useMemo(() => new Map(highlights.map(x => [x.id, x.color])), [highlights]);

  // Transform state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const clamp = (v: number, lo: number, hi: number) => {
    'worklet';
    return Math.min(hi, Math.max(lo, v));
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate(e => {
      const maxX = (w * (scale.value - 1)) / 2;
      const maxY = (h * (scale.value - 1)) / 2;
      tx.value = clamp(savedTx.value + e.translationX, -maxX, maxX);
      ty.value = clamp(savedTy.value + e.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const handleTap = useCallback(
    (x: number, y: number) => {
      if (!onPick) return;
      const s = scale.value;
      // undo the transform (origin is the centre of the view)
      const cx = w / 2 + (x - w / 2 - tx.value) / s;
      const cy = h / 2 + (y - h / 2 - ty.value) / s;
      const ll = proj.invert?.([cx, cy]);
      if (!ll || Number.isNaN(ll[0])) return;
      let best: string | null = null;
      let bestD = DOT_TOLERANCE / s;
      for (const d of dots) {
        const dist = Math.hypot(d.x - cx, d.y - cy);
        if (dist < bestD) {
          bestD = dist;
          best = d.id;
        }
      }
      onPick(best ?? featureAt(ll as [number, number]), ll as [number, number]);
    },
    [onPick, w, h, proj, dots, scale, tx, ty],
  );

  const tap = Gesture.Tap()
    .maxDistance(8)
    .runOnJS(true)
    .onEnd(e => handleTap(e.x, e.y));

  const gesture = Gesture.Race(Gesture.Simultaneous(pinch, pan), tap);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const setScale = (next: number) => {
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    const k = s / scale.value;
    scale.value = withTiming(s);
    savedScale.value = s;
    const maxX = (w * (s - 1)) / 2;
    const maxY = (h * (s - 1)) / 2;
    tx.value = withTiming(clamp(tx.value * k, -maxX, maxX));
    ty.value = withTiming(clamp(ty.value * k, -maxY, maxY));
    savedTx.value = clamp(tx.value * k, -maxX, maxX);
    savedTy.value = clamp(ty.value * k, -maxY, maxY);
    setZoom(s);
  };

  const pinPoint = pin ? proj(pin) : null;
  const strokeW = 0.5;

  return (
    <View onLayout={onLayout} style={[styles.wrap, { height, backgroundColor: c.ocean, borderColor: c.border }]}>
      {width > 0 && (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ width: w, height: h }, animated]}>
            <Svg width={w} height={h}>
              <Path d={sphere} fill={c.ocean} />
              <G>
                {shapes.map(s => (
                  <Path key={s.id} d={s.d} fill={hl.get(s.id) ?? c.land} stroke={c.landStroke} strokeWidth={strokeW / zoom} />
                ))}
              </G>
              {dots.map(d => (
                <Circle
                  key={d.id}
                  cx={d.x}
                  cy={d.y}
                  r={(hl.has(d.id) ? 4 : 2.2) / Math.sqrt(zoom)}
                  fill={hl.get(d.id) ?? c.textSecondary}
                  opacity={hl.has(d.id) ? 1 : 0.35}
                />
              ))}
              {pinPoint && <Circle cx={pinPoint[0]} cy={pinPoint[1]} r={9 / zoom} fill="none" stroke={pinColor ?? c.text} strokeWidth={2 / zoom} />}
            </Svg>
          </Animated.View>
        </GestureDetector>
      )}
      <View style={styles.zoomButtons}>
        <ZoomButton label="+" onPress={() => setScale(scale.value * 2)} />
        <ZoomButton label="−" onPress={() => setScale(scale.value / 2)} />
        <ZoomButton icon onPress={() => { setScale(1); tx.value = withTiming(0); ty.value = withTiming(0); savedTx.value = 0; savedTy.value = 0; }} />
      </View>
    </View>
  );
}

function ZoomButton({ label, onPress, icon }: { label?: string; onPress: () => void; icon?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.zoomButton, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}
    >
      {icon ? <Icon name="globe" size={16} color={c.text} /> : <T variant="heading">{label}</T>}
    </Pressable>
  );
}

export const WorldMap = memo(WorldMapImpl);

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  zoomButtons: { position: 'absolute', right: 8, top: 8, gap: 6 },
  zoomButton: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
