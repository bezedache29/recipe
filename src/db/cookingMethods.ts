import { CookingMethod } from '../types';
import { toSearchKey } from '../utils/text';
import { getDb } from './database';

export type CookingMethodWithUsage = CookingMethod & { recipeCount: number };

export const listCookingMethods = async (): Promise<
  CookingMethodWithUsage[]
> => {
  const { rows } = await getDb().execute(
    `SELECT cm.id, cm.name, COUNT(rcm.recipe_id) AS recipe_count
     FROM cooking_methods cm
     LEFT JOIN recipe_cooking_methods rcm ON rcm.cooking_method_id = cm.id
     GROUP BY cm.id
     ORDER BY cm.name_key`,
  );
  return rows.map(r => ({
    id: Number(r.id),
    name: String(r.name),
    recipeCount: Number(r.recipe_count),
  }));
};

/** Throws a readable error when another cooking method already has this name. */
const assertNameAvailable = async (name: string, exceptId?: number) => {
  const { rows } = await getDb().execute(
    'SELECT id FROM cooking_methods WHERE name_key = ? AND id != ?',
    [toSearchKey(name), exceptId ?? -1],
  );
  if (rows.length > 0) {
    throw new Error(`La cuisson « ${name} » existe déjà.`);
  }
};

export const createCookingMethod = async (name: string) => {
  const clean = name.trim();
  await assertNameAvailable(clean);
  await getDb().execute(
    'INSERT INTO cooking_methods (name, name_key) VALUES (?, ?)',
    [clean, toSearchKey(clean)],
  );
};

export const renameCookingMethod = async (id: number, name: string) => {
  const clean = name.trim();
  await assertNameAvailable(clean, id);
  await getDb().execute(
    'UPDATE cooking_methods SET name = ?, name_key = ? WHERE id = ?',
    [clean, toSearchKey(clean), id],
  );
};

/** Also unlinks it from every recipe that used it (ON DELETE CASCADE). */
export const deleteCookingMethod = async (id: number) => {
  await getDb().execute('DELETE FROM cooking_methods WHERE id = ?', [id]);
};
