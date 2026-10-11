import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { BY_ID } from '@/data';
import { featureAt, features, locate, world } from '@/lib/geo';
import { useTheme } from '@/theme';
import { Icon, T } from './ui';
import { geoPath } from 'd3-geo';

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
  /** Territories to frame when the map opens (e.g. the countries of a chain). */
  focus?: string[];
  /**
   * Draw the borders between territories (default). Without them only the
   * land and the highlighted territories are visible.
   */
  borders?: boolean;
}

/** Visible part of the projected map, in projection pixels (like an SVG viewBox). */
interface View4 {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MAX_ZOOM = 40;
const DOT_TOLERANCE = 14;

function clampView(v: View4, W: number, H: number): View4 {
  const w = Math.min(W, Math.max(W / MAX_ZOOM, v.w));
  const h = (w * H) / W;
  const x = Math.min(Math.max(v.x, 0), W - w);
  const y = Math.min(Math.max(v.y, 0), H - h);
  return { x, y, w, h };
}

/**
 * World map drawn as vectors. Pinch/pan move the drawing live and, when the
 * gesture ends, the map is redrawn for the new view so it stays sharp at any
 * zoom (scaling the rendered view would pixelate on Android).
 */
function WorldMapImpl({ height = 300, highlights = [], onPick, dotIds, pin, pinColor, focus, borders = true }: Props) {
  const c = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const W = width || 1;
  const H = height;
  const { shapes, proj, sphere } = useMemo(() => world(W, H), [W, H]);
  const full: View4 = useMemo(() => ({ x: 0, y: 0, w: W, h: H }), [W, H]);

  const focusView = useMemo(() => {
    if (!focus?.length || width === 0) return full;
    const path = geoPath(proj);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of focus) {
      const f = features().get(id);
      const ll = locate(id);
      const pts: [number, number][] = f ? (path.bounds(f) as [number, number][]) : ll ? [proj(ll) as [number, number]] : [];
      for (const [x, y] of pts) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    if (!Number.isFinite(x0)) return full;
    const pad = 0.25;
    let w = (x1 - x0) * (1 + pad * 2);
    let h = (y1 - y0) * (1 + pad * 2);
    // keep the aspect ratio of the view
    if (w / h < W / H) w = (h * W) / H;
    else h = (w * H) / W;
    return clampView({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }, W, H);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.join(','), width, proj]);

  const [view, setView] = useState<View4>(full);
  useEffect(() => setView(focusView), [focusView]);

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
  // without borders, plain land is drawn first so it cannot cover the outline of a highlighted territory
  const ordered = useMemo(
    () => (borders ? shapes : [...shapes.filter(s => !hl.has(s.id)), ...shapes.filter(s => hl.has(s.id))]),
    [shapes, hl, borders],
  );

  // Live gesture transform, folded into `view` when the gesture ends.
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  /** Screen point → point in the current view's projection coordinates. */
  const toProjected = useCallback(
    (sx: number, sy: number, s = 1, dx = 0, dy = 0): [number, number] => {
      // undo the live transform (origin is the centre of the view)
      const vx = W / 2 + (sx - W / 2 - dx) / s;
      const vy = H / 2 + (sy - H / 2 - dy) / s;
      const k = view.w / W;
      return [view.x + vx * k, view.y + vy * k];
    },
    [view, W, H],
  );

  const commit = useCallback(
    (s: number, dx: number, dy: number) => {
      // the screen's top-left corner and new width, in projection coordinates
      const [x, y] = toProjected(0, 0, s, dx, dy);
      setView(clampView({ x, y, w: view.w / s, h: view.h / s }, W, H));
      scale.value = 1;
      tx.value = 0;
      ty.value = 0;
    },
    [toProjected, view, W, H, scale, tx, ty],
  );

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate(e => {
      scale.value = Math.max(0.5, Math.min(8, startScale.value * e.scale));
    })
    .onEnd(() => {
      runOnJS(commit)(scale.value, tx.value, ty.value);
    });

  const pan = Gesture.Pan()
    .minDistance(4)
    .averageTouches(true)
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = startTx.value + e.translationX;
      ty.value = startTy.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(commit)(scale.value, tx.value, ty.value);
    });

  const handleTap = useCallback(
    (sx: number, sy: number) => {
      if (!onPick) return;
      const [px, py] = toProjected(sx, sy);
      const ll = proj.invert?.([px, py]);
      if (!ll || Number.isNaN(ll[0])) return;
      const k = view.w / W;
      let best: string | null = null;
      let bestD = DOT_TOLERANCE * k;
      for (const d of dots) {
        const dist = Math.hypot(d.x - px, d.y - py);
        if (dist < bestD) {
          bestD = dist;
          best = d.id;
        }
      }
      onPick(best ?? featureAt(ll as [number, number]), ll as [number, number]);
    },
    [onPick, toProjected, proj, dots, view, W],
  );

  const tap = Gesture.Tap()
    .maxDistance(8)
    .runOnJS(true)
    .onEnd(e => handleTap(e.x, e.y));

  const gesture = Gesture.Race(Gesture.Simultaneous(pinch, pan), tap);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const zoomBy = (factor: number) => {
    const w = view.w / factor;
    const h = view.h / factor;
    setView(clampView({ x: view.x + (view.w - w) / 2, y: view.y + (view.h - h) / 2, w, h }, W, H));
  };

  // keep strokes and dots the same size on screen whatever the zoom
  const k = view.w / W;
  const pinPoint = pin ? proj(pin) : null;

  return (
    <View onLayout={onLayout} style={[styles.wrap, { height, backgroundColor: c.ocean, borderColor: c.border }]}>
      {width > 0 && (
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ width: W, height: H }, animated]}>
            <Svg width={W} height={H} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}>
              <Path d={sphere} fill={c.ocean} />
              <G>
                {ordered.map(s => {
                  const color = hl.get(s.id);
                  // same-colour stroke closes the hairline gaps between neighbours
                  const stroke = borders || color ? c.landStroke : c.land;
                  return <Path key={s.id} d={s.d} fill={color ?? c.land} stroke={stroke} strokeWidth={0.6 * k} />;
                })}
              </G>
              {dots.filter(d => borders || hl.has(d.id)).map(d => (
                <Circle
                  key={d.id}
                  cx={d.x}
                  cy={d.y}
                  r={(hl.has(d.id) ? 4 : 2.2) * k}
                  fill={hl.get(d.id) ?? c.textSecondary}
                  opacity={hl.has(d.id) ? 1 : 0.35}
                />
              ))}
              {pinPoint && <Circle cx={pinPoint[0]} cy={pinPoint[1]} r={9 * k} fill="none" stroke={pinColor ?? c.text} strokeWidth={2 * k} />}
            </Svg>
          </Animated.View>
        </GestureDetector>
      )}
      <View style={styles.zoomButtons}>
        <ZoomButton label="+" onPress={() => zoomBy(2)} />
        <ZoomButton label="−" onPress={() => zoomBy(0.5)} />
        <ZoomButton icon onPress={() => setView(v => (v.w >= W - 0.5 ? focusView : full))} />
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
