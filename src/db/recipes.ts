import { Scalar, Transaction } from '@op-engineering/op-sqlite';
import {
  Balance,
  Category,
  Recipe,
  RecipeFilters,
  RecipeInput,
  RecipeSummary,
} from '../types';
import { toSearchKey } from '../utils/text';
import { getDb } from './database';

const placeholders = (count: number) => new Array(count).fill('?').join(', ');

/** Escapes % and _ so a user typing them does not trigger LIKE wildcards. */
const likePattern = (value: string) =>
  `%${value.replace(/[\\%_]/g, c => `\\${c}`)}%`;

const SUMMARY_COLUMNS = `
  r.id, r.title, r.photo_path, r.category, r.balance, r.prep_minutes,
  r.is_favorite,
  (SELECT GROUP_CONCAT(cm.name, '|')
     FROM recipe_cooking_methods rcm
     JOIN cooking_methods cm ON cm.id = rcm.cooking_method_id
     WHERE rcm.recipe_id = r.id) AS cooking_names`;

const toSummary = (row: Record<string, Scalar>): RecipeSummary => ({
  id: Number(row.id),
  title: String(row.title),
  photoPath: row.photo_path ? String(row.photo_path) : null,
  category: row.category as Category,
  balance: row.balance as Balance,
  prepMinutes: row.prep_minutes == null ? null : Number(row.prep_minutes),
  isFavorite: Number(row.is_favorite) === 1,
  cookingNames: row.cooking_names ? String(row.cooking_names).split('|') : [],
});

const ORDER_BY: Record<RecipeFilters['sort'], string> = {
  recent: 'r.created_at DESC',
  title: 'r.title_key ASC',
  // Recipes without a prep time go last.
  prep: 'r.prep_minutes IS NULL, r.prep_minutes ASC, r.title_key ASC',
};

/**
 * Builds the WHERE clause from the filters. Every active filter narrows the
 * results (AND), except inside a group where it makes sense to widen:
 * - categories: any of the selected ones
 * - balances: any of the selected ones
 * - cooking methods: any of the selected ones
 * - ingredients: ALL of the selected ones ("I have chicken AND rice")
 */
export const searchRecipes = async (
  filters: RecipeFilters,
): Promise<RecipeSummary[]> => {
  const where: string[] = [];
  const params: Scalar[] = [];

  const search = toSearchKey(filters.search);
  if (search) {
    // Matches the title or any ingredient name.
    where.push(`(r.title_key LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM recipe_ingredients ri
                 JOIN ingredients i ON i.id = ri.ingredient_id
                 WHERE ri.recipe_id = r.id AND i.name_key LIKE ? ESCAPE '\\'))`);
    params.push(likePattern(search), likePattern(search));
  }

  if (filters.categories.length > 0) {
    where.push(`r.category IN (${placeholders(filters.categories.length)})`);
    params.push(...filters.categories);
  }

  if (filters.balances.length > 0) {
    where.push(`r.balance IN (${placeholders(filters.balances.length)})`);
    params.push(...filters.balances);
  }

  if (filters.cookingMethodIds.length > 0) {
    where.push(`EXISTS (SELECT 1 FROM recipe_cooking_methods rcm
      WHERE rcm.recipe_id = r.id
        AND rcm.cooking_method_id IN (${placeholders(
          filters.cookingMethodIds.length,
        )}))`);
    params.push(...filters.cookingMethodIds);
  }

  for (const ingredientId of filters.ingredientIds) {
    where.push(`EXISTS (SELECT 1 FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id AND ri.ingredient_id = ?)`);
    params.push(ingredientId);
  }

  if (filters.maxPrepMinutes != null) {
    where.push('r.prep_minutes IS NOT NULL AND r.prep_minutes <= ?');
    params.push(filters.maxPrepMinutes);
  }

  if (filters.favoritesOnly) {
    where.push('r.is_favorite = 1');
  }

  const sql = `SELECT ${SUMMARY_COLUMNS}
    FROM recipes r
    ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${ORDER_BY[filters.sort]}`;

  const { rows } = await getDb().execute(sql, params);
  return rows.map(toSummary);
};

export const countRecipes = async () => {
  const { rows } = await getDb().execute('SELECT COUNT(*) AS n FROM recipes');
  return Number(rows[0]?.n ?? 0);
};

export const getRecipe = async (id: number): Promise<Recipe | null> => {
  const db = getDb();
  const { rows } = await db.execute(
    `SELECT ${SUMMARY_COLUMNS} FROM recipes r WHERE r.id = ?`,
    [id],
  );
  if (rows.length === 0) {
    return null;
  }

  const [methods, ingredients, steps] = await Promise.all([
    db.execute(
      'SELECT cooking_method_id FROM recipe_cooking_methods WHERE recipe_id = ?',
      [id],
    ),
    db.execute(
      `SELECT i.name, ri.quantity FROM recipe_ingredients ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = ? ORDER BY ri.position`,
      [id],
    ),
    db.execute('SELECT text FROM steps WHERE recipe_id = ? ORDER BY position', [
      id,
    ]),
  ]);

  return {
    ...toSummary(rows[0]),
    cookingMethodIds: methods.rows.map(r => Number(r.cooking_method_id)),
    ingredients: ingredients.rows.map(r => ({
      name: String(r.name),
      quantity: String(r.quantity),
    })),
    steps: steps.rows.map(r => String(r.text)),
  };
};

/** Replaces the cooking methods, ingredients and steps of a recipe. */
const writeChildren = async (
  tx: Transaction,
  recipeId: number,
  input: RecipeInput,
) => {
  await tx.execute('DELETE FROM recipe_cooking_methods WHERE recipe_id = ?', [
    recipeId,
  ]);
  await tx.execute('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [
    recipeId,
  ]);
  await tx.execute('DELETE FROM steps WHERE recipe_id = ?', [recipeId]);

  for (const methodId of input.cookingMethodIds) {
    await tx.execute(
      'INSERT INTO recipe_cooking_methods (recipe_id, cooking_method_id) VALUES (?, ?)',
      [recipeId, methodId],
    );
  }

  for (const [position, ingredient] of input.ingredients.entries()) {
    const name = ingredient.name.trim();
    const key = toSearchKey(name);
    // One row per ingredient name: "Œufs" typed twice shares the same id,
    // which is what makes the ingredient filter work.
    await tx.execute(
      'INSERT INTO ingredients (name, name_key) VALUES (?, ?) ON CONFLICT (name_key) DO NOTHING',
      [name, key],
    );
    const { rows } = await tx.execute(
      'SELECT id FROM ingredients WHERE name_key = ?',
      [key],
    );
    await tx.execute(
      'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, position) VALUES (?, ?, ?, ?)',
      [recipeId, Number(rows[0].id), ingredient.quantity.trim(), position],
    );
  }

  for (const [position, text] of input.steps.entries()) {
    await tx.execute(
      'INSERT INTO steps (recipe_id, position, text) VALUES (?, ?, ?)',
      [recipeId, position, text.trim()],
    );
  }
};

/** Removes ingredients no longer used by any recipe, so filters stay clean. */
const pruneIngredients = (tx: Transaction) =>
  tx.execute(
    'DELETE FROM ingredients WHERE id NOT IN (SELECT ingredient_id FROM recipe_ingredients)',
  );

export const createRecipe = async (input: RecipeInput): Promise<number> => {
  let recipeId = 0;
  await getDb().transaction(async tx => {
    const now = Date.now();
    const result = await tx.execute(
      `INSERT INTO recipes
        (title, title_key, photo_path, category, balance, prep_minutes, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title.trim(),
        toSearchKey(input.title),
        input.photoPath,
        input.category,
        input.balance,
        input.prepMinutes,
        input.isFavorite ? 1 : 0,
        now,
        now,
      ],
    );
    recipeId = Number(result.insertId);
    await writeChildren(tx, recipeId, input);
  });
  return recipeId;
};

export const updateRecipe = async (id: number, input: RecipeInput) => {
  await getDb().transaction(async tx => {
    await tx.execute(
      `UPDATE recipes SET
        title = ?, title_key = ?, photo_path = ?, category = ?, balance = ?,
        prep_minutes = ?, is_favorite = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.title.trim(),
        toSearchKey(input.title),
        input.photoPath,
        input.category,
        input.balance,
        input.prepMinutes,
        input.isFavorite ? 1 : 0,
        Date.now(),
        id,
      ],
    );
    await writeChildren(tx, id, input);
    await pruneIngredients(tx);
  });
};

export const deleteRecipe = async (id: number) => {
  await getDb().transaction(async tx => {
    await tx.execute('DELETE FROM recipes WHERE id = ?', [id]);
    await pruneIngredients(tx);
  });
};

export const setFavorite = async (id: number, isFavorite: boolean) => {
  await getDb().execute('UPDATE recipes SET is_favorite = ? WHERE id = ?', [
    isFavorite ? 1 : 0,
    id,
  ]);
};
