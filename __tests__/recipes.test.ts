import { EMPTY_FILTERS } from '../src/constants';
import {
  createCookingMethod,
  deleteCookingMethod,
  listCookingMethods,
  renameCookingMethod,
} from '../src/db/cookingMethods';
import { initDatabase } from '../src/db/database';
import { listIngredients } from '../src/db/ingredients';
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  searchRecipes,
  setFavorite,
  updateRecipe,
} from '../src/db/recipes';
import { RecipeFilters, RecipeInput } from '../src/types';

jest.mock('@op-engineering/op-sqlite', () =>
  require('./helpers/sqliteMock').createFakeOpSqlite(),
);

const methodId = async (name: string) =>
  (await listCookingMethods()).find(m => m.name === name)!.id;

const ingredientId = async (name: string) =>
  (await listIngredients()).find(i => i.name === name)!.id;

const search = async (filters: Partial<RecipeFilters>) =>
  (await searchRecipes({ ...EMPTY_FILTERS, ...filters })).map(r => r.title);

const recipe = (overrides: Partial<RecipeInput>): RecipeInput => ({
  title: 'Sans titre',
  photoPath: null,
  category: 'plat',
  prepMinutes: null,
  isFavorite: false,
  cookingMethodIds: [],
  ingredients: [],
  steps: [],
  ...overrides,
});

let gratinId: number;

beforeAll(async () => {
  await initDatabase();
  const four = await methodId('Four');
  const poele = await methodId('Poêle');

  gratinId = await createRecipe(
    recipe({
      title: 'Gratin dauphinois',
      category: 'plat',
      prepMinutes: 30,
      cookingMethodIds: [four],
      ingredients: [
        { name: 'Pommes de terre', quantity: '1 kg' },
        { name: 'Crème', quantity: '50 cl' },
      ],
      steps: ['Éplucher', 'Cuire 1 h'],
    }),
  );
  await createRecipe(
    recipe({
      title: 'Omelette',
      category: 'plat',
      prepMinutes: 10,
      isFavorite: true,
      cookingMethodIds: [poele],
      ingredients: [
        { name: 'Œufs', quantity: '3' },
        { name: 'creme', quantity: '1 c. à s.' },
      ],
    }),
  );
  await createRecipe(
    recipe({
      title: 'Crème brûlée',
      category: 'dessert',
      prepMinutes: 20,
      cookingMethodIds: [four, poele],
      ingredients: [
        { name: 'Oeufs', quantity: '4' },
        { name: 'Sucre', quantity: '100 g' },
      ],
    }),
  );
  await createRecipe(
    recipe({ title: 'Salade 100% verte', category: 'entree' }),
  );
});

describe('recipes', () => {
  it('reads back a full recipe', async () => {
    const r = await getRecipe(gratinId);
    expect(r).toMatchObject({
      title: 'Gratin dauphinois',
      category: 'plat',
      prepMinutes: 30,
      cookingNames: ['Four'],
      ingredients: [
        { name: 'Pommes de terre', quantity: '1 kg' },
        { name: 'Crème', quantity: '50 cl' },
      ],
      steps: ['Éplucher', 'Cuire 1 h'],
    });
  });

  it('stores an ingredient once, whatever the accents or case', async () => {
    const names = (await listIngredients()).map(i => i.name);
    // "Crème" / "creme" and "Œufs" / "Oeufs" are merged.
    expect(names).toHaveLength(4);
  });
});

describe('filters', () => {
  it('returns everything without filters', async () => {
    expect(await search({})).toHaveLength(4);
  });

  it('searches titles without caring about accents', async () => {
    expect(await search({ search: 'creme brulee' })).toEqual(['Crème brûlée']);
  });

  it('searches ingredient names too', async () => {
    expect((await search({ search: 'oeuf', sort: 'title' })).sort()).toEqual([
      'Crème brûlée',
      'Omelette',
    ]);
  });

  it('treats % as a normal character', async () => {
    expect(await search({ search: '100%' })).toEqual(['Salade 100% verte']);
    expect(await search({ search: '%' })).toEqual(['Salade 100% verte']);
  });

  it('filters by any of the selected categories', async () => {
    expect(
      await search({ categories: ['dessert', 'entree'], sort: 'title' }),
    ).toEqual(['Crème brûlée', 'Salade 100% verte']);
  });

  it('filters by any of the selected cooking methods', async () => {
    const four = await methodId('Four');
    expect(await search({ cookingMethodIds: [four], sort: 'title' })).toEqual([
      'Crème brûlée',
      'Gratin dauphinois',
    ]);
  });

  it('requires all the selected ingredients', async () => {
    const oeufs = await ingredientId('Œufs');
    const creme = await ingredientId('Crème');
    expect(await search({ ingredientIds: [oeufs, creme] })).toEqual([
      'Omelette',
    ]);
  });

  it('filters by max preparation time, ignoring recipes without one', async () => {
    expect(await search({ maxPrepMinutes: 20, sort: 'prep' })).toEqual([
      'Omelette',
      'Crème brûlée',
    ]);
  });

  it('filters favorites and combines filters', async () => {
    expect(await search({ favoritesOnly: true })).toEqual(['Omelette']);
    expect(
      await search({ favoritesOnly: true, categories: ['dessert'] }),
    ).toEqual([]);
  });

  it('sorts by prep time with unknown times last', async () => {
    const titles = await search({ sort: 'prep' });
    expect(titles[titles.length - 1]).toBe('Salade 100% verte');
  });
});

describe('updates and deletions', () => {
  it('toggles favorite', async () => {
    await setFavorite(gratinId, true);
    expect((await getRecipe(gratinId))!.isFavorite).toBe(true);
  });

  it('replaces children on update and removes unused ingredients', async () => {
    const r = (await getRecipe(gratinId))!;
    await updateRecipe(gratinId, {
      ...r,
      ingredients: [{ name: 'Pommes de terre', quantity: '800 g' }],
      steps: ['Tout faire'],
    });
    const updated = (await getRecipe(gratinId))!;
    expect(updated.ingredients).toEqual([
      { name: 'Pommes de terre', quantity: '800 g' },
    ]);
    expect(updated.steps).toEqual(['Tout faire']);
    // "Crème" is still used by the omelette, so it stays.
    expect((await listIngredients()).map(i => i.name)).toContain('Crème');
  });

  it('manages cooking methods and unlinks deleted ones', async () => {
    await createCookingMethod('Plancha');
    await expect(createCookingMethod('plancha')).rejects.toThrow('existe déjà');
    const poele = await methodId('Poêle');
    await expect(renameCookingMethod(poele, 'Four')).rejects.toThrow();
    await renameCookingMethod(poele, 'Poêle à frire');
    await deleteCookingMethod(poele);
    const brulee = (
      await searchRecipes({ ...EMPTY_FILTERS, search: 'brulee' })
    )[0];
    expect(brulee.cookingNames).toEqual(['Four']);
  });

  it('deletes a recipe with its children', async () => {
    await deleteRecipe(gratinId);
    expect(await getRecipe(gratinId)).toBeNull();
    expect((await listIngredients()).map(i => i.name)).not.toContain(
      'Pommes de terre',
    );
  });
});
