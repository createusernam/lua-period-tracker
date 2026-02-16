import { describe, it, expect } from 'vitest';
import { getCyclePhase, predictNextNPeriods } from '../services/predictions';
import { computePeriodChanges } from '../components/ScrollCalendar';
import type { Period } from '../types';

describe('getCyclePhase', () => {
  // 28-day cycle, 5-day period: ovulation=14, premenstrual=25
  it('returns menstrual for days 1-5', () => {
    const p = getCyclePhase(1, 28, 5);
    expect(p).toEqual({ phase: 'menstrual', dayInPhase: 1, phaseDays: 5 });
    const p5 = getCyclePhase(5, 28, 5);
    expect(p5).toEqual({ phase: 'menstrual', dayInPhase: 5, phaseDays: 5 });
  });

  it('returns follicular for days 6-13', () => {
    const p = getCyclePhase(6, 28, 5);
    expect(p?.phase).toBe('follicular');
    expect(p?.dayInPhase).toBe(1);
    const p13 = getCyclePhase(13, 28, 5);
    expect(p13?.phase).toBe('follicular');
    expect(p13?.dayInPhase).toBe(8);
    expect(p13?.phaseDays).toBe(8);
  });

  it('returns ovulation on day 14', () => {
    const p = getCyclePhase(14, 28, 5);
    expect(p).toEqual({ phase: 'ovulation', dayInPhase: 1, phaseDays: 1 });
  });

  it('returns luteal for days 15-24', () => {
    const p = getCyclePhase(15, 28, 5);
    expect(p?.phase).toBe('luteal');
    expect(p?.dayInPhase).toBe(1);
    const p24 = getCyclePhase(24, 28, 5);
    expect(p24?.phase).toBe('luteal');
    expect(p24?.dayInPhase).toBe(10);
    expect(p24?.phaseDays).toBe(10);
  });

  it('returns premenstrual for days 25-28', () => {
    const p = getCyclePhase(25, 28, 5);
    expect(p?.phase).toBe('premenstrual');
    expect(p?.dayInPhase).toBe(1);
    const p28 = getCyclePhase(28, 28, 5);
    expect(p28?.phase).toBe('premenstrual');
    expect(p28?.dayInPhase).toBe(4);
    expect(p28?.phaseDays).toBe(4);
  });

  it('returns premenstrual for overdue days (day > cycleLength)', () => {
    const p = getCyclePhase(30, 28, 5);
    expect(p?.phase).toBe('premenstrual');
    expect(p?.dayInPhase).toBe(6);
  });

  it('returns null for cycleLength < 18', () => {
    expect(getCyclePhase(1, 17, 5)).toBeNull();
  });

  it('returns null for dayOfCycle < 1', () => {
    expect(getCyclePhase(0, 28, 5)).toBeNull();
  });

  it('returns null when ovulationDay <= periodDuration (short cycle guard)', () => {
    // cycleLength=20, periodDuration=7: ovulationDay=6, <= 7
    expect(getCyclePhase(1, 20, 7)).toBeNull();
  });

  it('handles 21-day cycle (shortest normal)', () => {
    // ovulationDay=7, periodDuration=4
    const p = getCyclePhase(7, 21, 4);
    expect(p?.phase).toBe('ovulation');
  });

  it('handles 35-day cycle (longest normal)', () => {
    // ovulationDay=21, premenstrualStart=32
    const p = getCyclePhase(21, 35, 5);
    expect(p?.phase).toBe('ovulation');
    const p32 = getCyclePhase(32, 35, 5);
    expect(p32?.phase).toBe('premenstrual');
  });
});

describe('predictNextNPeriods', () => {
  const basePeriods: Period[] = [
    { id: 1, startDate: '2023-01-01', endDate: '2023-01-04' },
    { id: 2, startDate: '2023-01-29', endDate: '2023-02-01' },
    { id: 3, startDate: '2023-02-26', endDate: '2023-03-01' },
  ];

  it('generates requested number of future cycles', () => {
    const result = predictNextNPeriods(basePeriods, 5);
    expect(result).toHaveLength(5);
  });

  it('generates 12 cycles by default', () => {
    const result = predictNextNPeriods(basePeriods);
    expect(result).toHaveLength(12);
  });

  it('chains cycles forward (each starts avgCycle days after previous)', () => {
    const result = predictNextNPeriods(basePeriods, 3);
    for (let i = 1; i < result.length; i++) {
      const prevStart = new Date(result[i - 1].predictedStart);
      const currStart = new Date(result[i].predictedStart);
      const diff = Math.round((currStart.getTime() - prevStart.getTime()) / 86400000);
      expect(diff).toBe(result[i].avgCycleLength);
    }
  });

  it('includes fertility windows', () => {
    const result = predictNextNPeriods(basePeriods, 1);
    expect(result[0].fertility).not.toBeNull();
    expect(result[0].fertility?.ovulationDay).toBeTruthy();
  });

  it('returns empty array for fewer than 2 completed periods', () => {
    expect(predictNextNPeriods([{ id: 1, startDate: '2023-01-01', endDate: '2023-01-04' }])).toEqual([]);
  });

  it('returns empty array for empty periods', () => {
    expect(predictNextNPeriods([])).toEqual([]);
  });

  it('cycle numbers are sequential', () => {
    const result = predictNextNPeriods(basePeriods, 4);
    expect(result.map((r) => r.cycleNumber)).toEqual([1, 2, 3, 4]);
  });
});

describe('computePeriodChanges', () => {
  const periods: Period[] = [
    { id: 1, startDate: '2023-01-01', endDate: '2023-01-04' },
    { id: 2, startDate: '2023-01-29', endDate: '2023-02-01' },
  ];

  it('returns no changes when selection matches existing periods', () => {
    const selected = new Set([
      '2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04',
      '2023-01-29', '2023-01-30', '2023-01-31', '2023-02-01',
    ]);
    const changes = computePeriodChanges(periods, selected);
    expect(changes).toEqual([]);
  });

  it('detects a new period (add)', () => {
    const selected = new Set([
      '2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04',
      '2023-01-29', '2023-01-30', '2023-01-31', '2023-02-01',
      '2023-03-01', '2023-03-02', '2023-03-03',
    ]);
    const changes = computePeriodChanges(periods, selected);
    const adds = changes.filter((c) => c.action === 'add');
    expect(adds).toHaveLength(1);
    expect(adds[0].period.startDate).toBe('2023-03-01');
    expect(adds[0].period.endDate).toBe('2023-03-03');
  });

  it('detects a deleted period', () => {
    // Keep only first period
    const selected = new Set([
      '2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04',
    ]);
    const changes = computePeriodChanges(periods, selected);
    const deletes = changes.filter((c) => c.action === 'delete');
    expect(deletes).toHaveLength(1);
    expect(deletes[0].period.id).toBe(2);
  });

  it('detects an updated period (extended)', () => {
    const selected = new Set([
      '2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05',
      '2023-01-29', '2023-01-30', '2023-01-31', '2023-02-01',
    ]);
    const changes = computePeriodChanges(periods, selected);
    const updates = changes.filter((c) => c.action === 'update');
    expect(updates).toHaveLength(1);
    expect(updates[0].period.id).toBe(1);
    expect(updates[0].period.endDate).toBe('2023-01-05');
  });

  it('handles empty selection (deletes all)', () => {
    const changes = computePeriodChanges(periods, new Set());
    const deletes = changes.filter((c) => c.action === 'delete');
    expect(deletes).toHaveLength(2);
  });

  it('handles empty periods with new selection', () => {
    const selected = new Set(['2023-05-01', '2023-05-02']);
    const changes = computePeriodChanges([], selected);
    expect(changes).toHaveLength(1);
    expect(changes[0].action).toBe('add');
    expect(changes[0].period.startDate).toBe('2023-05-01');
    expect(changes[0].period.endDate).toBe('2023-05-02');
  });

  it('handles period split (deselect middle day)', () => {
    const selected = new Set([
      '2023-01-01', '2023-01-02',
      // gap: '2023-01-03' deselected
      '2023-01-04',
      '2023-01-29', '2023-01-30', '2023-01-31', '2023-02-01',
    ]);
    const changes = computePeriodChanges(periods, selected);
    // Original period 1 (Jan 1-4) should be updated to Jan 1-2
    // Jan 4 becomes a new period (add)
    const updates = changes.filter((c) => c.action === 'update');
    const adds = changes.filter((c) => c.action === 'add');
    expect(updates.length + adds.length).toBeGreaterThanOrEqual(2);
  });

  it('groups consecutive days into single ranges', () => {
    const selected = new Set([
      '2023-06-01', '2023-06-02', '2023-06-03',
      '2023-06-10', '2023-06-11',
    ]);
    const changes = computePeriodChanges([], selected);
    expect(changes).toHaveLength(2);
    expect(changes[0].period.startDate).toBe('2023-06-01');
    expect(changes[0].period.endDate).toBe('2023-06-03');
    expect(changes[1].period.startDate).toBe('2023-06-10');
    expect(changes[1].period.endDate).toBe('2023-06-11');
  });
});
