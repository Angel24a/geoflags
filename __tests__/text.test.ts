import { BY_ID } from '@/data';
import { fuzzyEquals, levenshtein, matchesCapital, matchesName, normalize, suggest } from '@/lib/text';

describe('text matching', () => {
  it('normalizes accents and punctuation', () => {
    expect(normalize('  Costa  de Marfil ')).toBe('costa de marfil');
    expect(normalize('Japón')).toBe('japon');
    expect(normalize("Côte d'Ivoire")).toBe('cote d ivoire');
  });

  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('accepts small typos depending on length', () => {
    expect(fuzzyEquals('Alemaña', 'Alemania')).toBe(true);
    expect(fuzzyEquals('Peru', 'Perú')).toBe(true);
    expect(fuzzyEquals('Irak', 'Irán')).toBe(false);
  });

  it('matches names, aliases and capitals', () => {
    expect(matchesName('espana', BY_ID.get('es')!)).toBe(true);
    expect(matchesName('Holanda', BY_ID.get('nl')!)).toBe(true);
    expect(matchesCapital('pekin', BY_ID.get('cn')!)).toBe(true);
    expect(matchesCapital('Las Palmas de Gran Canaria', BY_ID.get('es-cn')!)).toBe(true);
  });

  it('suggests prefix matches first', () => {
    const list = [BY_ID.get('fr')!, BY_ID.get('pf')!, BY_ID.get('es')!];
    expect(suggest('fran', list).map(e => e.id)).toEqual(['fr', 'pf']);
    expect(suggest('xyz', list)).toEqual([]);
  });
});
