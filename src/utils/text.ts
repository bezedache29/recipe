/**
 * Lowercase + strip accents, so "Œuf", "oeuf" and "Crème" / "creme" match.
 * Stored next to titles and ingredient names to make search accent-insensitive.
 */
export const toSearchKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export const formatMinutes = (minutes: number | null) => {
  if (minutes == null) {
    return null;
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, '0')}`;
};
