import { Category } from './types';

/**
 * Single source of every visual value in the app (dark mode only).
 * Token names follow shadcn/ui; the "Épices" palette is our own.
 */
export const colors = {
  background: '#17111C',
  card: '#231A2B',
  muted: '#2E2238',
  border: '#392B45',
  input: '#4A3958',
  foreground: '#FBF3E9',
  mutedForeground: '#B3A3B8',
  /** Main actions and selected state. */
  primary: '#FF6B4A',
  primaryForeground: '#1F1014',
  /** Reserved for favorites. */
  accent: '#FFC23D',
  accentForeground: '#1F1014',
  destructive: '#F0506E',
  /** Soft red background so delete buttons don't shout next to the coral. */
  destructiveMuted: '#3D1A2A',
};

/** Lets each category be spotted at a glance in lists. */
export const categoryColors: Record<Category, string> = {
  entree: '#5CC98A',
  plat: '#FF6B4A',
  dessert: '#FF7FB0',
  encas: '#FFC23D',
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
};

/** Heights shared by buttons, inputs and chips so rows line up. */
export const controlHeight = {
  sm: 36,
  md: 44,
  lg: 52,
};
