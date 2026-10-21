import { Star, UtensilsCrossed } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { balanceLabel, categoryLabel } from '../constants';
import {
  categoryColors,
  colors,
  fonts,
  fontSize,
  iconSize,
  radius,
  spacing,
} from '../theme';
import { RecipeSummary } from '../types';
import { photoUri } from '../utils/photos';
import { formatMinutes } from '../utils/text';
import { balanceIcons } from './balanceIcons';
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
  const BalanceIcon = balanceIcons[recipe.balance];

  return (
    <Card onPress={onPress} style={styles.card}>
      {recipe.photoPath ? (
        <Image
          source={{ uri: photoUri(recipe.photoPath) }}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <UtensilsCrossed
            color={colors.mutedForeground}
            size={iconSize.lg + 4}
          />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.categoryRow}>
          {recipe.categories.map(category => (
            <View key={category} style={styles.categoryItem}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: categoryColors[category] },
                ]}
              />
              <Text
                style={[styles.category, { color: categoryColors[category] }]}
              >
                {categoryLabel(category)}
              </Text>
            </View>
          ))}
          {recipe.balance !== 'normal' ? (
            <>
              <BalanceIcon
                color={colors.mutedForeground}
                size={iconSize.sm - 2}
                style={styles.balanceIcon}
              />
              <Text style={styles.balance}>{balanceLabel(recipe.balance)}</Text>
            </>
          ) : null}
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
        <Star
          size={iconSize.lg}
          color={recipe.isFavorite ? colors.accent : colors.input}
          fill={recipe.isFavorite ? colors.accent : 'transparent'}
        />
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
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fonts.headingMedium,
    color: colors.foreground,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
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
  balanceIcon: {
    marginRight: spacing.xs,
  },
  balance: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  details: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  favorite: {
    paddingHorizontal: spacing.sm,
  },
});
