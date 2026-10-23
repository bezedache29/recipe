import { useFocusEffect } from '@react-navigation/native';
import { ChefHat, Plus, Settings, Star } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
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
  fonts,
  fontSize,
  iconSize,
  radius,
  spacing,
} from '../theme';
import { useFilters } from '../context/FiltersContext';
import {
  countMatchingRecipes,
  countRecipes,
  PAGE_SIZE,
  searchRecipes,
  setFavorite,
} from '../db/recipes';
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
  const [matchCount, setMatchCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const loadedCount = useRef(0);
  const loadedFilters = useRef(filters);
  const loadingMore = useRef(false);
  // Lets a slow query notice that a newer reload has replaced it.
  const requestId = useRef(0);
  const [searchText, setSearchText] = useState(filters.search);
  const insets = useSafeAreaInsets();

  // Waits for the user to stop typing before querying the database.
  useEffect(() => {
    const timer = setTimeout(() => updateFilters({ search: searchText }), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const load = useCallback(async () => {
    // Coming back from another screen keeps the recipes already loaded, so the
    // list does not jump back to the top. New filters start again at page one.
    const limit =
      loadedFilters.current === filters
        ? Math.max(PAGE_SIZE, loadedCount.current)
        : PAGE_SIZE;
    loadedFilters.current = filters;
    const id = ++requestId.current;
    const [results, matching, total] = await Promise.all([
      searchRecipes(filters, { offset: 0, limit }),
      countMatchingRecipes(filters),
      countRecipes(),
    ]);
    if (id !== requestId.current) {
      return;
    }
    loadedCount.current = results.length;
    setRecipes(results);
    setMatchCount(matching);
    setTotalCount(total);
  }, [filters]);

  const loadMore = async () => {
    if (loadingMore.current || recipes.length >= matchCount) {
      return;
    }
    loadingMore.current = true;
    const id = requestId.current;
    try {
      const next = await searchRecipes(filters, {
        offset: recipes.length,
        limit: PAGE_SIZE,
      });
      if (id !== requestId.current) {
        return;
      }
      const merged = [...recipes, ...next];
      loadedCount.current = merged.length;
      setRecipes(merged);
    } finally {
      loadingMore.current = false;
    }
  };

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
          label="Réglages"
          icon={Settings}
          variant="ghost"
          size="iconSm"
          onPress={() => navigation.navigate('Settings')}
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
    if (filters.favoritesOnly) {
      // The recipe may have to leave the list.
      load();
      return;
    }
    setRecipes(prev =>
      prev.map(r =>
        r.id === recipe.id ? { ...r, isFavorite: !recipe.isFavorite } : r,
      ),
    );
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
            label="Favoris"
            color={colors.accent}
            icon={Star}
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
        showsVerticalScrollIndicator={false}
        data={recipes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 96 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          hasCriteria && matchCount > 0 ? (
            <Text style={styles.resultCount}>
              {matchCount} recette{matchCount > 1 ? 's' : ''} sur {totalCount}
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
              <ChefHat
                color={colors.mutedForeground}
                size={iconSize.lg * 2}
                style={styles.emptyIcon}
              />
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
        <Plus color={colors.primaryForeground} size={iconSize.lg + 4} />
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
    fontFamily: fonts.headingMedium,
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
  emptyIcon: {
    marginBottom: spacing.lg,
  },
});
