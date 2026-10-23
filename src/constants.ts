import { Balance, Category, RecipeFilters, SortOrder } from './types';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'entree', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'encas', label: 'En-cas' },
];

export const categoryLabel = (category: Category) =>
  CATEGORIES.find(c => c.value === category)?.label ?? category;

export const BALANCES: { value: Balance; label: string }[] = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'normal', label: 'Normal' },
  { value: 'rich', label: 'Riche' },
];

export const balanceLabel = (balance: Balance) =>
  BALANCES.find(b => b.value === balance)?.label ?? balance;

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'oldest', label: 'Plus anciennes' },
  { value: 'title', label: 'Titre A→Z' },
  { value: 'prep', label: 'Plus rapides' },
];

/** Shortcuts offered in the filters for the max preparation time. */
export const PREP_TIME_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180];

export const EMPTY_FILTERS: RecipeFilters = {
  search: '',
  categories: [],
  balances: [],
  cookingMethodIds: [],
  ingredientIds: [],
  maxPrepMinutes: null,
  favoritesOnly: false,
  sort: 'recent',
};
