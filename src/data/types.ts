export type Category =
  | 'sovereign'
  | 'limited'
  | 'territory'
  | 'spain'
  | 'historical'
  | 'cultural'
  | 'organization';

export type Continent =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'north-america'
  | 'south-america'
  | 'oceania'
  | 'antarctica'
  | 'world';

/** Canonical named colours used for similarity, filters and "build the flag". */
export type ColorKey =
  | 'white'
  | 'black'
  | 'red'
  | 'maroon'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'lightblue'
  | 'blue'
  | 'purple';

export interface Bands {
  dir: 'h' | 'v';
  colors: ColorKey[];
  /** Relative size of each band. */
  weights: number[];
}

export interface Entity {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  continent: Continent;
  /** Spanish label of the UN geoscheme subregion. */
  subregion?: string;
  capital?: string;
  latlng?: [number, number];
  area?: number;
  /** 0 = no permanent population. */
  population?: number;
  /** Year of the figure, when it is not the latest World Bank data. */
  popYear?: number;
  /** The figure counts the members of a people, not a territory. */
  popPeople?: boolean;
  /** Countries where a people mainly lives ("Pueblos del mundo"). */
  homeland?: string[];
  /** Own language of a people or region. */
  language?: string;
  /** Ids of bordering entities (land borders). */
  borders: string[];
  years?: string;
  note?: string;
  /** Authored flag with a simplified emblem. */
  simplified?: boolean;
  /** Flag aspect ratio, width / height. */
  ratio: number;
  /** Dominant named colours, most prominent first. */
  colors: ColorKey[];
  /** Most visually similar flags, most similar first. */
  similar: string[];
  /** Entities whose flag is (almost) identical. */
  sameFlag: string[];
  /** Present when the flag is made only of plain stripes. */
  bands?: Bands;
  /** Flag looks the same mirrored left↔right / top↔bottom. */
  symH: boolean;
  symV: boolean;
  /**
   * 'shape' = own polygon geometry, 'tiny' = geometry too small to use as a
   * silhouette, 'marker' = only a point on the map.
   */
  geo: 'shape' | 'tiny' | 'marker' | null;
  /** Part of the 254 base set (ISO 3166-1 + Kosovo + UK nations). */
  base: boolean;
}

export interface Language {
  id: string;
  name: string;
  /** Name in the language itself. */
  native: string;
  aliases?: string[];
  family: string;
  branch?: string;
  script: string;
  /** Approximate native speakers, in millions. */
  speakers: number;
  /** Entity ids where it is official or widely spoken. */
  countries: string[];
  /** [sentence, Spanish translation] */
  phrases: [string, string][];
  note?: string;
}
