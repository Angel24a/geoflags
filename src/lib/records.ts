/** Personal bests shown in "Progreso", grouped by game. */
export interface RecordGroup {
  title: string;
  rows: { key: string; label: string; value: number; time?: boolean }[];
}

/** Games whose records are split by mode ("population:choice", "languages:where"…). */
const BY_MODE = new Set(['population', 'languages']);

const GROUPS: { title: string; keys: Record<string, string> }[] = [
  {
    title: 'Banderas',
    keys: {
      classic: 'Test clásico (% acierto)', survival: 'Supervivencia', timed: 'Contrarreloj', streak: 'Racha',
      reveal: 'Pixelada o zoom', build: 'Construye la bandera', spot: 'Encuentra el error',
    },
  },
  {
    title: 'Mapas',
    keys: { complete: 'Completa la región (mejor tiempo)', worldle: 'Worldle (racha)', chain: 'Cadena de vecinos' },
  },
  {
    title: 'Datos',
    keys: {
      'population:choice': 'Población · elige la cifra (% acierto)',
      'population:higher': 'Población · ¿más o menos? (racha)',
      'population:estimate': 'Población · estima (media por ronda)',
      sort: 'Ordenar (rondas perfectas)',
    },
  },
  {
    title: 'Pueblos e idiomas',
    keys: {
      'languages:choice': 'Idiomas · elige (% acierto)',
      'languages:type': 'Idiomas · escribe (% acierto)',
      'languages:where': 'Idiomas · ¿dónde se habla? (% acierto)',
      'languages:streak': 'Idiomas · sin fin (racha)',
      peoples: 'Pueblos del mundo (racha)',
    },
  },
];

/** Key of the game (and mode) a record belongs to. */
export function recordMode(key: string): string {
  const [game, mode] = key.split(':');
  return BY_MODE.has(game) && mode ? `${game}:${mode}` : game;
}

/** Best value per game: "complete" stores times (lower is better), the rest scores. */
export function groupRecords(records: Record<string, number>): RecordGroup[] {
  const best: Record<string, number> = {};
  for (const [k, v] of Object.entries(records)) {
    const m = recordMode(k);
    best[m] = m === 'complete' ? Math.min(best[m] ?? Infinity, v) : Math.max(best[m] ?? 0, v);
  }
  return GROUPS.map(g => ({
    title: g.title,
    rows: Object.entries(g.keys)
      .filter(([k]) => best[k] !== undefined)
      .map(([k, label]) => ({ key: k, label, value: best[k], time: k === 'complete' })),
  })).filter(g => g.rows.length);
}
