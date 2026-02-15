import { addDays, subDays, differenceInDays, parseISO, format } from 'date-fns';
import type { Period, CyclePrediction, FertilityWindow, CycleInfo } from '../types';

function weightedAverage(values: number[], maxCount: number): number {
  const slice = values.slice(-maxCount);
  const weights = slice.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = slice.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function predictNextPeriod(
  periods: Period[],
  windowSize: number = 6
): CyclePrediction | null {
  const sorted = [...periods]
    .filter((p) => p.endDate !== null)
    .sort(
      (a, b) =>
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

  if (sorted.length < 2) return null;

  // Calculate cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = differenceInDays(
      parseISO(sorted[i].startDate),
      parseISO(sorted[i - 1].startDate)
    );
    if (len > 0 && len < 90) cycleLengths.push(len);
  }

  if (cycleLengths.length === 0) return null;

  // Calculate period durations
  const durations = sorted.map((p) =>
    differenceInDays(parseISO(p.endDate!), parseISO(p.startDate)) + 1
  );

  const avgCycleLength = Math.round(weightedAverage(cycleLengths, windowSize));
  const avgPeriodDuration = Math.round(
    weightedAverage(durations, windowSize)
  );

  const lastPeriod = sorted[sorted.length - 1];
  const predictedStart = addDays(parseISO(lastPeriod.startDate), avgCycleLength);
  const predictedEnd = addDays(predictedStart, avgPeriodDuration - 1);

  const sd = stddev(cycleLengths.slice(-windowSize));
  const confidence: CyclePrediction['confidence'] =
    sd <= 2 ? 'high' : sd <= 5 ? 'medium' : 'low';

  return {
    predictedStart: format(predictedStart, 'yyyy-MM-dd'),
    predictedEnd: format(predictedEnd, 'yyyy-MM-dd'),
    avgCycleLength,
    avgPeriodDuration,
    confidence,
    stddev: Math.round(sd * 10) / 10,
  };
}

export function getDayOfCycle(
  periods: Period[],
  prediction?: CyclePrediction | null
): {
  day: number;
  total: number;
  daysUntilNext: number | null;
  stale: boolean;
  lastPeriodDate: string;
} | null {
  const sorted = [...periods].sort(
    (a, b) =>
      parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
  );

  if (sorted.length === 0) return null;

  const lastPeriod = sorted[0];
  const today = new Date();
  const lastStart = parseISO(lastPeriod.startDate);
  const day = differenceInDays(today, lastStart) + 1;

  if (day < 1) return null;

  // Use pre-computed prediction if provided, otherwise compute
  const pred = prediction !== undefined ? prediction : predictNextPeriod(periods);
  const total = pred?.avgCycleLength ?? 28;
  const daysUntilNext = pred
    ? differenceInDays(parseISO(pred.predictedStart), today)
    : null;

  // Data is stale if cycle day exceeds 2x predicted cycle length
  const stale = day > total * 2;

  return { day, total, daysUntilNext, stale, lastPeriodDate: lastPeriod.startDate };
}

/**
 * Estimate fertility window for a cycle.
 * Ovulation is ~14 days before the next period start.
 * Fertile window is ~6 days ending on ovulation day.
 */
export function estimateFertilityWindow(
  cycleStartDate: string,
  cycleLength: number
): FertilityWindow | null {
  // Need a reasonable cycle length for estimation
  if (cycleLength < 18 || cycleLength > 50) return null;

  const start = parseISO(cycleStartDate);
  const ovulationDayNum = cycleLength - 14;

  // Ovulation must be at least a few days into the cycle
  if (ovulationDayNum < 5) return null;

  const ovulation = addDays(start, ovulationDayNum);
  const fertileStart = subDays(ovulation, 5);
  const fertileEnd = ovulation;

  return {
    fertileStart: format(fertileStart, 'yyyy-MM-dd'),
    fertileEnd: format(fertileEnd, 'yyyy-MM-dd'),
    ovulationDay: format(ovulation, 'yyyy-MM-dd'),
  };
}

/**
 * Build structured cycle info array from period data.
 * Each cycle includes: dates, lengths, fertility window estimate.
 */
export function buildCycleHistory(
  periods: Period[],
  prediction?: CyclePrediction | null
): CycleInfo[] {
  const completed = [...periods]
    .filter((p) => p.endDate !== null)
    .sort(
      (a, b) =>
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

  if (completed.length === 0) return [];

  // Use pre-computed prediction if provided, otherwise compute
  const pred = prediction !== undefined ? prediction : predictNextPeriod(periods);
  const cycles: CycleInfo[] = [];

  for (let i = 0; i < completed.length; i++) {
    const p = completed[i];
    const periodDur = differenceInDays(parseISO(p.endDate!), parseISO(p.startDate)) + 1;

    let cycleLen: number;
    let estimated = false;
    if (i < completed.length - 1) {
      cycleLen = differenceInDays(
        parseISO(completed[i + 1].startDate),
        parseISO(p.startDate)
      );
    } else {
      // Last cycle: use prediction or fallback — mark as estimated
      cycleLen = pred?.avgCycleLength ?? 28;
      estimated = true;
    }

    // Skip unreasonable cycle lengths
    const validCycleLen = cycleLen > 0 && cycleLen < 90;
    const fertility = validCycleLen
      ? estimateFertilityWindow(p.startDate, cycleLen)
      : null;

    cycles.push({
      startDate: p.startDate,
      endDate: p.endDate,
      cycleLength: validCycleLen ? cycleLen : 0,
      periodDuration: periodDur,
      fertility,
      estimated,
    });
  }

  return cycles;
}
