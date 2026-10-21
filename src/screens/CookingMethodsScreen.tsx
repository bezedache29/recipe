import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { colors, fontSize, radius, spacing } from '../theme';
import {
  CookingMethodWithUsage,
  createCookingMethod,
  deleteCookingMethod,
  listCookingMethods,
  renameCookingMethod,
} from '../db/cookingMethods';

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

export default function CookingMethodsScreen() {
  const [methods, setMethods] = useState<CookingMethodWithUsage[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const insets = useSafeAreaInsets();

  const load = useCallback(() => {
    listCookingMethods().then(setMethods);
  }, []);

  useEffect(load, [load]);

  const add = async () => {
    if (!newName.trim()) {
      return;
    }
    try {
      await createCookingMethod(newName);
      setNewName('');
      load();
    } catch (e) {
      Alert.alert('Impossible d’ajouter', errorMessage(e));
    }
  };

  const saveRename = async () => {
    if (editingId == null) {
      return;
    }
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await renameCookingMethod(editingId, editingName);
      setEditingId(null);
      load();
    } catch (e) {
      Alert.alert('Impossible de renommer', errorMessage(e));
    }
  };

  const confirmDelete = (method: CookingMethodWithUsage) => {
    const usage =
      method.recipeCount > 0
        ? `\n\nElle est utilisée par ${method.recipeCount} recette${
            method.recipeCount > 1 ? 's' : ''
          } : elle en sera retirée (les recettes ne sont pas supprimées).`
        : '';
    Alert.alert(`Supprimer « ${method.name} » ?`, usage.trim() || undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteCookingMethod(method.id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <Input
          style={styles.flex}
          value={newName}
          onChangeText={setNewName}
          placeholder="Nouvelle cuisson (ex. : Plancha)"
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Button label="Ajouter" onPress={add} />
      </View>

      <Text style={styles.hint}>Touche une cuisson pour la renommer.</Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={methods}
        keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps="handled"
        style={[styles.list, { marginBottom: spacing.lg + insets.bottom }]}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) =>
          editingId === item.id ? (
            <View style={styles.item}>
              <Input
                style={styles.flex}
                value={editingName}
                onChangeText={setEditingName}
                onSubmitEditing={saveRename}
                autoFocus
              />
              <Button label="OK" size="sm" onPress={saveRename} />
              <Button
                label="Annuler"
                variant="ghost"
                size="sm"
                onPress={() => setEditingId(null)}
              />
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              onPress={() => {
                setEditingId(item.id);
                setEditingName(item.name);
              }}
            >
              <View style={styles.flex}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.count}>
                  {item.recipeCount === 0
                    ? 'Aucune recette'
                    : `${item.recipeCount} recette${
                        item.recipeCount > 1 ? 's' : ''
                      }`}
                </Text>
              </View>
              <Button
                label={`Supprimer ${item.name}`}
                icon={X}
                variant="ghost"
                size="icon"
                onPress={() => confirmDelete(item)}
              />
            </Pressable>
          )
        }
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    backgroundColor: colors.muted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  name: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
