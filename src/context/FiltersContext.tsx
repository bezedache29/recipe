import React, { createContext, useContext, useMemo, useState } from 'react';
import { EMPTY_FILTERS } from '../constants';
import { listCookingMethods } from '../db/cookingMethods';
import { listIngredients } from '../db/ingredients';
import { RecipeFilters } from '../types';

type FiltersContextValue = {
  filters: RecipeFilters;
  setFilters: (filters: RecipeFilters) => void;
  updateFilters: (patch: Partial<RecipeFilters>) => void;
  resetFilters: () => void;
  /** Drops cooking methods / ingredients that were deleted meanwhile. */
  removeDeletedFromFilters: () => Promise<void>;
  /** Number of active filters, search text and sort excluded. */
  activeCount: number;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

export const countActiveFilters = (filters: RecipeFilters) =>
  filters.categories.length +
  filters.cookingMethodIds.length +
  filters.ingredientIds.length +
  (filters.maxPrepMinutes != null ? 1 : 0) +
  (filters.favoritesOnly ? 1 : 0);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<RecipeFilters>(EMPTY_FILTERS);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilters,
      updateFilters: patch => setFilters(prev => ({ ...prev, ...patch })),
      // Keeps the search text and sort: "reset" only clears the filter panel.
      resetFilters: () =>
        setFilters(prev => ({
          ...EMPTY_FILTERS,
          search: prev.search,
          sort: prev.sort,
        })),
      removeDeletedFromFilters: async () => {
        if (
          filters.cookingMethodIds.length === 0 &&
          filters.ingredientIds.length === 0
        ) {
          return;
        }
        const [methods, ingredients] = await Promise.all([
          listCookingMethods(),
          listIngredients(),
        ]);
        const methodIds = new Set(methods.map(m => m.id));
        const ingredientIds = new Set(ingredients.map(i => i.id));
        const keptMethods = filters.cookingMethodIds.filter(id =>
          methodIds.has(id),
        );
        const keptIngredients = filters.ingredientIds.filter(id =>
          ingredientIds.has(id),
        );
        if (
          keptMethods.length !== filters.cookingMethodIds.length ||
          keptIngredients.length !== filters.ingredientIds.length
        ) {
          setFilters(prev => ({
            ...prev,
            cookingMethodIds: keptMethods,
            ingredientIds: keptIngredients,
          }));
        }
      },
      activeCount: countActiveFilters(filters),
    }),
    [filters],
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used inside <FiltersProvider>');
  }
  return context;
};
