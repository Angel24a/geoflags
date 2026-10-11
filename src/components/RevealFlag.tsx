import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import { FLAGS, pixelsOf } from '@/data';
import { useTheme } from '@/theme';
import { withRootAttrs } from './Flag';

export const PW = 24;
export const PH = 16;
/** Pixel-mode grid sizes, from hardest to easiest. */
export const PIXEL_LEVELS: [number, number][] = [[3, 2], [6, 4], [8, 6], [12, 8], [24, 16]];
/** Zoom-mode crop sizes (fraction of the flag), from hardest to easiest. */
export const ZOOM_LEVELS = [0.12, 0.2, 0.32, 0.55, 1];

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buf = 0;
  let bits = 0;
  let o = 0;
  for (const ch of clean) {
    buf = (buf << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buf >> bits) & 0xff;
    }
  }
  return out;
}

/** Average the 24×16 grid down to cols×rows blocks. */
export function pixelBlocks(id: string, cols: number, rows: number): string[] {
  const px = decodeBase64(pixelsOf(id));
  const out: string[] = [];
  const bw = PW / cols;
  const bh = PH / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let R = 0, G = 0, B = 0, n = 0;
      for (let y = Math.floor(r * bh); y < Math.floor((r + 1) * bh); y++) {
        for (let x = Math.floor(c * bw); x < Math.floor((c + 1) * bw); x++) {
          const i = (y * PW + x) * 3;
          R += px[i]; G += px[i + 1]; B += px[i + 2]; n++;
        }
      }
      out.push(`rgb(${Math.round(R / n)},${Math.round(G / n)},${Math.round(B / n)})`);
    }
  }
  return out;
}

/** Grid cell (0–1 coordinates) with the most colour variation around it. */
export function focusPoint(id: string, rng: () => number = Math.random): [number, number] {
  const px = decodeBase64(pixelsOf(id));
  const at = (x: number, y: number) => {
    const i = (y * PW + x) * 3;
    return [px[i], px[i + 1], px[i + 2]];
  };
  const scored: { x: number; y: number; v: number }[] = [];
  for (let y = 1; y < PH - 1; y++) {
    for (let x = 1; x < PW - 1; x++) {
      const c0 = at(x, y);
      let v = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
        const xx = Math.min(PW - 1, Math.max(0, x + dx));
        const c1 = at(xx, y + (dy || 0));
        v += Math.abs(c0[0] - c1[0]) + Math.abs(c0[1] - c1[1]) + Math.abs(c0[2] - c1[2]);
      }
      scored.push({ x, y, v });
    }
  }
  scored.sort((a, b) => b.v - a.v);
  const top = scored.slice(0, 12);
  const p = top[Math.floor(rng() * top.length)] ?? { x: PW / 2, y: PH / 2 };
  return [(p.x + 0.5) / PW, (p.y + 0.5) / PH];
}

function PixelFlagImpl({ id, level, width, height }: { id: string; level: number; width: number; height: number }) {
  const [cols, rows] = PIXEL_LEVELS[Math.min(level, PIXEL_LEVELS.length - 1)];
  const blocks = useMemo(() => pixelBlocks(id, cols, rows), [id, cols, rows]);
  const cw = width / cols;
  const ch = height / rows;
  return (
    <Svg width={width} height={height}>
      {blocks.map((fill, i) => (
        <Rect key={i} x={(i % cols) * cw} y={Math.floor(i / cols) * ch} width={cw + 0.5} height={ch + 0.5} fill={fill} />
      ))}
    </Svg>
  );
}

function ZoomFlagImpl({ id, level, focus, width, height }: { id: string; level: number; focus: [number, number]; width: number; height: number }) {
  const xml = useMemo(() => {
    const src = FLAGS[id];
    const vb = /viewBox="([^"]+)"/.exec(src);
    if (!vb) return src;
    const [x, y, w, h] = vb[1].split(/[\s,]+/).map(Number);
    const f = ZOOM_LEVELS[Math.min(level, ZOOM_LEVELS.length - 1)];
    const cw = w * f;
    const ch = h * f;
    const cx = Math.min(Math.max(x + focus[0] * w - cw / 2, x), x + w - cw);
    const cy = Math.min(Math.max(y + focus[1] * h - ch / 2, y), y + h - ch);
    return withRootAttrs(src, { viewBox: `${cx} ${cy} ${cw} ${ch}`, preserveAspectRatio: 'none' });
  }, [id, level, focus]);
  return <SvgXml xml={xml} width={width} height={height} />;
}

export const PixelFlag = memo(PixelFlagImpl);
export const ZoomFlag = memo(ZoomFlagImpl);

export function RevealFrame({ children, width, height }: { children: React.ReactNode; width: number; height: number }) {
  const c = useTheme();
  return (
    <View style={{ width, height, borderRadius: 4, overflow: 'hidden' }}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: StyleSheet.hairlineWidth, borderColor: c.flagBorder, borderRadius: 4 }]} />
    </View>
  );
}
