import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/theme';

/**
 * Horizontal slider from 0 to 1, drawn with plain views and a pan gesture
 * (no extra native module). Tapping the track jumps to that point.
 */
export function Slider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const c = useTheme();
  const [width, setWidth] = useState(1);
  const set = (x: number) => onChange(Math.min(1, Math.max(0, x / width)));

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .minDistance(0)
    .onBegin(e => set(e.x))
    .onUpdate(e => set(e.x));

  const pos = value * width;
  return (
    <GestureDetector gesture={pan}>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(Math.max(1, e.nativeEvent.layout.width))} style={{ height: 44, justifyContent: 'center' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt }}>
          <View style={{ width: pos, height: 6, borderRadius: 3, backgroundColor: disabled ? c.textSecondary : c.accent }} />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: pos - 14, width: 28, height: 28, borderRadius: 14,
            backgroundColor: c.surface, borderWidth: 3, borderColor: disabled ? c.textSecondary : c.accent,
          }}
        />
      </View>
    </GestureDetector>
  );
}
