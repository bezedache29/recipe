import { Category, RecipeFilters, SortOrder } from './types';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'entree', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'encas', label: 'En-cas' },
];

export const categoryLabel = (category: Category) =>
  CATEGORIES.find(c => c.value === category)?.label ?? category;

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'title', label: 'Titre A→Z' },
  { value: 'prep', label: 'Plus rapides' },
];

/** Shortcuts offered in the filters for the max preparation time. */
export const PREP_TIME_OPTIONS = [15, 30, 45, 60, 90];

export const EMPTY_FILTERS: RecipeFilters = {
  search: '',
  categories: [],
  cookingMethodIds: [],
  ingredientIds: [],
  maxPrepMinutes: null,
  favoritesOnly: false,
  sort: 'recent',
};
