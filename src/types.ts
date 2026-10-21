export type Category = 'entree' | 'plat' | 'dessert' | 'encas';

/** How light or indulgent a recipe is. */
export type Balance = 'healthy' | 'normal' | 'rich';

export type CookingMethod = {
  id: number;
  name: string;
};

export type Ingredient = {
  id: number;
  name: string;
};

export type RecipeIngredient = {
  name: string;
  quantity: string;
};

/** A recipe as shown in the list (lightweight). */
export type RecipeSummary = {
  id: number;
  title: string;
  photoPath: string | null;
  /** At least one, in the order of CATEGORIES. */
  categories: Category[];
  balance: Balance;
  prepMinutes: number | null;
  isFavorite: boolean;
  cookingNames: string[];
};

/** A recipe with everything needed for the detail and edit screens. */
export type Recipe = RecipeSummary & {
  cookingMethodIds: number[];
  ingredients: RecipeIngredient[];
  steps: string[];
};

/** What the form sends to the database (no id when creating). */
export type RecipeInput = {
  title: string;
  photoPath: string | null;
  /** At least one, in the order of CATEGORIES. */
  categories: Category[];
  balance: Balance;
  prepMinutes: number | null;
  isFavorite: boolean;
  cookingMethodIds: number[];
  ingredients: RecipeIngredient[];
  steps: string[];
};

export type SortOrder = 'recent' | 'title' | 'prep';

export type RecipeFilters = {
  search: string;
  categories: Category[];
  /** Recipes with any of these balances. */
  balances: Balance[];
  /** Recipes using at least one of these cooking methods. */
  cookingMethodIds: number[];
  /** Recipes containing all of these ingredients. */
  ingredientIds: number[];
  maxPrepMinutes: number | null;
  favoritesOnly: boolean;
  sort: SortOrder;
};
