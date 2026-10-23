import { formatDate, formatMinutes, toSearchKey } from '../src/utils/text';

describe('toSearchKey', () => {
  it('removes accents, ligatures and case', () => {
    expect(toSearchKey('  Œufs  Brouillés ')).toBe('oeufs brouilles');
    expect(toSearchKey('Crème')).toBe('creme');
  });
});

describe('formatMinutes', () => {
  it('formats durations', () => {
    expect(formatMinutes(null)).toBeNull();
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(95)).toBe('1 h 35');
  });
});

describe('formatDate', () => {
  it('writes the date in French', () => {
    expect(formatDate(new Date(2026, 2, 12, 18, 30).getTime())).toBe(
      '12 mars 2026',
    );
    expect(formatDate(new Date(2026, 7, 1).getTime())).toBe('1er août 2026');
  });
});
