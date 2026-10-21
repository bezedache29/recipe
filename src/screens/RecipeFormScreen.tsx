import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Input from '../components/ui/Input';
import { CATEGORIES } from '../constants';
import { categoryColors, colors, fontSize, radius, spacing } from '../theme';
import { listCookingMethods } from '../db/cookingMethods';
import { listIngredients } from '../db/ingredients';
import { createRecipe, getRecipe, updateRecipe } from '../db/recipes';
import { ScreenProps } from '../navigation/types';
import { Category, CookingMethod, Ingredient } from '../types';
import {
  deletePhoto,
  photoUri,
  pickPhotoFromLibrary,
  takePhoto,
} from '../utils/photos';
import { toSearchKey } from '../utils/text';

// Each row gets a stable key so React keeps the right input focused
// when rows are added, removed or moved.
type IngredientRow = { key: number; name: string; quantity: string };
type StepRow = { key: number; text: string };

let nextKey = 1;
const newIngredientRow = (name = '', quantity = ''): IngredientRow => ({
  key: nextKey++,
  name,
  quantity,
});
const newStepRow = (text = ''): StepRow => ({ key: nextKey++, text });

export default function RecipeFormScreen({
  navigation,
  route,
}: ScreenProps<'RecipeForm'>) {
  const recipeId = route.params?.id;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [prepText, setPrepText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [cookingMethodIds, setCookingMethodIds] = useState<number[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    newIngredientRow(),
  ]);
  const [steps, setSteps] = useState<StepRow[]>([newStepRow()]);

  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([]);
  const [knownIngredients, setKnownIngredients] = useState<Ingredient[]>([]);
  const [focusedIngredient, setFocusedIngredient] = useState<number | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Refs so the "leave screen" listener always sees the latest values.
  const originalPhoto = useRef<string | null>(null);
  const currentPhoto = useRef<string | null>(null);
  const dirty = useRef(false);
  const saved = useRef(false);

  currentPhoto.current = photoPath;

  /** Wraps a setter so any change marks the form as modified. */
  const edit =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      dirty.current = true;
      setter(value);
    };

  useEffect(() => {
    navigation.setOptions({
      title: recipeId ? 'Modifier la recette' : 'Nouvelle recette',
    });
    listIngredients().then(setKnownIngredients);
    if (!recipeId) {
      return;
    }
    getRecipe(recipeId).then(recipe => {
      if (!recipe) {
        return;
      }
      originalPhoto.current = recipe.photoPath;
      setTitle(recipe.title);
      setPhotoPath(recipe.photoPath);
      setCategory(recipe.category);
      setPrepText(recipe.prepMinutes == null ? '' : String(recipe.prepMinutes));
      setIsFavorite(recipe.isFavorite);
      setCookingMethodIds(recipe.cookingMethodIds);
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map(i => newIngredientRow(i.name, i.quantity))
          : [newIngredientRow()],
      );
      setSteps(
        recipe.steps.length > 0
          ? recipe.steps.map(s => newStepRow(s))
          : [newStepRow()],
      );
    });
  }, [navigation, recipeId]);

  // Reloads cooking methods when coming back from the management screen.
  useFocusEffect(
    useCallback(() => {
      listCookingMethods().then(methods => {
        setCookingMethods(methods);
        const existing = new Set(methods.map(m => m.id));
        setCookingMethodIds(ids => ids.filter(id => existing.has(id)));
      });
    }, []),
  );

  // Asks before leaving with unsaved changes, and cleans up an unused new photo.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        const discardNewPhoto = () => {
          if (currentPhoto.current !== originalPhoto.current) {
            deletePhoto(currentPhoto.current);
          }
        };
        if (saved.current) {
          return;
        }
        if (!dirty.current) {
          discardNewPhoto();
          return;
        }
        event.preventDefault();
        Alert.alert(
          'Abandonner les modifications ?',
          'Les changements non enregistrés seront perdus.',
          [
            { text: 'Continuer', style: 'cancel' },
            {
              text: 'Abandonner',
              style: 'destructive',
              onPress: () => {
                discardNewPhoto();
                navigation.dispatch(event.data.action);
              },
            },
          ],
        );
      }),
    [navigation],
  );

  const choosePhoto = async (source: 'camera' | 'library') => {
    try {
      const path =
        source === 'camera' ? await takePhoto() : await pickPhotoFromLibrary();
      if (!path) {
        return;
      }
      // Replacing a photo picked during this edit: the previous one is unused.
      if (photoPath && photoPath !== originalPhoto.current) {
        deletePhoto(photoPath);
      }
      edit(setPhotoPath)(path);
    } catch (e) {
      Alert.alert('Photo', `Impossible de récupérer la photo.\n${e}`);
    }
  };

  const removePhoto = () => {
    if (photoPath && photoPath !== originalPhoto.current) {
      deletePhoto(photoPath);
    }
    edit(setPhotoPath)(null);
  };

  const updateIngredient = (key: number, patch: Partial<IngredientRow>) =>
    edit(setIngredients)(
      ingredients.map(row => (row.key === key ? { ...row, ...patch } : row)),
    );

  const updateStep = (key: number, text: string) =>
    edit(setSteps)(
      steps.map(row => (row.key === key ? { ...row, text } : row)),
    );

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) {
      return;
    }
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    edit(setSteps)(next);
  };

  const suggestionsFor = (row: IngredientRow) => {
    const key = toSearchKey(row.name);
    if (!key) {
      return [];
    }
    return knownIngredients
      .filter(i => {
        const candidate = toSearchKey(i.name);
        return candidate.includes(key) && candidate !== key;
      })
      .slice(0, 5);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Titre manquant', 'Donne un titre à ta recette.');
      return;
    }
    if (!category) {
      Alert.alert('Catégorie manquante', 'Choisis une catégorie.');
      return;
    }
    const prepMinutes = prepText.trim() === '' ? null : parseInt(prepText, 10);
    if (prepMinutes != null && (isNaN(prepMinutes) || prepMinutes < 0)) {
      Alert.alert('Temps de préparation', 'Indique un nombre de minutes.');
      return;
    }

    const input = {
      title,
      photoPath,
      category,
      prepMinutes,
      isFavorite,
      cookingMethodIds,
      ingredients: ingredients
        .filter(i => i.name.trim() !== '')
        .map(({ name, quantity }) => ({ name, quantity })),
      steps: steps.map(s => s.text).filter(text => text.trim() !== ''),
    };

    setSaving(true);
    try {
      if (recipeId) {
        await updateRecipe(recipeId, input);
        if (originalPhoto.current && originalPhoto.current !== photoPath) {
          await deletePhoto(originalPhoto.current);
        }
      } else {
        await createRecipe(input);
      }
      saved.current = true;
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', `La recette n'a pas pu être enregistrée.\n${e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: spacing.xl + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, styles.firstLabel]}>Titre *</Text>
      <Input
        value={title}
        onChangeText={edit(setTitle)}
        placeholder="Ex. : Gratin dauphinois"
      />

      <Text style={styles.label}>Photo</Text>
      {photoPath ? (
        <View style={styles.photoBox}>
          <Image source={{ uri: photoUri(photoPath) }} style={styles.photo} />
          <Button
            label="Retirer la photo"
            variant="destructive"
            size="sm"
            style={styles.removePhoto}
            onPress={removePhoto}
          />
        </View>
      ) : null}
      <View style={styles.row}>
        <Button
          label="📷 Prendre"
          variant="outline"
          style={styles.flex}
          onPress={() => choosePhoto('camera')}
        />
        <Button
          label="🖼️ Galerie"
          variant="outline"
          style={styles.flex}
          onPress={() => choosePhoto('library')}
        />
      </View>

      <Text style={styles.label}>Catégorie *</Text>
      <View style={styles.chips}>
        {CATEGORIES.map(c => (
          <Chip
            key={c.value}
            label={c.label}
            color={categoryColors[c.value]}
            selected={category === c.value}
            onPress={() => edit(setCategory)(c.value)}
          />
        ))}
      </View>

      <View style={styles.labelRow}>
        <Text style={[styles.label, styles.labelInRow]}>Cuissons</Text>
        <Button
          label="Gérer la liste"
          variant="link"
          size="sm"
          style={styles.rowLink}
          onPress={() => navigation.navigate('CookingMethods')}
        />
      </View>
      <View style={styles.chips}>
        {cookingMethods.map(m => (
          <Chip
            key={m.id}
            label={m.name}
            selected={cookingMethodIds.includes(m.id)}
            onPress={() =>
              edit(setCookingMethodIds)(
                cookingMethodIds.includes(m.id)
                  ? cookingMethodIds.filter(id => id !== m.id)
                  : [...cookingMethodIds, m.id],
              )
            }
          />
        ))}
      </View>

      <Text style={styles.label}>Temps de préparation (minutes)</Text>
      <Input
        style={styles.shortInput}
        value={prepText}
        onChangeText={text => edit(setPrepText)(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="30"
      />

      <View style={[styles.chips, styles.favorite]}>
        <Chip
          label={isFavorite ? '★ Favori' : '☆ Ajouter aux favoris'}
          color={colors.accent}
          showDot={false}
          selected={isFavorite}
          onPress={() => edit(setIsFavorite)(!isFavorite)}
        />
      </View>

      <Text style={styles.label}>Ingrédients</Text>
      {ingredients.map(row => (
        <View key={row.key} style={styles.ingredient}>
          <View style={styles.row}>
            <Input
              style={styles.ingredientName}
              value={row.name}
              onChangeText={name => updateIngredient(row.key, { name })}
              onFocus={() => setFocusedIngredient(row.key)}
              onBlur={() => setFocusedIngredient(null)}
              placeholder="Ingrédient"
            />
            <Input
              style={styles.quantity}
              value={row.quantity}
              onChangeText={quantity => updateIngredient(row.key, { quantity })}
              placeholder="Quantité"
            />
            <Button
              label="✕"
              variant="ghost"
              size="icon"
              accessibilityLabel="Retirer l'ingrédient"
              onPress={() =>
                edit(setIngredients)(
                  ingredients.length > 1
                    ? ingredients.filter(r => r.key !== row.key)
                    : [newIngredientRow()],
                )
              }
            />
          </View>
          {focusedIngredient === row.key ? (
            <View style={[styles.chips, styles.suggestions]}>
              {suggestionsFor(row).map(s => (
                <Chip
                  key={s.id}
                  label={s.name}
                  selected={false}
                  onPress={() => updateIngredient(row.key, { name: s.name })}
                />
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <Button
        label="+ Ajouter un ingrédient"
        variant="secondary"
        size="sm"
        style={styles.addButton}
        onPress={() =>
          edit(setIngredients)([...ingredients, newIngredientRow()])
        }
      />

      <Text style={styles.label}>Étapes</Text>
      {steps.map((row, index) => (
        <View key={row.key} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Input
            style={styles.flex}
            value={row.text}
            onChangeText={text => updateStep(row.key, text)}
            placeholder="Décris l'étape…"
            multiline
          />
          <View>
            <Button
              label="▲"
              variant="ghost"
              size="iconSm"
              disabled={index === 0}
              accessibilityLabel="Monter l'étape"
              onPress={() => moveStep(index, -1)}
            />
            <Button
              label="▼"
              variant="ghost"
              size="iconSm"
              disabled={index === steps.length - 1}
              accessibilityLabel="Descendre l'étape"
              onPress={() => moveStep(index, 1)}
            />
            <Button
              label="✕"
              variant="ghost"
              size="iconSm"
              accessibilityLabel="Retirer l'étape"
              onPress={() =>
                edit(setSteps)(
                  steps.length > 1
                    ? steps.filter(r => r.key !== row.key)
                    : [newStepRow()],
                )
              }
            />
          </View>
        </View>
      ))}
      <Button
        label="+ Ajouter une étape"
        variant="secondary"
        size="sm"
        style={styles.addButton}
        onPress={() => edit(setSteps)([...steps, newStepRow()])}
      />

      <Button
        label="Enregistrer"
        size="lg"
        loading={saving}
        style={styles.save}
        onPress={save}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  firstLabel: {
    marginTop: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  labelInRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  rowLink: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoBox: {
    marginBottom: spacing.sm,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
  },
  removePhoto: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  shortInput: {
    width: 120,
  },
  favorite: {
    marginTop: spacing.lg,
  },
  ingredient: {
    marginBottom: spacing.sm,
  },
  ingredientName: {
    flex: 3,
  },
  quantity: {
    flex: 2,
  },
  suggestions: {
    marginTop: spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  save: {
    marginTop: spacing.xxl,
  },
});
