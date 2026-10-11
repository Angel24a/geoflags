/**
 * Draws the app icon (a minimal globe in black and dark purple) and writes
 * every PNG the app config uses. Run with: npx tsx scripts/build-icons.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'assets/images');

export const INK = '#0B0A10';
export const PURPLE = '#5B21B6';
const PURPLE_DEEP = '#3B0F7A';

/** Globe of radius r centred in a size×size canvas. `cut` draws the grid as holes (monochrome icon). */
function globe(size: number, r: number, fill: string, line: string, cut = false): string {
  const c = size / 2;
  const w = r * 0.075;
  const id = `g${Math.round(r)}`;
  const grid = [
    `<ellipse cx="${c}" cy="${c}" rx="${r * 0.42}" ry="${r}" fill="none" stroke="${line}" stroke-width="${w}"/>`,
    `<line x1="${c}" y1="${c - r}" x2="${c}" y2="${c + r}" stroke="${line}" stroke-width="${w}"/>`,
    `<line x1="${c - r}" y1="${c}" x2="${c + r}" y2="${c}" stroke="${line}" stroke-width="${w}"/>`,
    // parallels bend towards the poles, as seen on a sphere
    ...[-0.5, 0.5].map(k => {
      const y = c + k * r;
      const x = Math.sqrt(r * r - (k * r) ** 2) + w;
      return `<path d="M${c - x},${y} Q${c},${y + k * r * 0.28} ${c + x},${y}" fill="none" stroke="${line}" stroke-width="${w}"/>`;
    }),
  ].join('');
  if (cut) {
    // white globe with the grid cut out, for Android themed icons
    return `<defs><mask id="${id}m"><rect width="${size}" height="${size}" fill="#fff"/>${grid.replaceAll(line, '#000')}</mask></defs>` +
      `<circle cx="${c}" cy="${c}" r="${r}" fill="${fill}" mask="url(#${id}m)"/>`;
  }
  return `<defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${fill}"/><stop offset="1" stop-color="${PURPLE_DEEP}"/>
      </linearGradient>
      <clipPath id="${id}c"><circle cx="${c}" cy="${c}" r="${r}"/></clipPath>
    </defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id})"/>
    <g clip-path="url(#${id}c)">${grid}</g>`;
}

const svg = (size: number, body: string, bg?: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  (bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '') + body + '</svg>';

function png(file: string, svgText: string) {
  fs.writeFileSync(path.join(IMAGES, file), new Resvg(svgText).render().asPng());
  console.log(file);
}

// Legacy / store icon: full square, the launcher rounds it.
png('icon.png', svg(1024, globe(1024, 330, PURPLE, INK), INK));
// Adaptive icon: the foreground must fit the 66% safe zone of a 108dp canvas.
png('android-icon-foreground.png', svg(1024, globe(1024, 250, PURPLE, INK)));
png('android-icon-background.png', svg(1024, '', INK));
png('android-icon-monochrome.png', svg(1024, globe(1024, 250, '#fff', '#000', true)));
png('splash-icon.png', svg(512, globe(512, 230, PURPLE, INK)));
png('favicon.png', svg(48, globe(48, 21, PURPLE, INK), INK));
fs.writeFileSync(path.join(ROOT, 'assets/logo/logo.svg'), svg(1024, globe(1024, 330, PURPLE, INK), INK));
