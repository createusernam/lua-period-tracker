import { describe, it, expect, beforeEach } from 'vitest';
import { db, initializeDatabase } from '../db';
import { seedPeriods } from '../data/seedPeriods';

beforeEach(async () => {
  await db.periods.clear();
  await db.steps.clear();
  await db.meta.clear();
});

describe('initializeDatabase', () => {
  it('opens database without errors', async () => {
    await initializeDatabase();
    expect(db.isOpen()).toBe(true);
  });

  it('does not auto-seed data', async () => {
    await initializeDatabase();
    const count = await db.periods.count();
    expect(count).toBe(0);
  });

  it('can be called multiple times safely', async () => {
    await initializeDatabase();
    await initializeDatabase();
    expect(db.isOpen()).toBe(true);
  });
});

describe('seedPeriods data integrity', () => {
  it('has correct number of periods', () => {
    expect(seedPeriods.length).toBe(40);
  });

  it('all periods have valid date format', () => {
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    for (const p of seedPeriods) {
      expect(p.startDate).toMatch(dateRe);
      expect(p.endDate).toMatch(dateRe);
    }
  });

  it('all periods have endDate >= startDate', () => {
    for (const p of seedPeriods) {
      expect(p.endDate! >= p.startDate).toBe(true);
    }
  });

  it('periods are in chronological order', () => {
    for (let i = 1; i < seedPeriods.length; i++) {
      expect(seedPeriods[i].startDate > seedPeriods[i - 1].startDate).toBe(true);
    }
  });

  it('covers years 2022-2025', () => {
    const years = new Set(seedPeriods.map((p) => p.startDate.slice(0, 4)));
    expect(years).toEqual(new Set(['2022', '2023', '2024', '2025']));
  });
});
