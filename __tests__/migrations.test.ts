/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import { MIGRATIONS } from '../src/db/database';

jest.mock('@op-engineering/op-sqlite', () => ({ open: jest.fn() }));

const migrate = (db: DatabaseSync, from: number, to: number) => {
  for (let v = from; v < to; v++) {
    for (const statement of MIGRATIONS[v]) {
      db.exec(statement);
    }
  }
};

describe('migration v3: several categories per recipe', () => {
  it('keeps the category of recipes saved before', () => {
    const db = new DatabaseSync(':memory:');
    migrate(db, 0, 2);
    db.exec(
      `INSERT INTO recipes (title, title_key, category, created_at, updated_at)
       VALUES ('Gratin', 'gratin', 'plat', 0, 0), ('Tarte', 'tarte', 'dessert', 0, 0)`,
    );

    migrate(db, 2, 3);

    const rows = db
      .prepare(
        `SELECT r.title, rc.category FROM recipes r
         JOIN recipe_categories rc ON rc.recipe_id = r.id ORDER BY r.title`,
      )
      .all()
      .map(r => ({ ...r }));
    expect(rows).toEqual([
      { title: 'Gratin', category: 'plat' },
      { title: 'Tarte', category: 'dessert' },
    ]);
    const columns = db
      .prepare('PRAGMA table_info(recipes)')
      .all()
      .map(c => c.name);
    expect(columns).not.toContain('category');
  });
});
