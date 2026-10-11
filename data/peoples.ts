/**
 * Peoples and cultural regions for the "Pueblos del mundo" game: the
 * countries where they mainly live (ids of entities with a map shape) and
 * their own language.
 */
export interface PeopleFact {
  homeland: string[];
  language: string;
}

export const PEOPLES: Record<string, PeopleFact> = {
  kurdistan: { homeland: ['tr', 'iq', 'ir', 'sy'], language: 'Kurdo' },
  assyria: { homeland: ['iq', 'sy', 'tr', 'ir'], language: 'Neoarameo asirio' },
  amazigh: { homeland: ['ma', 'dz', 'ly', 'tn', 'ml', 'ne'], language: 'Tamazight (bereber)' },
  sami: { homeland: ['no', 'se', 'fi', 'ru'], language: 'Lenguas sami' },
  romani: { homeland: ['ro', 'bg', 'hu', 'sk', 'rs', 'mk', 'es', 'tr'], language: 'Romaní' },
  tibet: { homeland: ['cn'], language: 'Tibetano' },
  'east-turkestan': { homeland: ['cn'], language: 'Uigur' },
  maori: { homeland: ['nz'], language: 'Maorí' },
  aboriginal: { homeland: ['au'], language: 'Lenguas aborígenes australianas' },
  'torres-strait': { homeland: ['au'], language: 'Kala lagaw ya y meriam mir' },
  sorbs: { homeland: ['de'], language: 'Sorabo' },
  acadia: { homeland: ['ca'], language: 'Francés acadiano' },
  circassia: { homeland: ['ru', 'tr', 'jo', 'sy'], language: 'Circasiano (adigué y kabardiano)' },
  wiphala: { homeland: ['bo', 'pe', 'ec', 'cl', 'ar'], language: 'Quechua y aimara' },
  brittany: { homeland: ['fr'], language: 'Bretón' },
  corsica: { homeland: ['fr'], language: 'Corso' },
  sardinia: { homeland: ['it'], language: 'Sardo' },
  occitania: { homeland: ['fr', 'es', 'it'], language: 'Occitano' },
  frisia: { homeland: ['nl', 'de', 'dk'], language: 'Frisón' },
  scania: { homeland: ['se'], language: 'Sueco (dialecto escaniano)' },
  cornwall: { homeland: ['gb'], language: 'Córnico' },
  flanders: { homeland: ['be'], language: 'Neerlandés (flamenco)' },
  // the ikurriña and the senyera are also the flags of the Basque and Catalan peoples
  'es-pv': { homeland: ['es', 'fr'], language: 'Euskera' },
  'es-ct': { homeland: ['es', 'fr'], language: 'Catalán' },
  'es-ga': { homeland: ['es'], language: 'Gallego' },
};
