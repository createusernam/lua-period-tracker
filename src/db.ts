import Dexie, { type Table } from 'dexie';
import type { Period, StepEntry, AppMeta } from './types';

class LuaDatabase extends Dexie {
  periods!: Table<Period, number>;
  steps!: Table<StepEntry, number>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super('lua-period-tracker');

    this.version(1).stores({
      periods: '++id, startDate, endDate',
      steps: '++id, date',
      meta: 'key',
    });
  }
}

export const db = new LuaDatabase();

export async function initializeDatabase(): Promise<void> {
  // Database tables are created automatically by Dexie.
  // No auto-seeding — user imports their own data via Settings > Import.
  await db.open();
}
