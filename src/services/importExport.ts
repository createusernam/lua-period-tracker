import { parseISO, isValid } from 'date-fns';
import { db } from '../db';
import type { Period } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function exportData(): Promise<string> {
  const periods = await db.periods.toArray();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    periods: periods.map(({ id, ...rest }) => rest),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<number> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid file format');
  }

  const periods: Omit<Period, 'id'>[] = (data as Record<string, unknown>).periods as Omit<Period, 'id'>[] ?? [];
  if (!Array.isArray(periods) || periods.length === 0) {
    throw new Error('No periods found in file');
  }

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (!p.startDate || !DATE_RE.test(p.startDate)) {
      throw new Error(`Period ${i + 1}: invalid start date`);
    }
    // Semantic date validation: regex passes but date itself is invalid (e.g. Feb 30)
    const parsedStart = parseISO(p.startDate);
    if (!isValid(parsedStart)) {
      throw new Error(`Period ${i + 1}: invalid start date`);
    }
    if (p.endDate !== null && p.endDate !== undefined) {
      if (!DATE_RE.test(p.endDate)) {
        throw new Error(`Period ${i + 1}: invalid end date`);
      }
      const parsedEnd = parseISO(p.endDate);
      if (!isValid(parsedEnd)) {
        throw new Error(`Period ${i + 1}: invalid end date`);
      }
      if (p.endDate < p.startDate) {
        throw new Error(`Period ${i + 1}: end date before start date`);
      }
    }
  }

  // Atomic replace: clear existing data, then insert imported periods
  await db.transaction('rw', db.periods, async () => {
    await db.periods.clear();
    await db.periods.bulkAdd(
      periods.map((p) => ({
        startDate: p.startDate,
        endDate: p.endDate ?? null,
      }))
    );
  });
  return periods.length;
}

export async function clearAllData(): Promise<void> {
  await db.periods.clear();
  await db.steps.clear();
  await db.meta.clear();
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
