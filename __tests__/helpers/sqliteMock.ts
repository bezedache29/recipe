/// <reference types="node" />
/**
 * Replaces op-sqlite (which needs an Android device) by Node's built-in SQLite,
 * so the real SQL of the app can be tested on the computer.
 */
import { DatabaseSync } from 'node:sqlite';

export const createFakeOpSqlite = () => {
  const sqlite = new DatabaseSync(':memory:');

  const execute = async (sql: string, params: unknown[] = []) => {
    const statement = sqlite.prepare(sql);
    const args = params as any[];
    if (statement.columns().length > 0) {
      const rows = statement.all(...args).map(r => ({ ...r }));
      return { rows, rowsAffected: 0 };
    }
    const result = statement.run(...args);
    return {
      rows: [],
      rowsAffected: Number(result.changes),
      insertId: Number(result.lastInsertRowid),
    };
  };

  const db = {
    execute,
    transaction: async (
      fn: (tx: { execute: typeof execute }) => Promise<void>,
    ) => {
      sqlite.exec('BEGIN');
      try {
        await fn({ execute });
        sqlite.exec('COMMIT');
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };

  return { open: () => db };
};
