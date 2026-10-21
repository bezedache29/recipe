import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabel } from '../constants';
import { categoryColors, colors, fontSize, radius, spacing } from '../theme';
import { RecipeSummary } from '../types';
import { photoUri } from '../utils/photos';
import { formatMinutes } from '../utils/text';
import Card from './ui/Card';

type Props = {
  recipe: RecipeSummary;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export default function RecipeCard({
  recipe,
  onPress,
  onToggleFavorite,
}: Props) {
  const details = [
    formatMinutes(recipe.prepMinutes),
    recipe.cookingNames.join(', '),
  ].filter(Boolean);
  const categoryColor = categoryColors[recipe.category];

  return (
    <Card onPress={onPress} style={styles.card}>
      {recipe.photoPath ? (
        <Image
          source={{ uri: photoUri(recipe.photoPath) }}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>🍽️</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.categoryRow}>
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.category, { color: categoryColor }]}>
            {categoryLabel(recipe.category)}
          </Text>
        </View>
        {details.length > 0 ? (
          <Text style={styles.details} numberOfLines={1}>
            {details.join(', ')}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onToggleFavorite}
        hitSlop={12}
        accessibilityLabel={
          recipe.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
        }
        style={styles.favorite}
      >
        <Text style={[styles.star, recipe.isFavorite && styles.starActive]}>
          {recipe.isFavorite ? '★' : '☆'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  noPhoto: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    fontSize: fontSize.xxl,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: 6,
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  details: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  favorite: {
    paddingHorizontal: spacing.sm,
  },
  star: {
    fontSize: fontSize.xxl,
    color: colors.input,
  },
  starActive: {
    color: colors.accent,
  },
});
