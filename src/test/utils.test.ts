import { describe, it, expect } from 'vitest';
import { formatDateRange, periodDuration, toDateString, cycleLengthBetween } from '../utils';

const today = new Date();

describe('formatDateRange', () => {
  it('formats same-month range', () => {
    expect(formatDateRange('2023-06-07', '2023-06-09')).toBe('Jun 7–9, 2023');
  });

  it('formats cross-month range', () => {
    expect(formatDateRange('2021-06-28', '2021-07-01')).toBe('Jun 28 – Jul 1, 2021');
  });

  it('formats ongoing period', () => {
    const result = formatDateRange('2023-12-01', null);
    expect(result).toContain('Dec 1, 2023');
    expect(result).toContain('Ongoing');
  });

  it('handles single-day period', () => {
    expect(formatDateRange('2023-05-10', '2023-05-10')).toBe('May 10–10, 2023');
  });
});

describe('periodDuration', () => {
  it('calculates correct duration', () => {
    expect(periodDuration('2023-06-07', '2023-06-09')).toBe(3);
  });

  it('handles single-day period', () => {
    expect(periodDuration('2023-06-07', '2023-06-07')).toBe(1);
  });

  it('handles ongoing period (null end)', () => {
    const fiveDaysAgo = new Date(today.getTime() - 5 * 86400000);
    const result = periodDuration(toDateString(fiveDaysAgo), null);
    expect(result).toBe(6);
  });
});

describe('toDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date(2023, 5, 7); // June 7, 2023
    expect(toDateString(date)).toBe('2023-06-07');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2023, 0, 1); // Jan 1
    expect(toDateString(date)).toBe('2023-01-01');
  });
});

describe('cycleLengthBetween', () => {
  it('calculates days between two period starts', () => {
    expect(cycleLengthBetween('2023-01-29', '2023-01-01')).toBe(28);
  });

  it('handles cross-month', () => {
    expect(cycleLengthBetween('2023-02-27', '2023-01-29')).toBe(29);
  });
});
