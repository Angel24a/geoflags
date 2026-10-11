/**
 * Population for entities without World Bank data (data/population.json):
 * territories, Spanish autonomous communities, UK nations, unrecognised
 * states, cultural regions, peoples and historical states.
 *
 * Figures are rounded official censuses or estimates for the year given.
 * `people` marks an estimate of the members of a people (not the population
 * of a territory); `0` means no permanent population.
 */
export interface PopulationFact {
  n: number;
  year?: number;
  people?: boolean;
}

const p = (n: number, year?: number): PopulationFact => ({ n, year });
const people = (n: number, year?: number): PopulationFact => ({ n, year, people: true });
const NONE: PopulationFact = { n: 0 };

export const POPULATION_EXTRA: Record<string, PopulationFact> = {
  // Territories
  ai: p(15_900, 2023),
  bq: p(29_400, 2023),
  gp: p(378_000, 2024),
  gf: p(295_000, 2024),
  mq: p(350_000, 2024),
  yt: p(321_000, 2024),
  re: p(885_000, 2024),
  bl: p(10_600, 2021),
  pm: p(5_800, 2021),
  wf: p(11_200, 2023),
  gg: p(64_500, 2023),
  je: p(103_300, 2021),
  ax: p(30_500, 2023),
  sj: p(2_500, 2023),
  cx: p(1_700, 2021),
  cc: p(600, 2021),
  nf: p(2_200, 2021),
  ck: p(15_000, 2021),
  nu: p(1_700, 2022),
  tk: p(1_650, 2019),
  fk: p(3_700, 2021),
  pn: p(35, 2023),
  ms: p(4_400, 2022),
  sh: p(5_500, 2021),
  va: p(800, 2023),
  tw: p(23_400_000, 2024),
  eh: p(590_000, 2023),
  aq: NONE,
  bv: NONE,
  hm: NONE,
  gs: NONE,
  tf: NONE,
  um: NONE,
  io: NONE,
  // United Kingdom
  'gb-eng': p(57_700_000, 2023),
  'gb-sct': p(5_490_000, 2023),
  'gb-wls': p(3_160_000, 2023),
  'gb-nir': p(1_920_000, 2023),
  // Spain (INE, 1 January)
  'es-an': p(8_584_000, 2024),
  'es-ar': p(1_352_000, 2024),
  'es-as': p(1_010_000, 2024),
  'es-ib': p(1_210_000, 2024),
  'es-cn': p(2_239_000, 2024),
  'es-cb': p(591_000, 2024),
  'es-cl': p(2_392_000, 2024),
  'es-cm': p(2_084_000, 2024),
  'es-ct': p(8_012_000, 2024),
  'es-vc': p(5_319_000, 2024),
  'es-ex': p(1_053_000, 2024),
  'es-ga': p(2_699_000, 2024),
  'es-md': p(7_009_000, 2024),
  'es-mc': p(1_568_000, 2024),
  'es-nc': p(678_000, 2024),
  'es-pv': p(2_228_000, 2024),
  'es-ri': p(324_000, 2024),
  'es-ce': p(83_000, 2024),
  'es-ml': p(86_000, 2024),
  // Unrecognised
  abkhazia: p(245_000, 2022),
  'south-ossetia': p(56_500, 2022),
  transnistria: p(360_000, 2024),
  somaliland: p(5_700_000, 2024),
  'northern-cyprus': p(383_000, 2021),
  ichkeria: p(1_510_000, 2021),
  // Cultural regions
  brittany: p(3_400_000, 2021),
  corsica: p(351_000, 2021),
  sardinia: p(1_568_000, 2024),
  flanders: p(6_820_000, 2024),
  scania: p(1_420_000, 2023),
  cornwall: p(570_000, 2021),
  // Peoples (estimates)
  kurdistan: people(35_000_000),
  tibet: people(7_100_000, 2020),
  'east-turkestan': people(11_800_000, 2020),
  sami: people(80_000),
  romani: people(12_000_000),
  aboriginal: people(760_000, 2021),
  'torres-strait': people(70_000, 2021),
  maori: people(890_000, 2023),
  assyria: people(3_000_000),
  amazigh: people(36_000_000),
  sorbs: people(60_000),
  acadia: people(96_000, 2016),
  circassia: people(4_000_000),
  // Historical (census of the time)
  ussr: p(286_700_000, 1989),
  yugoslavia: p(23_500_000, 1991),
  gdr: p(16_400_000, 1989),
  'german-empire': p(64_900_000, 1910),
  'russian-empire': p(125_600_000, 1897),
  'second-spanish-republic': p(23_600_000, 1930),
  franquista: p(34_000_000, 1970),
  zaire: p(29_900_000, 1984),
  'upper-volta': p(5_640_000, 1975),
  rhodesia: p(5_100_000, 1969),
  'kingdom-of-hawaii': p(90_000, 1890),
  'union-of-south-africa': p(16_000_000, 1960),
};
