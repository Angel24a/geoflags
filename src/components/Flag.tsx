import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BY_ID, FLAGS } from '@/data';
import { useApp } from '@/state/app-state';
import { useTheme } from '@/theme';

export const NORMALIZED_RATIO = 1.5;

/** Insert attributes on the root <svg> element. */
export function withRootAttrs(xml: string, attrs: Record<string, string>): string {
  return xml.replace(/<svg[^>]*>/, tag => {
    let t = tag;
    for (const [k, v] of Object.entries(attrs)) {
      t = t.replace(new RegExp(`\\s${k}="[^"]*"`), '');
      t = t.replace('<svg', `<svg ${k}="${v}"`);
    }
    return t;
  });
}

interface Props {
  id: string;
  /** Height in px. Width follows the ratio unless `width` is given. */
  height?: number;
  width?: number;
  /** Override the SVG source (used by "spot the error"). */
  xml?: string;
  style?: StyleProp<ViewStyle>;
  /** Force the 3:2 normalised ratio. */
  normalized?: boolean;
  /** Force the official ratio, whatever the setting (e.g. when the ratio is the question). */
  real?: boolean;
}

function FlagImpl({ id, height, width, xml, style, normalized, real }: Props) {
  const c = useTheme();
  const { settings } = useApp();
  const e = BY_ID.get(id);
  const useReal = real || (settings.realRatio && !normalized);
  const ratio = useReal ? e?.ratio ?? NORMALIZED_RATIO : NORMALIZED_RATIO;
  let w = width ?? (height ? height * ratio : 120);
  let h = height ?? w / ratio;
  if (width && height) {
    // fit inside the box keeping the ratio
    if (width / height > ratio) w = height * ratio;
    else h = width / ratio;
  }
  const src = xml ?? FLAGS[id];
  const content = useMemo(
    () => (src ? (useReal ? src : withRootAttrs(src, { preserveAspectRatio: 'none' })) : ''),
    [src, useReal],
  );
  return (
    <View style={[{ width: w, height: h, borderRadius: 3, overflow: 'hidden' }, style]}>
      {content ? <SvgXml xml={content} width={w} height={h} /> : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.flagBorder, borderRadius: 3 }]} />
    </View>
  );
}

export const Flag = memo(FlagImpl);
