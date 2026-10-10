import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { shapePath } from '@/lib/geo';
import { useTheme } from '@/theme';

/** Silhouette of a territory. */
function ShapeViewImpl({ id, size = 160, color }: { id: string; size?: number; color?: string }) {
  const c = useTheme();
  const d = useMemo(() => shapePath(id, size, size, 6), [id, size]);
  return (
    <View style={{ width: size, height: size }}>
      {d ? (
        <Svg width={size} height={size}>
          <Path d={d} fill={color ?? c.text} />
        </Svg>
      ) : null}
    </View>
  );
}

export const ShapeView = memo(ShapeViewImpl);
