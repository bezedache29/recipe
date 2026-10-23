import { Star } from 'lucide-react-native';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Input from '../components/ui/Input';
import KeyboardAwareScrollView from '../components/ui/KeyboardAwareScrollView';
import { balanceIcons } from '../components/balanceIcons';
import {
  BALANCES,
  CATEGORIES,
  PREP_TIME_OPTIONS,
  SORT_OPTIONS,
} from '../constants';
import {
  balanceColors,
  categoryColors,
  colors,
  fonts,
  fontSize,
  spacing,
} from '../theme';
import { useFilters } from '../context/FiltersContext';
import {
  CookingMethodWithUsage,
  listCookingMethods,
} from '../db/cookingMethods';
import { listIngredients } from '../db/ingredients';
import { countMatchingRecipes } from '../db/recipes';
import { ScreenProps } from '../navigation/types';
import { Ingredient } from '../types';
import { formatMinutes, toSearchKey } from '../utils/text';

/** Adds the value to the list, or removes it if it is already there. */
const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value];

export default function FiltersScreen({ navigation }: ScreenProps<'Filters'>) {
  const { filters, updateFilters, resetFilters, activeCount } = useFilters();
  const [cookingMethods, setCookingMethods] = useState<
    CookingMethodWithUsage[]
  >([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [resultCount, setResultCount] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    listCookingMethods().then(setCookingMethods);
    listIngredients().then(setIngredients);
  }, []);

  useEffect(() => {
    countMatchingRecipes(filters).then(setResultCount);
  }, [filters]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        activeCount > 0 ? (
          <Button
            label="Réinitialiser"
            variant="ghost"
            size="sm"
            onPress={resetFilters}
          />
        ) : null,
    });
  }, [navigation, activeCount, resetFilters]);

  // Selected ingredients always stay visible, even if they don't match the search.
  const visibleIngredients = useMemo(() => {
    const key = toSearchKey(ingredientSearch);
    return ingredients.filter(
      i =>
        filters.ingredientIds.includes(i.id) ||
        toSearchKey(i.name).includes(key),
    );
  }, [ingredients, ingredientSearch, filters.ingredientIds]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Trier par</Text>
        <View style={styles.chips}>
          {SORT_OPTIONS.map(o => (
            <Chip
              key={o.value}
              label={o.label}
              selected={filters.sort === o.value}
              onPress={() => updateFilters({ sort: o.value })}
            />
          ))}
        </View>

        <Text style={styles.section}>Favoris</Text>
        <View style={styles.chips}>
          <Chip
            label="Uniquement mes favoris"
            color={colors.accent}
            icon={Star}
            selected={filters.favoritesOnly}
            onPress={() =>
              updateFilters({ favoritesOnly: !filters.favoritesOnly })
            }
          />
        </View>

        <Text style={styles.section}>Catégorie</Text>
        <View style={styles.chips}>
          {CATEGORIES.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              color={categoryColors[c.value]}
              selected={filters.categories.includes(c.value)}
              onPress={() =>
                updateFilters({
                  categories: toggle(filters.categories, c.value),
                })
              }
            />
          ))}
        </View>

        <Text style={styles.section}>Équilibre</Text>
        <View style={styles.chips}>
          {BALANCES.map(b => (
            <Chip
              key={b.value}
              label={b.label}
              icon={balanceIcons[b.value]}
              color={balanceColors[b.value]}
              selected={filters.balances.includes(b.value)}
              onPress={() =>
                updateFilters({ balances: toggle(filters.balances, b.value) })
              }
            />
          ))}
        </View>

        <Text style={styles.section}>Temps de préparation maximum</Text>
        <View style={styles.chips}>
          <Chip
            label="Peu importe"
            selected={filters.maxPrepMinutes == null}
            onPress={() => updateFilters({ maxPrepMinutes: null })}
          />
          {PREP_TIME_OPTIONS.map(minutes => (
            <Chip
              key={minutes}
              label={`≤ ${formatMinutes(minutes)}`}
              selected={filters.maxPrepMinutes === minutes}
              onPress={() => updateFilters({ maxPrepMinutes: minutes })}
            />
          ))}
        </View>

        <Text style={styles.section}>Cuisson</Text>
        <Text style={styles.hint}>Au moins une des cuissons choisies</Text>
        <View style={styles.chips}>
          {cookingMethods.map(m => (
            <Chip
              key={m.id}
              label={m.name}
              selected={filters.cookingMethodIds.includes(m.id)}
              onPress={() =>
                updateFilters({
                  cookingMethodIds: toggle(filters.cookingMethodIds, m.id),
                })
              }
            />
          ))}
        </View>

        <Text style={styles.section}>Ingrédients</Text>
        <Text style={styles.hint}>
          Les recettes qui contiennent tous les ingrédients choisis
        </Text>
        {ingredients.length === 0 ? (
          <Text style={styles.hint}>Aucun ingrédient enregistré.</Text>
        ) : (
          <>
            <Input
              style={styles.input}
              placeholder="Chercher un ingrédient…"
              value={ingredientSearch}
              onChangeText={setIngredientSearch}
            />
            <View style={styles.chips}>
              {visibleIngredients.map(i => (
                <Chip
                  key={i.id}
                  label={i.name}
                  selected={filters.ingredientIds.includes(i.id)}
                  onPress={() =>
                    updateFilters({
                      ingredientIds: toggle(filters.ingredientIds, i.id),
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
        <Button
          size="lg"
          onPress={navigation.goBack}
          label={
            resultCount == null
              ? 'Voir les recettes'
              : resultCount === 0
              ? 'Aucune recette'
              : `Voir ${resultCount} recette${resultCount > 1 ? 's' : ''}`
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    fontSize: fontSize.base,
    fontFamily: fonts.headingMedium,
    color: colors.foreground,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  input: {
    marginBottom: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
