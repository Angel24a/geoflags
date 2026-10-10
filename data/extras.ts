/**
 * Extra entities that are not in the ISO 3166 base set:
 * partially recognised states, Spanish autonomous communities, historical
 * flags, peoples/cultural regions and international organisations.
 *
 * Flags are either taken from the `flag-icons` package (`flagIcon`) or
 * authored here as SVG (`svg`). Authored flags with complex emblems are
 * simplified; drop an accurate SVG into `data/flags/<id>.svg` to override.
 */
import {
  castle, circle, crescent, crown, greekCross, hammerSickle, line, lion, nordicCross, path, poly,
  rect, saltire, shield, star, starArc, starPoints, stripes, sun, svg, unionJack,
} from './svg-helpers';

export type Category =
  | 'sovereign'
  | 'limited'
  | 'territory'
  | 'spain'
  | 'historical'
  | 'cultural'
  | 'organization';

export type Continent =
  | 'europe' | 'asia' | 'africa' | 'north-america' | 'south-america' | 'oceania' | 'antarctica' | 'world';

export interface ExtraEntity {
  id: string;
  name: string;
  aliases?: string[];
  category: Category;
  continent: Continent;
  subregion?: string;
  capital?: string;
  latlng?: [number, number];
  years?: string;
  note?: string;
  /** Use a flag from the flag-icons package. */
  flagIcon?: string;
  /** Authored SVG. */
  svg?: string;
  /** Feature name in world-atlas when the territory has its own geometry. */
  geoName?: string;
  simplified?: boolean;
}

// ---------------------------------------------------------------------------
// Partially recognised / unrecognised
// ---------------------------------------------------------------------------

const abkhazia = (() => {
  const W = 600, H = 300;
  const s = H / 7;
  const cw = 250, ch = 3 * s;
  // open hand
  // open right hand, palm facing the viewer
  const finger = (x: number, y: number, h: number) => `<rect x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="#fff"/>`;
  const hand =
    `<g transform="translate(${cw / 2 - 20} ${ch / 2 - 8}) scale(1.05)">` +
    '<rect x="6" y="26" width="34" height="30" rx="8" fill="#fff"/>' +
    finger(6, 6, 30) + finger(15, 1, 34) + finger(24, 2, 33) + finger(33, 8, 27) +
    '<path d="M6,34 L-6,22 C-9,18 -4,14 0,17 L10,28 Z" fill="#fff"/>' +
    '</g>';
  return svg(W, H,
    stripes(W, H, ['#00953a', '#fff', '#00953a', '#fff', '#00953a', '#fff', '#00953a']) +
    rect(0, 0, cw, ch, '#c8102e') + hand +
    starArc(cw / 2, ch / 2 + 22, 50, 7, 200, 340, 7, '#fff'));
})();

const southOssetia = svg(600, 300, stripes(600, 300, ['#fff', '#e30a17', '#ffcc00']));

const transnistria = svg(600, 300,
  stripes(600, 300, ['#c8102e', '#00843d', '#c8102e'], 'h', [1, 1, 1]) +
  hammerSickle(40, 14, 70, '#ffd100') +
  `<polygon points="${starPoints(64, 22, 9).map(p => p.join(',')).join(' ')}" fill="none" stroke="#ffd100" stroke-width="2"/>`);

const somaliland = svg(600, 300,
  stripes(600, 300, ['#009a44', '#fff', '#c8102e']) + star(300, 150, 36, '#000'));

const northernCyprus = svg(900, 600,
  rect(0, 0, 900, 600, '#fff') + rect(0, 60, 900, 60, '#e30a17') + rect(0, 480, 900, 60, '#e30a17') +
  crescent(320, 300, 105, '#e30a17', '#fff', 28, 86) + star(470, 300, 44, '#e30a17', 5, -90));

const circassia = (() => {
  const gold = '#ffd100';
  // three arrows pointing upwards, crossing in the middle
  const arrow = (angle: number) => {
    const a = (angle * Math.PI) / 180;
    const L = 72;
    const cx = 300, cy = 290;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const tip: [number, number] = [cx + dx * L, cy + dy * L];
    const tail: [number, number] = [cx - dx * L, cy - dy * L];
    const px = -dy, py = dx;
    const head = poly([
      [tip[0] + dx * 18, tip[1] + dy * 18],
      [tip[0] + px * 11, tip[1] + py * 11],
      [tip[0] - px * 11, tip[1] - py * 11],
    ], gold);
    const fletch = poly([
      [tail[0], tail[1]], [tail[0] + px * 10 - dx * 16, tail[1] + py * 10 - dy * 16],
      [tail[0] + px * 10 + dx * 4, tail[1] + py * 10 + dy * 4], [tail[0] + dx * 14, tail[1] + dy * 14],
      [tail[0] - px * 10 + dx * 4, tail[1] - py * 10 + dy * 4], [tail[0] - px * 10 - dx * 16, tail[1] - py * 10 - dy * 16],
    ], gold);
    return line(tail[0], tail[1], tip[0], tip[1], gold, 7) + head + fletch;
  };
  return svg(600, 400,
    rect(0, 0, 600, 400, '#00843d') +
    starArc(300, 205, 150, 9, 205, 335, 15, gold) +
    star(255, 158, 15, gold) + star(300, 158, 15, gold) + star(345, 158, 15, gold) +
    arrow(-38) + arrow(0) + arrow(38));
})();

const sealand = svg(600, 400,
  poly([[0, 0], [600, 0], [0, 400]], '#c8102e') + poly([[600, 0], [600, 400], [0, 400]], '#000') +
  // white band of constant width along the diagonal
  poly([[525, 0], [600, 0], [600, 50], [75, 400], [0, 400], [0, 350]], '#fff'));

// ---------------------------------------------------------------------------
// Spanish autonomous communities
// ---------------------------------------------------------------------------

const SENYERA = (W: number, H: number) => stripes(W, H, ['#fcdd09', '#da121a', '#fcdd09', '#da121a', '#fcdd09', '#da121a', '#fcdd09', '#da121a', '#fcdd09']);

const andalucia = svg(900, 600, stripes(900, 600, ['#007a33', '#fff', '#007a33']));

const aragon = svg(900, 600,
  SENYERA(900, 600) +
  shield(130, 150, 210,
    rect(0, 0, 50, 60, '#f4c430') + circle(25, 28, 16, '#2e7d32') + rect(23, 40, 4, 16, '#6d4c41') +
    rect(50, 0, 50, 60, '#0039a6') + greekCrossAt(75, 30, 30, 6, '#fff') +
    rect(0, 60, 50, 60, '#fff') + greekCrossAt(25, 85, 50, 6, '#da121a') +
    circle(12, 72, 5, '#000') + circle(38, 72, 5, '#000') + circle(12, 100, 5, '#000') + circle(38, 100, 5, '#000') +
    rect(50, 60, 50, 60, '#fcdd09') + rect(55, 60, 7, 60, '#da121a') + rect(68, 60, 7, 60, '#da121a') + rect(81, 60, 7, 60, '#da121a') + rect(94, 60, 6, 60, '#da121a'),
    'arshield') +
  crown(150, 100, 170, '#fcdd09'), );

function greekCrossAt(cx: number, cy: number, size: number, t: number, fill: string) {
  return rect(cx - t / 2, cy - size / 2, t, size, fill) + rect(cx - size / 2, cy - t / 2, size, t, fill);
}

const asturias = svg(900, 600,
  rect(0, 0, 900, 600, '#0066cc') +
  // Cruz de la Victoria: thick arms that widen towards the ends
  path('M408,60H492L482,200L640,186V284L482,270L496,545H404L418,270L260,284V186L418,200Z', '#fcd116') +
  line(300, 284, 300, 330, '#fcd116', 5) + line(600, 284, 600, 330, '#fcd116', 5) +
  // alpha (left) and omega (right) hanging from the arms
  path('M300,330L262,430H286L294,408H306L314,430H338ZM298,388L300,376L302,388Z', '#fcd116') +
  path('M560,430H585V416A36,38 0 1 1 615,416V430H640V410H630A48,48 0 1 0 570,410H560Z', '#fcd116'));

const baleares = svg(900, 600,
  SENYERA(900, 600) + rect(0, 0, 400, 333.3, '#6c2d85') + castle(110, 70, 180, '#fff', '#6c2d85'));

const cantabria = svg(900, 600, stripes(900, 600, ['#fff', '#d40f14']));

const castillaLaMancha = svg(900, 600,
  rect(0, 0, 450, 600, '#a8102e') + rect(450, 0, 450, 600, '#fff') + castle(125, 160, 200, '#fcd116', '#0039a6'));

const castillaYLeon = svg(600, 600,
  rect(0, 0, 300, 300, '#c8102e') + rect(300, 0, 300, 300, '#fff') +
  rect(0, 300, 300, 300, '#fff') + rect(300, 300, 300, 300, '#c8102e') +
  castle(70, 60, 160, '#fcd116', '#0039a6') + castle(370, 360, 160, '#fcd116', '#0039a6') +
  lion(370, 60, 160, '#7b2f8e', '#c8102e') + lion(70, 360, 160, '#7b2f8e', '#c8102e'));

const valenciana = svg(900, 600,
  SENYERA(900, 600) + rect(0, 0, 225, 600, '#0039a6') + crown(40, 40, 145, '#fcdd09'));

const extremadura = svg(900, 600, stripes(900, 600, ['#00a650', '#fff', '#000']));

const madrid = svg(900, 600,
  rect(0, 0, 900, 600, '#c8102e') +
  [180, 360, 540, 720].map(x => star(x, 230, 45, '#fff')).join('') +
  [270, 450, 630].map(x => star(x, 370, 45, '#fff')).join(''));

const murcia = svg(900, 600,
  rect(0, 0, 900, 600, '#9b1b30') +
  castle(40, 40, 90, '#fcd116', '#9b1b30') + castle(150, 40, 90, '#fcd116', '#9b1b30') +
  castle(40, 150, 90, '#fcd116', '#9b1b30') + castle(150, 150, 90, '#fcd116', '#9b1b30') +
  [[660, 300], [560, 370], [660, 370], [760, 370], [610, 440], [710, 440], [660, 510]]
    .map(([x, y]) => crown(x - 35, y - 25, 70, '#fcd116')).join(''));

const navarra = svg(900, 600,
  rect(0, 0, 900, 600, '#d8232a') +
  shield(345, 170, 210,
    rect(0, 0, 100, 120, '#d8232a') +
    `<g fill="none" stroke="#fcd116" stroke-width="5" stroke-dasharray="7 3">` +
    `<rect x="8" y="8" width="84" height="104"/><path d="M50,8V112M8,60H92M8,8L92,112M92,8L8,112"/></g>` +
    circle(50, 60, 8, '#00843d'),
    'navshield') +
  crown(360, 100, 180, '#fcd116'));

const laRioja = svg(900, 600, stripes(900, 600, ['#d8232a', '#fff', '#00843d', '#fcd116']));

const ceuta = (() => {
  const cx = 450, cy = 300;
  const pts: [number, number][] = [[0, 0], [450, 0], [900, 0], [900, 300], [900, 600], [450, 600], [0, 600], [0, 300]];
  let body = '';
  for (let i = 0; i < 8; i++) {
    const a = pts[i], b = pts[(i + 1) % 8];
    body += poly([[cx, cy], a, b], i % 2 === 0 ? '#000' : '#fff');
  }
  return svg(900, 600, body +
    shield(390, 210, 120,
      rect(0, 0, 100, 120, '#fff') +
      [[50, 25], [25, 55], [50, 55], [75, 55], [50, 85]].map(([x, y]) => rect(x - 9, y - 11, 18, 22, '#0039a6')).join(''),
      'ceshield'));
})();

const melilla = svg(900, 600,
  rect(0, 0, 900, 600, '#4fa3db') +
  shield(385, 200, 130,
    rect(0, 0, 100, 120, '#c8102e') + castle(15, 20, 70, '#fcd116', '#c8102e'), 'meshield') +
  crown(390, 140, 120, '#fcd116'));

// ---------------------------------------------------------------------------
// Historical flags
// ---------------------------------------------------------------------------

const ussr = svg(600, 300,
  rect(0, 0, 600, 300, '#cc0000') + hammerSickle(45, 45, 80, '#ffd700') +
  `<polygon points="${starPoints(100, 40, 16).map(p => p.join(',')).join(' ')}" fill="none" stroke="#ffd700" stroke-width="3"/>`);

const yugoslavia = svg(600, 300,
  stripes(600, 300, ['#003893', '#fff', '#de0000']) + star(300, 150, 88, '#fcd116') + star(300, 150, 78, '#de0000'));

const gdr = svg(500, 300,
  stripes(500, 300, ['#000', '#dd0000', '#ffce00']) +
  circle(250, 150, 72, '#ffce00') + circle(250, 150, 60, '#dd0000') +
  // compass
  `<g stroke="#ffce00" stroke-width="7" stroke-linecap="round" fill="none"><path d="M250,105L222,195M250,105L278,195"/><path d="M226,170Q250,182 274,170"/></g>` +
  // hammer
  rect(246, 112, 8, 76, '#ffce00') + rect(226, 108, 48, 14, '#ffce00'));

const germanEmpire = svg(600, 400, stripes(600, 400, ['#000', '#fff', '#dd0000']));
const russianEmpire = svg(600, 400, stripes(600, 400, ['#000', '#ffd700', '#fff']));
const secondRepublic = svg(900, 600, stripes(900, 600, ['#c60b1e', '#ffc400', '#6c3483']));
const libya1977 = svg(600, 300, rect(0, 0, 600, 300, '#009a00'));
const uar = svg(600, 400, stripes(600, 400, ['#ce1126', '#fff', '#000']) + star(210, 200, 40, '#007a3d') + star(390, 200, 40, '#007a3d'));
const iraq1963 = svg(600, 400, stripes(600, 400, ['#ce1126', '#fff', '#000']) +
  star(170, 200, 36, '#007a3d') + star(300, 200, 36, '#007a3d') + star(430, 200, 36, '#007a3d'));
const southVietnam = svg(900, 600, stripes(900, 600, ['#ffcd00', '#ffcd00', '#da251d', '#ffcd00', '#da251d', '#ffcd00', '#da251d', '#ffcd00', '#ffcd00'], 'h', [5, 0, 1, 1, 1, 1, 1, 0, 5]));

const biafra = (() => {
  let rays = '';
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i * Math.PI) / 10;
    const x = 300 + 70 * Math.cos(a), y = 150 + 70 * Math.sin(a);
    rays += poly([[300 + 38 * Math.cos(a - 0.09), 150 + 38 * Math.sin(a - 0.09)], [x, y], [300 + 38 * Math.cos(a + 0.09), 150 + 38 * Math.sin(a + 0.09)]], '#fcd116');
  }
  return svg(600, 300, stripes(600, 300, ['#e30a17', '#000', '#009a44']) +
    `<clipPath id="bfc"><rect x="0" y="100" width="600" height="51"/></clipPath><g clip-path="url(#bfc)">${rays}${circle(300, 150, 40, '#fcd116')}</g>`);
})();

const artsakh = svg(600, 300,
  stripes(600, 300, ['#d90012', '#0033a0', '#f2a800']) +
  poly([[600, 0], [500, 0], [500, 25], [450, 25], [450, 50], [400, 50], [400, 75], [350, 75], [350, 100],
    [300, 100], [300, 200], [350, 200], [350, 225], [400, 225], [400, 250], [450, 250], [450, 275], [500, 275], [500, 300],
    [600, 300], [600, 270], [530, 270], [530, 245], [480, 245], [480, 220], [430, 220], [430, 195], [380, 195], [380, 170],
    [330, 170], [330, 130], [380, 130], [380, 105], [430, 105], [430, 80], [480, 80], [480, 55], [530, 55], [530, 30], [600, 30]], '#fff'));

const hawaii = svg(600, 300,
  stripes(600, 300, ['#fff', '#c8102e', '#012169', '#fff', '#c8102e', '#012169', '#fff', '#c8102e']) +
  unionJack('hiuj', 0, 0, 240, 150));

const texas = svg(900, 600,
  rect(0, 0, 300, 600, '#002868') + rect(300, 0, 600, 300, '#fff') + rect(300, 300, 600, 300, '#bf0a30') + star(150, 300, 95, '#fff'));

const zaire = svg(900, 600,
  rect(0, 0, 900, 600, '#00a651') + circle(450, 300, 170, '#fcd116') +
  // arm with torch
  path('M360,430L400,330L440,345L410,440Z', '#7b4a2a') +
  path('M420,330L440,240L470,250L445,340Z', '#5d3a1a') +
  path('M455,245C420,200 470,170 450,120C500,160 500,215 470,250Z', '#ce1126'));

const tanganyika = svg(900, 600,
  rect(0, 0, 900, 600, '#1eb53a') + rect(0, 240, 900, 120, '#fcd116') + rect(0, 255, 900, 90, '#000'));

const zanzibar = svg(600, 300, stripes(600, 300, ['#3a75c4', '#000', '#1eb53a']));

const manchukuo = svg(900, 600,
  rect(0, 0, 900, 600, '#fcd116') + stripes(300, 200, ['#e30a17', '#1c39bb', '#fff', '#000']));

const congoFreeState = svg(900, 600, rect(0, 0, 900, 600, '#0b3d91') + star(450, 300, 110, '#fcd116'));

const southYemen = svg(900, 600,
  stripes(900, 600, ['#ce1126', '#fff', '#000']) + poly([[0, 0], [380, 300], [0, 600]], '#3a75c4') + star(125, 300, 60, '#ce1126'));

const northYemen = svg(900, 600, stripes(900, 600, ['#ce1126', '#fff', '#000']) + star(450, 300, 70, '#007a3d'));

const serbiaMontenegro = svg(600, 300, stripes(600, 300, ['#003893', '#fff', '#de0000']));

const kingdomEgypt = svg(900, 600,
  rect(0, 0, 900, 600, '#00843d') + crescent(420, 300, 170, '#fff', '#00843d', 45, 150) +
  star(470, 220, 32, '#fff', 5, 20) + star(510, 300, 32, '#fff', 5, 0) + star(470, 380, 32, '#fff', 5, -20));

const transvaal = svg(900, 600,
  stripes(900, 600, ['#c8102e', '#fff', '#012169']) + rect(0, 0, 225, 600, '#007a3d'));

const orangeFreeState = svg(900, 600,
  stripes(900, 600, ['#fff', '#f7941d', '#fff', '#f7941d', '#fff', '#f7941d', '#fff']) +
  stripes(330, 257.1, ['#ae1c28', '#fff', '#21468b']));

const centralAmerica = svg(900, 540,
  stripes(900, 540, ['#0047ab', '#fff', '#0047ab']) +
  circle(450, 270, 75, '#fcd116') + circle(450, 270, 66, '#fff') +
  poly([[450, 215], [505, 305], [395, 305]], '#4fa3db') +
  poly([[405, 305], [430, 268], [450, 290], [470, 262], [495, 305]], '#00843d'));

const greatBritain1707 = svg(600, 300,
  rect(0, 0, 600, 300, '#012169') + saltire(600, 300, '#fff', 60) +
  greekCross(600, 300, '#fff', 100) + greekCross(600, 300, '#c8102e', 60));

const burgundyCross = (() => {
  let knots = '';
  for (const t of [0.15, 0.3, 0.42, 0.58, 0.7, 0.85]) {
    knots += circle(900 * t, 600 * t, 22, '#c60b1e') + circle(900 * (1 - t), 600 * t, 22, '#c60b1e');
  }
  return svg(900, 600, rect(0, 0, 900, 600, '#fff') + saltire(900, 600, '#c60b1e', 60) + knots);
})();

const rhodesia = svg(900, 600,
  stripes(900, 600, ['#006b3f', '#fff', '#006b3f'], 'v') +
  shield(400, 220, 100, rect(0, 0, 100, 120, '#006b3f') + rect(0, 0, 100, 30, '#fff') +
    path('M20,70L80,70L70,80L50,60L30,80Z', '#fcd116') + lion(30, 2, 26, '#c8102e'), 'rhshield') +
  lion(410, 130, 80, '#c8102e'));

const upperVolta = svg(900, 600, stripes(900, 600, ['#000', '#fff', '#ce1126']));

const unionSouthAfrica = svg(900, 600,
  stripes(900, 600, ['#ff7f00', '#fff', '#001489']) +
  `<g transform="translate(330 225)">` +
  unionJack('zauj', 0, 0, 90, 45) +
  // Orange Free State (hanging)
  `<g transform="translate(105 15) rotate(90 30 30)">${stripes(60, 45, ['#fff', '#f7941d', '#fff', '#f7941d', '#fff', '#f7941d', '#fff'])}${stripes(24, 19, ['#ae1c28', '#fff', '#21468b'])}</g>` +
  `<g transform="translate(150 0)">${stripes(90, 45, ['#c8102e', '#fff', '#012169'])}${rect(0, 0, 22, 45, '#007a3d')}</g>` +
  '</g>');

const azawad = svg(900, 600,
  stripes(900, 600, ['#00843d', '#e30a17', '#000']) + poly([[0, 0], [300, 300], [0, 600]], '#fcd116'));

// ---------------------------------------------------------------------------
// Peoples and cultural regions
// ---------------------------------------------------------------------------

const kurdistan = svg(900, 600, stripes(900, 600, ['#ed2024', '#fff', '#278e43']) + sun(450, 300, 60, 21, 50, '#febd11'));

const tibet = (() => {
  const cx = 450, cy = 330;
  let rays = '';
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a1 = (i / N) * 2 * Math.PI, a2 = ((i + 1) / N) * 2 * Math.PI;
    rays += poly([[cx, cy], [cx + 1200 * Math.cos(a1), cy + 1200 * Math.sin(a1)], [cx + 1200 * Math.cos(a2), cy + 1200 * Math.sin(a2)]], i % 2 ? '#0033a0' : '#e30a17');
  }
  return svg(900, 600,
    `<clipPath id="tbc"><rect width="900" height="600"/></clipPath><g clip-path="url(#tbc)">${rays}</g>` +
    poly([[120, 600], [450, 360], [780, 600]], '#fff') +
    sun(450, 300, 55, 16, 25, '#fcd116') +
    rect(0, 0, 900, 22, '#fcd116') + rect(0, 578, 900, 22, '#fcd116') + rect(0, 0, 22, 600, '#fcd116'));
})();

const sami = svg(900, 600,
  rect(0, 0, 900, 600, '#0035ad') + rect(0, 0, 330, 600, '#dc241f') +
  rect(330, 0, 70, 600, '#007229') + rect(400, 0, 70, 600, '#ffce00') +
  `<path d="M365,130A170,170 0 0 0 365,470" fill="none" stroke="#0035ad" stroke-width="40"/>` +
  `<path d="M365,130A170,170 0 0 1 365,470" fill="none" stroke="#dc241f" stroke-width="40"/>`);

const romani = (() => {
  let spokes = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    spokes += line(450, 300, 450 + 120 * Math.cos(a), 300 + 120 * Math.sin(a), '#e30a17', 9);
  }
  return svg(900, 600, stripes(900, 600, ['#2a5caa', '#008f39']) +
    `<circle cx="450" cy="300" r="125" fill="none" stroke="#e30a17" stroke-width="18"/>` + spokes + circle(450, 300, 22, '#e30a17'));
})();

const aboriginal = svg(600, 300, stripes(600, 300, ['#000', '#cc0000']) + circle(300, 150, 75, '#ffff00'));

const torresStrait = svg(900, 600,
  stripes(900, 600, ['#00853f', '#000', '#0051ba', '#000', '#00853f'], 'h', [8, 1, 18, 1, 8]) +
  path('M300,330C300,230 370,170 450,170C530,170 600,230 600,330L560,330C560,250 510,210 450,210C390,210 340,250 340,330Z', '#fff') +
  star(450, 330, 55, '#fff'));

const brittany = (() => {
  const s = 600 / 9;
  const ermine = (x: number, y: number) =>
    circle(x, y - 14, 6, '#000') + circle(x - 10, y - 4, 6, '#000') + circle(x + 10, y - 4, 6, '#000') +
    poly([[x, y - 4], [x - 9, y + 22], [x, y + 16], [x + 9, y + 22]], '#000');
  const spots = [
    [70, 60], [140, 60], [210, 60], [280, 60], [105, 130], [175, 130], [245, 130], [70, 200], [140, 200], [210, 200], [280, 200],
  ].map(([x, y]) => ermine(x, y)).join('');
  return svg(900, 600,
    stripes(900, 600, ['#000', '#fff', '#000', '#fff', '#000', '#fff', '#000', '#fff', '#000']) +
    rect(0, 0, 350, 5 * s, '#fff') + spots);
})();

const moorHead = (x: number, y: number, size: number, flip = false) =>
  `<g transform="translate(${x} ${y}) scale(${(flip ? -1 : 1) * size / 100} ${size / 100})${flip ? ' translate(-100 0)' : ''}">` +
  path('M60,10C30,8 20,30 22,48L12,60L22,64L20,72L26,78C26,88 34,92 46,90L48,100H78C80,80 90,60 84,36C80,18 72,10 60,10Z', '#000') +
  path('M22,36C40,30 70,30 86,38L84,48C66,42 42,42 24,46Z', '#fff') + '</g>';

const corsica = svg(900, 600, rect(0, 0, 900, 600, '#fff') + moorHead(330, 140, 280));

const sardinia = svg(900, 600,
  rect(0, 0, 900, 600, '#fff') + greekCross(900, 600, '#d8232a', 90) +
  moorHead(110, 50, 180, true) + moorHead(610, 50, 180, true) + moorHead(110, 370, 180, true) + moorHead(610, 370, 180, true));

const frisia = (() => {
  let body = rect(0, 0, 900, 600, '#fff');
  const heart = (x: number, y: number) =>
    path(`M${x},${y + 22}C${x - 30},${y} ${x - 22},${y - 22} ${x},${y - 10}C${x + 22},${y - 22} ${x + 30},${y} ${x},${y + 22}Z`, '#d8232a');
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) {
      body += poly([[i * 900 / 7 * 2 - 600, 0], [(i + 1) * 900 / 7 * 2 - 600, 0], [(i + 1) * 900 / 7 * 2, 600], [i * 900 / 7 * 2, 600]], '#1d5aa6');
    }
  }
  body = `<clipPath id="frc"><rect width="900" height="600"/></clipPath><g clip-path="url(#frc)">${body}</g>`;
  // hearts (pompeblêden) only on the white stripes
  const hearts: [number, number][] = [];
  for (const k of [1, 3, 5]) {
    for (const t of [0.2, 0.5, 0.8]) {
      const y = 600 * t;
      const x = ((k + 0.5) * 900 / 7) * 2 - 600 + y; // centre line of stripe k
      if (x > 30 && x < 870) hearts.push([x, y]);
    }
  }
  return svg(900, 600, body + hearts.map(([x, y]) => heart(x, y)).join(''));
})();

const occitania = (() => {
  const c = '#fcd116';
  const cx = 450, cy = 300;
  let cross = '';
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ex = cx + dx * 200, ey = cy + dy * 200;
    const px = dy, py = dx; // perpendicular
    cross += poly([[cx + px * 20, cy + py * 20], [ex + px * 60, ey + py * 60], [ex - px * 60, ey - py * 60], [cx - px * 20, cy - py * 20]], c);
    for (const k of [-60, 0, 60]) cross += circle(ex + px * k + dx * 18, ey + py * k + dy * 18, 16, c);
  }
  return svg(900, 600, rect(0, 0, 900, 600, '#d8232a') + cross + star(110, 100, 55, c, 7));
})();

const scania = svg(800, 500, rect(0, 0, 800, 500, '#d8232a') + nordicCross(800, 500, '#fcd116', 280, 80));
const cornwall = svg(1000, 600, rect(0, 0, 1000, 600, '#000') + greekCross(1000, 600, '#fff', 120));

const assyria = (() => {
  const cx = 450, cy = 300;
  // three wavy rivers (blue, white, red) from the centre to each corner
  let rivers = '';
  for (const [x, y] of [[0, 0], [900, 0], [0, 600], [900, 600]]) {
    const dx = x - cx, dy = y - cy;
    const len = Math.hypot(dx, dy);
    const px = -dy / len, py = dx / len;
    [[-26, '#0e2c8e'], [26, '#c8102e']].forEach(([off, col]) => {
      const o = off as number;
      const pts: string[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const w = Math.sin(t * Math.PI * 5) * 14;
        pts.push(`${(cx + dx * t + px * (o + w)).toFixed(1)},${(cy + dy * t + py * (o + w)).toFixed(1)}`);
      }
      rivers += `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="26"/>`;
    });
  }
  return svg(900, 600,
    rect(0, 0, 900, 600, '#fff') + `<clipPath id="asc"><rect width="900" height="600"/></clipPath><g clip-path="url(#asc)">${rivers}</g>` +
    poly(starPoints(cx, cy, 150, 4, 0, 0.3), '#5b9bd5') + circle(cx, cy, 62, '#fcd116'));
})();

const amazigh = svg(900, 600,
  stripes(900, 600, ['#0072c6', '#3a9e44', '#fcd116']) +
  `<g fill="none" stroke="#e30a17" stroke-width="34" stroke-linecap="round">` +
  '<path d="M450,90V510"/><path d="M340,110Q340,250 450,250Q560,250 560,110"/><path d="M340,490Q340,350 450,350Q560,350 560,490"/></g>');

const maori = svg(900, 450,
  rect(0, 0, 900, 225, '#000') + rect(0, 225, 900, 225, '#d8232a') +
  '<path d="M900,225H340C200,225 200,90 310,90C390,90 390,190 320,190C280,190 275,140 305,140" fill="none" stroke="#fff" stroke-width="22"/>');

const eastTurkestan = svg(900, 600,
  rect(0, 0, 900, 600, '#65acd8') + crescent(300, 300, 150, '#fff', '#65acd8', 40, 125) + star(390, 300, 70, '#fff', 5, -90));

const wiphala = (() => {
  const cols = ['#e30a17', '#f58220', '#fcd116', '#fff', '#3a9e44', '#0072c6', '#6c3483'];
  let body = '';
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) body += rect(c * 100, r * 100, 100.5, 100.5, cols[(r + c + 4) % 7]);
  return svg(700, 700, body);
})();

const panAfrican = svg(900, 600, stripes(900, 600, ['#e30a17', '#000', '#008a3e']));
const acadia = svg(900, 600, stripes(900, 600, ['#002395', '#fff', '#ed2939'], 'v') + star(150, 150, 70, '#fcd116'));
const sorbs = svg(900, 600, stripes(900, 600, ['#0b3d91', '#d8232a', '#fff']));
const flanders = svg(900, 600, rect(0, 0, 900, 600, '#fcd116') + lion(270, 90, 420, '#000', '#d8232a'));
const esperanto = svg(900, 600, rect(0, 0, 900, 600, '#009900') + rect(0, 0, 300, 300, '#fff') + star(150, 150, 110, '#009900'));

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

const nato = svg(800, 600,
  rect(0, 0, 800, 600, '#004990') +
  `<circle cx="400" cy="300" r="110" fill="none" stroke="#fff" stroke-width="12"/>` +
  line(400, 80, 400, 170, '#fff', 8) + line(400, 430, 400, 520, '#fff', 8) +
  line(180, 300, 270, 300, '#fff', 8) + line(530, 300, 620, 300, '#fff', 8) +
  poly([[400, 190], [425, 300], [400, 300]], '#fff') + poly([[400, 190], [375, 300], [400, 300]], '#cfd8e3') +
  poly([[510, 300], [400, 325], [400, 300]], '#fff') + poly([[510, 300], [400, 275], [400, 300]], '#cfd8e3') +
  poly([[400, 410], [375, 300], [400, 300]], '#fff') + poly([[400, 410], [425, 300], [400, 300]], '#cfd8e3') +
  poly([[290, 300], [400, 275], [400, 300]], '#fff') + poly([[290, 300], [400, 325], [400, 300]], '#cfd8e3'));

const olympic = svg(900, 600,
  rect(0, 0, 900, 600, '#fff') +
  `<g fill="none" stroke-width="18">` +
  `<circle cx="270" cy="260" r="90" stroke="#0081c8"/><circle cx="450" cy="260" r="90" stroke="#000"/><circle cx="630" cy="260" r="90" stroke="#ee334e"/>` +
  `<circle cx="360" cy="350" r="90" stroke="#fcb131"/><circle cx="540" cy="350" r="90" stroke="#00a651"/></g>`);

const paralympic = svg(900, 600,
  rect(0, 0, 900, 600, '#fff') +
  path('M250,380C250,260 330,200 400,200C350,240 320,300 330,380Z', '#d8232a') +
  path('M420,380C420,260 500,200 570,200C520,240 490,300 500,380Z', '#0081c8') +
  path('M590,380C590,260 670,200 740,200C690,240 660,300 670,380Z', '#00a651'));

const redCross = svg(900, 600, rect(0, 0, 900, 600, '#fff') + greekCrossAt(450, 300, 360, 120, '#ed1b2e'));
const redCrescent = svg(900, 600, rect(0, 0, 900, 600, '#fff') + crescent(420, 300, 180, '#ed1b2e', '#fff', 70, 160));
const redCrystal = svg(900, 600, rect(0, 0, 900, 600, '#fff') +
  poly([[450, 90], [660, 300], [450, 510], [240, 300]], '#ed1b2e') + poly([[450, 170], [580, 300], [450, 430], [320, 300]], '#fff'));

// ---------------------------------------------------------------------------
// Base-set overrides (flags that changed after the upstream snapshot)
// ---------------------------------------------------------------------------

export const BASE_FLAG_OVERRIDES: Record<string, string> = {
  // Martinique: flag adopted by the territorial collectivity in 2023.
  mq: svg(900, 600, stripes(900, 600, ['#00a650', '#231f1e']) + poly([[0, 0], [450, 300], [0, 600]], '#ef1923')),
  sy: svg(900, 600, stripes(900, 600, ['#007a3d', '#fff', '#000']) +
    star(270, 300, 55, '#ce1126') + star(450, 300, 55, '#ce1126') + star(630, 300, 55, '#ce1126')),
};

// ---------------------------------------------------------------------------

export const EXTRAS: ExtraEntity[] = [
  // Limited recognition / unrecognised
  { id: 'abkhazia', name: 'Abjasia', category: 'limited', continent: 'asia', subregion: 'Western Asia', capital: 'Sujumi', latlng: [43.0, 41.0], svg: abkhazia, simplified: true },
  { id: 'south-ossetia', name: 'Osetia del Sur', category: 'limited', continent: 'asia', subregion: 'Western Asia', capital: 'Tsjinvali', latlng: [42.3, 44.0], svg: southOssetia },
  { id: 'transnistria', name: 'Transnistria', category: 'limited', continent: 'europe', subregion: 'Eastern Europe', capital: 'Tiráspol', latlng: [47.2, 29.4], svg: transnistria, simplified: true },
  { id: 'somaliland', name: 'Somalilandia', category: 'limited', continent: 'africa', subregion: 'Eastern Africa', capital: 'Hargeisa', latlng: [9.6, 46.0], svg: somaliland, geoName: 'Somaliland', simplified: true, note: 'La franja verde lleva la shahada en blanco (omitida en esta versión).' },
  { id: 'northern-cyprus', name: 'Chipre del Norte', category: 'limited', continent: 'asia', subregion: 'Western Asia', capital: 'Nicosia del Norte', latlng: [35.25, 33.6], svg: northernCyprus, geoName: 'N. Cyprus' },
  { id: 'circassia', name: 'Circasia', category: 'limited', continent: 'europe', subregion: 'Eastern Europe', latlng: [44.6, 40.1], svg: circassia, simplified: true, note: 'Bandera nacional del pueblo circasiano (adigué).' },
  { id: 'sealand', name: 'Sealand', category: 'limited', continent: 'europe', subregion: 'Northern Europe', latlng: [51.9, 1.48], svg: sealand, note: 'Micronación en una plataforma marítima frente a Inglaterra.' },

  // Spain
  { id: 'es-an', name: 'Andalucía', category: 'spain', continent: 'europe', capital: 'Sevilla', latlng: [37.4, -5.0], svg: andalucia, simplified: true },
  { id: 'es-ar', name: 'Aragón', category: 'spain', continent: 'europe', capital: 'Zaragoza', latlng: [41.6, -0.9], svg: aragon, simplified: true },
  { id: 'es-as', name: 'Asturias', category: 'spain', continent: 'europe', capital: 'Oviedo', latlng: [43.3, -5.9], svg: asturias, simplified: true },
  { id: 'es-ib', name: 'Islas Baleares', aliases: ['Baleares'], category: 'spain', continent: 'europe', capital: 'Palma', latlng: [39.6, 2.9], svg: baleares, simplified: true },
  { id: 'es-cn', name: 'Canarias', aliases: ['Islas Canarias'], category: 'spain', continent: 'africa', capital: 'Santa Cruz de Tenerife y Las Palmas de Gran Canaria', latlng: [28.3, -15.8], flagIcon: 'ic' },
  { id: 'es-cb', name: 'Cantabria', category: 'spain', continent: 'europe', capital: 'Santander', latlng: [43.2, -4.0], svg: cantabria },
  { id: 'es-cm', name: 'Castilla-La Mancha', category: 'spain', continent: 'europe', capital: 'Toledo', latlng: [39.6, -3.0], svg: castillaLaMancha, simplified: true },
  { id: 'es-cl', name: 'Castilla y León', category: 'spain', continent: 'europe', capital: 'Valladolid', latlng: [41.8, -4.7], svg: castillaYLeon, simplified: true },
  { id: 'es-ct', name: 'Cataluña', category: 'spain', continent: 'europe', capital: 'Barcelona', latlng: [41.8, 1.5], flagIcon: 'es-ct' },
  { id: 'es-vc', name: 'Comunidad Valenciana', category: 'spain', continent: 'europe', capital: 'Valencia', latlng: [39.4, -0.6], svg: valenciana, simplified: true },
  { id: 'es-ex', name: 'Extremadura', category: 'spain', continent: 'europe', capital: 'Mérida', latlng: [39.2, -6.1], svg: extremadura },
  { id: 'es-ga', name: 'Galicia', category: 'spain', continent: 'europe', capital: 'Santiago de Compostela', latlng: [42.8, -8.0], flagIcon: 'es-ga' },
  { id: 'es-md', name: 'Comunidad de Madrid', aliases: ['Madrid'], category: 'spain', continent: 'europe', capital: 'Madrid', latlng: [40.4, -3.7], svg: madrid },
  { id: 'es-mc', name: 'Región de Murcia', aliases: ['Murcia'], category: 'spain', continent: 'europe', capital: 'Murcia', latlng: [38.0, -1.5], svg: murcia, simplified: true },
  { id: 'es-nc', name: 'Navarra', category: 'spain', continent: 'europe', capital: 'Pamplona', latlng: [42.7, -1.6], svg: navarra, simplified: true },
  { id: 'es-ri', name: 'La Rioja', category: 'spain', continent: 'europe', capital: 'Logroño', latlng: [42.3, -2.5], svg: laRioja, simplified: true },
  { id: 'es-pv', name: 'País Vasco', aliases: ['Euskadi'], category: 'spain', continent: 'europe', capital: 'Vitoria-Gasteiz', latlng: [43.0, -2.6], flagIcon: 'es-pv' },
  { id: 'es-ce', name: 'Ceuta', category: 'spain', continent: 'africa', capital: 'Ceuta', latlng: [35.89, -5.32], svg: ceuta, simplified: true },
  { id: 'es-ml', name: 'Melilla', category: 'spain', continent: 'africa', capital: 'Melilla', latlng: [35.29, -2.94], svg: melilla, simplified: true },

  // Historical
  { id: 'ussr', name: 'Unión Soviética', aliases: ['URSS'], category: 'historical', continent: 'europe', capital: 'Moscú', years: '1922–1991', latlng: [55.75, 37.6], svg: ussr },
  { id: 'yugoslavia', name: 'Yugoslavia', category: 'historical', continent: 'europe', capital: 'Belgrado', years: '1945–1992', latlng: [44.8, 20.5], svg: yugoslavia },
  { id: 'gdr', name: 'Alemania Oriental', aliases: ['RDA'], category: 'historical', continent: 'europe', capital: 'Berlín Este', years: '1949–1990', latlng: [52.5, 13.4], svg: gdr, simplified: true },
  { id: 'german-empire', name: 'Imperio alemán', category: 'historical', continent: 'europe', capital: 'Berlín', years: '1871–1918', latlng: [52.5, 13.4], svg: germanEmpire },
  { id: 'russian-empire', name: 'Imperio ruso', category: 'historical', continent: 'europe', capital: 'San Petersburgo', years: '1858–1883', latlng: [59.9, 30.3], svg: russianEmpire },
  { id: 'second-spanish-republic', name: 'Segunda República Española', category: 'historical', continent: 'europe', capital: 'Madrid', years: '1931–1939', latlng: [40.4, -3.7], svg: secondRepublic, simplified: true },
  { id: 'libya-1977', name: 'Libia (Yamahiriya)', category: 'historical', continent: 'africa', capital: 'Trípoli', years: '1977–2011', latlng: [32.9, 13.2], svg: libya1977, note: 'La única bandera nacional moderna de un solo color.' },
  { id: 'uar', name: 'República Árabe Unida', aliases: ['Siria (1980–2024)'], category: 'historical', continent: 'africa', capital: 'El Cairo', years: '1958–1971', latlng: [30.0, 31.2], svg: uar, note: 'Siria usó este mismo diseño entre 1980 y 2024.' },
  { id: 'iraq-1963', name: 'Irak (1963–1991)', category: 'historical', continent: 'asia', capital: 'Bagdad', years: '1963–1991', latlng: [33.3, 44.4], svg: iraq1963 },
  { id: 'south-vietnam', name: 'Vietnam del Sur', category: 'historical', continent: 'asia', capital: 'Saigón', years: '1955–1975', latlng: [10.8, 106.7], svg: southVietnam },
  { id: 'biafra', name: 'Biafra', category: 'historical', continent: 'africa', capital: 'Enugu', years: '1967–1970', latlng: [6.4, 7.5], svg: biafra },
  { id: 'artsakh', name: 'Artsaj', aliases: ['Alto Karabaj', 'Nagorno-Karabaj'], category: 'historical', continent: 'asia', capital: 'Stepanakert', years: '1991–2023', latlng: [39.8, 46.75], svg: artsakh },
  { id: 'kingdom-of-hawaii', name: 'Reino de Hawái', category: 'historical', continent: 'oceania', capital: 'Honolulu', years: '1845–1893', latlng: [21.3, -157.86], svg: hawaii },
  { id: 'republic-of-texas', name: 'República de Texas', category: 'historical', continent: 'north-america', capital: 'Austin', years: '1839–1845', latlng: [30.27, -97.74], svg: texas },
  { id: 'zaire', name: 'Zaire', category: 'historical', continent: 'africa', capital: 'Kinsasa', years: '1971–1997', latlng: [-4.3, 15.3], svg: zaire, simplified: true },
  { id: 'tanganyika', name: 'Tanganica', category: 'historical', continent: 'africa', capital: 'Dar es-Salaam', years: '1961–1964', latlng: [-6.8, 39.3], svg: tanganyika },
  { id: 'zanzibar', name: 'Zanzíbar', category: 'historical', continent: 'africa', capital: 'Zanzíbar', years: '1964', latlng: [-6.16, 39.2], svg: zanzibar },
  { id: 'manchukuo', name: 'Manchukuo', category: 'historical', continent: 'asia', capital: 'Hsinking', years: '1932–1945', latlng: [43.9, 125.3], svg: manchukuo },
  { id: 'congo-free-state', name: 'Estado Libre del Congo', category: 'historical', continent: 'africa', capital: 'Boma', years: '1885–1908', latlng: [-5.85, 13.05], svg: congoFreeState },
  { id: 'south-yemen', name: 'Yemen del Sur', category: 'historical', continent: 'asia', capital: 'Adén', years: '1967–1990', latlng: [12.8, 45.0], svg: southYemen },
  { id: 'north-yemen', name: 'Yemen del Norte', category: 'historical', continent: 'asia', capital: 'Saná', years: '1962–1990', latlng: [15.35, 44.2], svg: northYemen },
  { id: 'serbia-montenegro', name: 'Serbia y Montenegro', category: 'historical', continent: 'europe', capital: 'Belgrado', years: '1992–2006', latlng: [44.8, 20.5], svg: serbiaMontenegro },
  { id: 'kingdom-of-egypt', name: 'Reino de Egipto', category: 'historical', continent: 'africa', capital: 'El Cairo', years: '1922–1953', latlng: [30.0, 31.2], svg: kingdomEgypt },
  { id: 'transvaal', name: 'Transvaal', aliases: ['República Sudafricana (Transvaal)'], category: 'historical', continent: 'africa', capital: 'Pretoria', years: '1857–1902', latlng: [-25.75, 28.2], svg: transvaal },
  { id: 'orange-free-state', name: 'Estado Libre de Orange', category: 'historical', continent: 'africa', capital: 'Bloemfontein', years: '1854–1902', latlng: [-29.1, 26.2], svg: orangeFreeState },
  { id: 'central-america', name: 'Provincias Unidas del Centro de América', aliases: ['República Federal de Centroamérica'], category: 'historical', continent: 'north-america', capital: 'Ciudad de Guatemala', years: '1823–1841', latlng: [14.6, -90.5], svg: centralAmerica, simplified: true },
  { id: 'great-britain-1707', name: 'Reino de Gran Bretaña', category: 'historical', continent: 'europe', capital: 'Londres', years: '1707–1801', latlng: [51.5, -0.12], svg: greatBritain1707 },
  { id: 'burgundy-cross', name: 'Cruz de Borgoña (Imperio español)', category: 'historical', continent: 'europe', years: '1506–1785', latlng: [40.4, -3.7], svg: burgundyCross, simplified: true },
  { id: 'rhodesia', name: 'Rodesia', category: 'historical', continent: 'africa', capital: 'Salisbury', years: '1968–1979', latlng: [-17.8, 31.05], svg: rhodesia, simplified: true },
  { id: 'upper-volta', name: 'Alto Volta', category: 'historical', continent: 'africa', capital: 'Uagadugú', years: '1959–1984', latlng: [12.37, -1.52], svg: upperVolta },
  { id: 'union-of-south-africa', name: 'Unión Sudafricana', category: 'historical', continent: 'africa', capital: 'Pretoria', years: '1928–1994', latlng: [-25.75, 28.2], svg: unionSouthAfrica },
  { id: 'azawad', name: 'Azawad', category: 'historical', continent: 'africa', capital: 'Gao', years: '2012–2013', latlng: [16.3, -0.05], svg: azawad },

  // Peoples and cultural regions
  { id: 'kurdistan', name: 'Kurdistán', category: 'cultural', continent: 'asia', latlng: [36.2, 44.0], svg: kurdistan },
  { id: 'tibet', name: 'Tíbet', category: 'cultural', continent: 'asia', latlng: [29.65, 91.1], svg: tibet, simplified: true },
  { id: 'sami', name: 'Pueblo sami', aliases: ['Laponia', 'Sápmi'], category: 'cultural', continent: 'europe', latlng: [68.5, 23.0], svg: sami },
  { id: 'romani', name: 'Pueblo gitano', aliases: ['Romaní'], category: 'cultural', continent: 'world', svg: romani },
  { id: 'aboriginal', name: 'Aborígenes australianos', category: 'cultural', continent: 'oceania', latlng: [-23.7, 133.9], svg: aboriginal },
  { id: 'torres-strait', name: 'Isleños del Estrecho de Torres', category: 'cultural', continent: 'oceania', latlng: [-10.6, 142.2], svg: torresStrait, simplified: true },
  { id: 'brittany', name: 'Bretaña', category: 'cultural', continent: 'europe', latlng: [48.2, -2.9], svg: brittany },
  { id: 'corsica', name: 'Córcega', category: 'cultural', continent: 'europe', latlng: [42.1, 9.1], svg: corsica, simplified: true },
  { id: 'sardinia', name: 'Cerdeña', category: 'cultural', continent: 'europe', latlng: [40.1, 9.0], svg: sardinia, simplified: true },
  { id: 'frisia', name: 'Frisia', category: 'cultural', continent: 'europe', latlng: [53.1, 5.8], svg: frisia, simplified: true },
  { id: 'occitania', name: 'Occitania', category: 'cultural', continent: 'europe', latlng: [43.6, 1.4], svg: occitania, simplified: true },
  { id: 'scania', name: 'Escania', category: 'cultural', continent: 'europe', latlng: [55.9, 13.5], svg: scania },
  { id: 'cornwall', name: 'Cornualles', category: 'cultural', continent: 'europe', latlng: [50.4, -4.9], svg: cornwall },
  { id: 'assyria', name: 'Pueblo asirio', category: 'cultural', continent: 'asia', latlng: [36.3, 43.1], svg: assyria, simplified: true },
  { id: 'amazigh', name: 'Pueblo amazigh', aliases: ['Bereber'], category: 'cultural', continent: 'africa', latlng: [31.0, 0.0], svg: amazigh },
  { id: 'maori', name: 'Pueblo maorí', aliases: ['Tino Rangatiratanga'], category: 'cultural', continent: 'oceania', latlng: [-38.1, 176.2], svg: maori, simplified: true },
  { id: 'east-turkestan', name: 'Turquestán Oriental', aliases: ['Uigures'], category: 'cultural', continent: 'asia', latlng: [41.0, 85.0], svg: eastTurkestan },
  { id: 'wiphala', name: 'Wiphala', aliases: ['Pueblos andinos'], category: 'cultural', continent: 'south-america', latlng: [-16.5, -68.15], svg: wiphala },
  { id: 'pan-african', name: 'Panafricanismo', category: 'cultural', continent: 'world', svg: panAfrican },
  { id: 'acadia', name: 'Acadia', category: 'cultural', continent: 'north-america', latlng: [46.5, -64.8], svg: acadia },
  { id: 'sorbs', name: 'Sorabos', category: 'cultural', continent: 'europe', latlng: [51.2, 14.4], svg: sorbs },
  { id: 'flanders', name: 'Flandes', category: 'cultural', continent: 'europe', latlng: [51.0, 3.7], svg: flanders, simplified: true },
  { id: 'esperanto', name: 'Esperanto', category: 'cultural', continent: 'world', svg: esperanto },

  // Organisations
  { id: 'eu', name: 'Unión Europea', category: 'organization', continent: 'europe', flagIcon: 'eu' },
  { id: 'un', name: 'Naciones Unidas', aliases: ['ONU'], category: 'organization', continent: 'world', flagIcon: 'un' },
  { id: 'arab-league', name: 'Liga Árabe', category: 'organization', continent: 'world', flagIcon: 'arab' },
  { id: 'asean', name: 'ASEAN', category: 'organization', continent: 'asia', flagIcon: 'asean' },
  { id: 'eac', name: 'Comunidad de África Oriental', category: 'organization', continent: 'africa', flagIcon: 'eac' },
  { id: 'pacific-community', name: 'Comunidad del Pacífico', category: 'organization', continent: 'oceania', flagIcon: 'pc' },
  { id: 'cefta', name: 'CEFTA', category: 'organization', continent: 'europe', flagIcon: 'cefta' },
  { id: 'nato', name: 'OTAN', category: 'organization', continent: 'world', svg: nato },
  { id: 'olympic', name: 'Juegos Olímpicos', category: 'organization', continent: 'world', svg: olympic },
  { id: 'paralympic', name: 'Juegos Paralímpicos', category: 'organization', continent: 'world', svg: paralympic, simplified: true },
  { id: 'red-cross', name: 'Cruz Roja', category: 'organization', continent: 'world', svg: redCross },
  { id: 'red-crescent', name: 'Media Luna Roja', category: 'organization', continent: 'world', svg: redCrescent },
  { id: 'red-crystal', name: 'Cristal Rojo', category: 'organization', continent: 'world', svg: redCrystal },
];
