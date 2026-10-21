import { DB, open } from '@op-engineering/op-sqlite';

/**
 * Each entry upgrades the schema by one version. Never edit an entry that has
 * already shipped: add a new one at the end instead.
 */
export const MIGRATIONS: string[][] = [
  // v1 — initial schema
  [
    `CREATE TABLE recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_key TEXT NOT NULL,
      photo_path TEXT,
      category TEXT NOT NULL CHECK (category IN ('entree', 'plat', 'dessert', 'encas')),
      prep_minutes INTEGER CHECK (prep_minutes IS NULL OR prep_minutes >= 0),
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    'CREATE INDEX idx_recipes_category ON recipes (category)',
    'CREATE INDEX idx_recipes_favorite ON recipes (is_favorite)',

    `CREATE TABLE cooking_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE
    )`,
    `CREATE TABLE recipe_cooking_methods (
      recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
      cooking_method_id INTEGER NOT NULL REFERENCES cooking_methods (id) ON DELETE CASCADE,
      PRIMARY KEY (recipe_id, cooking_method_id)
    )`,
    'CREATE INDEX idx_rcm_method ON recipe_cooking_methods (cooking_method_id)',

    `CREATE TABLE ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE
    )`,
    `CREATE TABLE recipe_ingredients (
      recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients (id),
      quantity TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL,
      PRIMARY KEY (recipe_id, position)
    )`,
    'CREATE INDEX idx_ri_ingredient ON recipe_ingredients (ingredient_id)',

    `CREATE TABLE steps (
      recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (recipe_id, position)
    )`,

    `INSERT INTO cooking_methods (name, name_key) VALUES
      ('Four', 'four'),
      ('Poêle', 'poele'),
      ('Casserole', 'casserole'),
      ('Cocotte', 'cocotte'),
      ('Vapeur', 'vapeur'),
      ('Barbecue', 'barbecue'),
      ('Friteuse', 'friteuse'),
      ('Micro-ondes', 'micro-ondes'),
      ('Sans cuisson', 'sans cuisson')`,
  ],
  // v2 — healthy / normal / rich; existing recipes become "normal"
  [
    `ALTER TABLE recipes ADD COLUMN balance TEXT NOT NULL DEFAULT 'normal'
      CHECK (balance IN ('healthy', 'normal', 'rich'))`,
    'CREATE INDEX idx_recipes_balance ON recipes (balance)',
  ],
  // v3 — a recipe can belong to several categories (e.g. starter and main)
  [
    `CREATE TABLE recipe_categories (
      recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('entree', 'plat', 'dessert', 'encas')),
      PRIMARY KEY (recipe_id, category)
    )`,
    'CREATE INDEX idx_rc_category ON recipe_categories (category)',
    'INSERT INTO recipe_categories (recipe_id, category) SELECT id, category FROM recipes',
    'DROP INDEX idx_recipes_category',
    'ALTER TABLE recipes DROP COLUMN category',
  ],
];

let db: DB | null = null;

export const getDb = (): DB => {
  if (!db) {
    throw new Error('Database not initialised: call initDatabase() first');
  }
  return db;
};

export const initDatabase = async () => {
  if (db) {
    return;
  }
  const instance = open({ name: 'recipes.sqlite' });
  // SQLite ignores foreign keys (and ON DELETE CASCADE) unless enabled per connection.
  await instance.execute('PRAGMA foreign_keys = ON');

  const { rows } = await instance.execute('PRAGMA user_version');
  const currentVersion = Number(rows[0]?.user_version ?? 0);

  for (let v = currentVersion; v < MIGRATIONS.length; v++) {
    await instance.transaction(async tx => {
      for (const statement of MIGRATIONS[v]) {
        await tx.execute(statement);
      }
      await tx.execute(`PRAGMA user_version = ${v + 1}`);
    });
  }

  db = instance;
};
