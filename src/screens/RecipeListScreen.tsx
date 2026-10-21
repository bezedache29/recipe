import { useFocusEffect } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Input from '../components/ui/Input';
import { CATEGORIES } from '../constants';
import {
  categoryColors,
  colors,
  controlHeight,
  fontSize,
  radius,
  spacing,
} from '../theme';
import { useFilters } from '../context/FiltersContext';
import { countRecipes, searchRecipes, setFavorite } from '../db/recipes';
import { ScreenProps } from '../navigation/types';
import { Category, RecipeSummary } from '../types';

export default function RecipeListScreen({
  navigation,
}: ScreenProps<'RecipeList'>) {
  const {
    filters,
    updateFilters,
    resetFilters,
    removeDeletedFromFilters,
    activeCount,
  } = useFilters();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState(filters.search);
  const insets = useSafeAreaInsets();

  // Waits for the user to stop typing before querying the database.
  useEffect(() => {
    const timer = setTimeout(() => updateFilters({ search: searchText }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const load = useCallback(async () => {
    const [results, total] = await Promise.all([
      searchRecipes(filters),
      countRecipes(),
    ]);
    setRecipes(results);
    setTotalCount(total);
  }, [filters]);

  // Reloads when filters change and when coming back from another screen.
  useFocusEffect(
    useCallback(() => {
      removeDeletedFromFilters();
      load();
    }, [load, removeDeletedFromFilters]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          label="Cuissons"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('CookingMethods')}
        />
      ),
    });
  }, [navigation]);

  const toggleCategory = (category: Category) =>
    updateFilters({
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category],
    });

  const toggleFavorite = async (recipe: RecipeSummary) => {
    await setFavorite(recipe.id, !recipe.isFavorite);
    load();
  };

  const hasCriteria = activeCount > 0 || filters.search.trim() !== '';

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Input
          style={styles.search}
          placeholder="Rechercher une recette, un ingrédient…"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        <Button
          label={activeCount > 0 ? `Filtres (${activeCount})` : 'Filtres'}
          variant={activeCount > 0 ? 'default' : 'outline'}
          onPress={() => navigation.navigate('Filters')}
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFilters}
        >
          <Chip
            label="★ Favoris"
            color={colors.accent}
            showDot={false}
            selected={filters.favoritesOnly}
            onPress={() =>
              updateFilters({ favoritesOnly: !filters.favoritesOnly })
            }
          />
          {CATEGORIES.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              color={categoryColors[c.value]}
              selected={filters.categories.includes(c.value)}
              onPress={() => toggleCategory(c.value)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 96 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          hasCriteria && recipes.length > 0 ? (
            <Text style={styles.resultCount}>
              {recipes.length} recette{recipes.length > 1 ? 's' : ''} sur{' '}
              {totalCount}
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
            onToggleFavorite={() => toggleFavorite(item)}
          />
        )}
        ListEmptyComponent={
          totalCount === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                Aucune recette pour l'instant
              </Text>
              <Text style={styles.empty}>
                Ajoute ta première recette pour la retrouver ici.
              </Text>
              <Button
                label="Ajouter une recette"
                onPress={() => navigation.navigate('RecipeForm', {})}
              />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.empty}>
                Aucune recette ne correspond à ces critères.
              </Text>
              <Button
                label="Effacer les filtres"
                variant="outline"
                onPress={() => {
                  setSearchText('');
                  resetFilters();
                }}
              />
            </View>
          )
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.xl + insets.bottom },
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigation.navigate('RecipeForm', {})}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une recette"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  search: {
    flex: 1,
  },
  quickFilters: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  resultCount: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: fontSize.base,
    lineHeight: 22,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: controlHeight.lg + spacing.sm,
    height: controlHeight.lg + spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabText: {
    color: colors.primaryForeground,
    fontSize: 32,
    lineHeight: 36,
  },
});
