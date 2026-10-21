import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categoryLabel } from '../constants';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { categoryColors, colors, fontSize, radius, spacing } from '../theme';
import { deleteRecipe, getRecipe, setFavorite } from '../db/recipes';
import { ScreenProps } from '../navigation/types';
import { Recipe } from '../types';
import { deletePhoto, photoUri } from '../utils/photos';
import { formatMinutes } from '../utils/text';

export default function RecipeDetailScreen({
  navigation,
  route,
}: ScreenProps<'RecipeDetail'>) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    const found = await getRecipe(id);
    if (!found) {
      navigation.goBack();
      return;
    }
    setRecipe(found);
  }, [id, navigation]);

  // Reloads after coming back from the edit screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleFavorite = useCallback(async () => {
    if (!recipe) {
      return;
    }
    await setFavorite(recipe.id, !recipe.isFavorite);
    setRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
  }, [recipe]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerRight: () =>
        recipe ? (
          <Pressable
            onPress={toggleFavorite}
            hitSlop={12}
            accessibilityLabel={
              recipe.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
            }
          >
            <Text style={[styles.star, recipe.isFavorite && styles.starActive]}>
              {recipe.isFavorite ? '★' : '☆'}
            </Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, recipe, toggleFavorite]);

  const confirmDelete = () => {
    if (!recipe) {
      return;
    }
    Alert.alert(
      'Supprimer la recette ?',
      `« ${recipe.title} » sera définitivement supprimée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteRecipe(recipe.id);
            await deletePhoto(recipe.photoPath);
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!recipe) {
    return <View style={styles.container} />;
  }

  const prep = formatMinutes(recipe.prepMinutes);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}
    >
      {recipe.photoPath ? (
        <Image
          source={{ uri: photoUri(recipe.photoPath) }}
          style={styles.photo}
        />
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>

        <View style={styles.tags}>
          <Badge
            label={categoryLabel(recipe.category)}
            color={categoryColors[recipe.category]}
          />
          {prep ? <Badge label={`⏱ ${prep}`} /> : null}
          {recipe.cookingNames.map(name => (
            <Badge key={name} label={name} variant="outline" />
          ))}
        </View>

        <Text style={styles.section}>Ingrédients</Text>
        {recipe.ingredients.length === 0 ? (
          <Text style={styles.muted}>Aucun ingrédient renseigné.</Text>
        ) : (
          <Card style={styles.ingredients}>
            {recipe.ingredients.map((ingredient, index) => (
              <View
                key={index}
                style={[
                  styles.ingredientRow,
                  index > 0 && styles.ingredientDivider,
                ]}
              >
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                {ingredient.quantity ? (
                  <Text style={styles.quantity}>{ingredient.quantity}</Text>
                ) : null}
              </View>
            ))}
          </Card>
        )}

        <Text style={styles.section}>Étapes</Text>
        {recipe.steps.length === 0 ? (
          <Text style={styles.muted}>Aucune étape renseignée.</Text>
        ) : (
          recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        )}

        <View style={styles.actions}>
          <Button
            label="Modifier"
            style={styles.action}
            onPress={() => navigation.navigate('RecipeForm', { id: recipe.id })}
          />
          <Button
            label="Supprimer"
            variant="destructive"
            style={styles.action}
            onPress={confirmDelete}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.foreground,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
    marginTop: spacing.md,
  },
  star: {
    fontSize: fontSize.xxl,
    color: colors.mutedForeground,
  },
  starActive: {
    color: colors.accent,
  },
  section: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
  },
  ingredients: {
    paddingVertical: spacing.xs,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
  },
  ingredientDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ingredientName: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.base,
  },
  quantity: {
    color: colors.mutedForeground,
    fontSize: fontSize.base,
    marginLeft: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.base,
    lineHeight: 23,
    paddingTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  action: {
    flex: 1,
  },
});
