import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { exportData, importData, clearAllData } from '../services/importExport';

beforeEach(async () => {
  await db.periods.clear();
  await db.steps.clear();
  await db.meta.clear();
});

describe('importData', () => {
  it('imports valid JSON', async () => {
    const json = JSON.stringify({
      version: 1,
      periods: [
        { startDate: '2023-01-01', endDate: '2023-01-04' },
        { startDate: '2023-02-01', endDate: '2023-02-04' },
      ],
    });
    const count = await importData(json);
    expect(count).toBe(2);
    expect(await db.periods.count()).toBe(2);
  });

  it('rejects invalid JSON', async () => {
    await expect(importData('not json')).rejects.toThrow('Invalid JSON file');
  });

  it('rejects empty periods array', async () => {
    await expect(importData(JSON.stringify({ periods: [] }))).rejects.toThrow('No periods found');
  });

  it('rejects missing startDate', async () => {
    const json = JSON.stringify({
      periods: [{ endDate: '2023-01-04' }],
    });
    await expect(importData(json)).rejects.toThrow('invalid start date');
  });

  it('rejects invalid date format', async () => {
    const json = JSON.stringify({
      periods: [{ startDate: 'not-a-date', endDate: '2023-01-04' }],
    });
    await expect(importData(json)).rejects.toThrow('invalid start date');
  });

  it('rejects endDate before startDate', async () => {
    const json = JSON.stringify({
      periods: [{ startDate: '2023-01-10', endDate: '2023-01-04' }],
    });
    await expect(importData(json)).rejects.toThrow('end date before start date');
  });

  it('accepts periods with null endDate (ongoing)', async () => {
    const json = JSON.stringify({
      periods: [{ startDate: '2023-01-01', endDate: null }],
    });
    const count = await importData(json);
    expect(count).toBe(1);
  });
});

describe('exportData', () => {
  it('exports all periods as JSON', async () => {
    await db.periods.add({ startDate: '2023-01-01', endDate: '2023-01-04' });
    await db.periods.add({ startDate: '2023-02-01', endDate: '2023-02-04' });

    const json = await exportData();
    const data = JSON.parse(json);

    expect(data.version).toBe(1);
    expect(data.exportedAt).toBeDefined();
    expect(data.periods).toHaveLength(2);
    // Should not include id
    expect(data.periods[0].id).toBeUndefined();
    expect(data.periods[0].startDate).toBe('2023-01-01');
  });
});

describe('clearAllData', () => {
  it('removes all data', async () => {
    await db.periods.add({ startDate: '2023-01-01', endDate: '2023-01-04' });
    await db.meta.put({ key: 'test', value: 'true' });

    await clearAllData();

    expect(await db.periods.count()).toBe(0);
    expect(await db.meta.count()).toBe(0);
  });
});
