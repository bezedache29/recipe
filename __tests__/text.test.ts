import { formatMinutes, toSearchKey } from '../src/utils/text';

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
