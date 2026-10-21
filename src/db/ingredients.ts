import { Ingredient } from '../types';
import { getDb } from './database';

/** Ingredients used by at least one recipe, for the filters screen. */
export const listIngredients = async (): Promise<Ingredient[]> => {
  const { rows } = await getDb().execute(
    'SELECT id, name FROM ingredients ORDER BY name_key',
  );
  return rows.map(r => ({ id: Number(r.id), name: String(r.name) }));
};
