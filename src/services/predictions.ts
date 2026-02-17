import { addDays, subDays, differenceInDays, parseISO, format } from 'date-fns';
import type { Period, CyclePrediction, FertilityWindow, CycleInfo, FutureCycle, PhaseInfo } from '../types';

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
  const completed = [...periods]
    .filter((p) => p.endDate !== null)
    .sort(
      (a, b) =>
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    );

  if (completed.length < 2) return null;

  // Calculate cycle lengths from completed periods
  const cycleLengths: number[] = [];
  for (let i = 1; i < completed.length; i++) {
    const len = differenceInDays(
      parseISO(completed[i].startDate),
      parseISO(completed[i - 1].startDate)
    );
    if (len > 0 && len < 90) cycleLengths.push(len);
  }

  if (cycleLengths.length === 0) return null;

  // Include ongoing period in cycle length data (use most recent if multiple)
  const ongoing = [...periods]
    .filter((p) => p.endDate === null)
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())[0] ?? null;
  if (ongoing) {
    const lastCompleted = completed[completed.length - 1];
    const lenToOngoing = differenceInDays(
      parseISO(ongoing.startDate),
      parseISO(lastCompleted.startDate)
    );
    if (lenToOngoing > 0 && lenToOngoing < 90) {
      cycleLengths.push(lenToOngoing);
    }
  }

  // Calculate period durations (completed only)
  const durations = completed.map((p) =>
    differenceInDays(parseISO(p.endDate!), parseISO(p.startDate)) + 1
  );

  const avgCycleLength = Math.round(weightedAverage(cycleLengths, windowSize));
  const avgPeriodDuration = Math.round(
    weightedAverage(durations, windowSize)
  );

  // Anchor on ongoing period if it's more recent than last completed, otherwise last completed
  const lastCompletedStart = parseISO(completed[completed.length - 1].startDate);
  const anchor = ongoing && parseISO(ongoing.startDate) > lastCompletedStart
    ? parseISO(ongoing.startDate)
    : lastCompletedStart;
  const predictedStart = addDays(anchor, avgCycleLength);
  const predictedEnd = addDays(predictedStart, avgPeriodDuration - 1);

  // Calculate days late
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLate = predictedStart < today
    ? differenceInDays(today, predictedStart)
    : 0;

  const sd = stddev(cycleLengths.slice(-windowSize));
  let confidence: CyclePrediction['confidence'] =
    sd <= 2 ? 'high' : sd <= 5 ? 'medium' : 'low';

  // Lower confidence when period is late
  if (daysLate > 0) confidence = 'low';

  return {
    predictedStart: format(predictedStart, 'yyyy-MM-dd'),
    predictedEnd: format(predictedEnd, 'yyyy-MM-dd'),
    avgCycleLength,
    avgPeriodDuration,
    confidence,
    stddev: Math.round(sd * 10) / 10,
    daysLate,
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
 * Ovulation is ~14 days before the next period start (luteal phase ~14 days).
 * Fertile window: 4 days before ovulation + ovulation day + 2 days after.
 * Based on: sperm survives up to 5 days, egg viable ~24h after ovulation.
 * Matches Flo's calculation model.
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
  const fertileStart = subDays(ovulation, 4);
  const fertileEnd = addDays(ovulation, 2);

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

/**
 * Generate N future cycle predictions.
 * Each cycle chains forward from the previous using the same weighted average.
 */
export function predictNextNPeriods(
  periods: Period[],
  n: number = 12,
  windowSize: number = 6
): FutureCycle[] {
  const basePrediction = predictNextPeriod(periods, windowSize);
  if (!basePrediction) return [];

  const results: FutureCycle[] = [];
  const avgCycle = basePrediction.avgCycleLength;

  // If prediction is in the past (period late), shift chain forward to today
  let currentStart = basePrediction.daysLate > 0
    ? format(new Date(), 'yyyy-MM-dd')
    : basePrediction.predictedStart;
  const avgPeriod = basePrediction.avgPeriodDuration;

  for (let i = 0; i < n; i++) {
    const start = parseISO(currentStart);
    const end = addDays(start, avgPeriod - 1);
    const fertility = estimateFertilityWindow(currentStart, avgCycle);

    results.push({
      cycleNumber: i + 1,
      predictedStart: currentStart,
      predictedEnd: format(end, 'yyyy-MM-dd'),
      fertility,
      avgCycleLength: avgCycle,
      avgPeriodDuration: avgPeriod,
    });

    currentStart = format(addDays(start, avgCycle), 'yyyy-MM-dd');
  }

  return results;
}

/**
 * Determine the current cycle phase based on day of cycle.
 * 5-phase model: menstrual → follicular → ovulation → luteal → premenstrual.
 * Ovulation estimated at cycleLength - 14 (luteal phase is ~14 days).
 */
export function getCyclePhase(
  dayOfCycle: number,
  cycleLength: number,
  periodDuration: number = 5
): PhaseInfo | null {
  if (dayOfCycle < 1 || cycleLength < 18) return null;

  const ovulationDay = cycleLength - 14;

  // Guard: if ovulation falls during or before period ends, model breaks down
  if (ovulationDay <= periodDuration) return null;

  const premenstrualStart = cycleLength - 3;

  // Menstrual phase
  if (dayOfCycle <= periodDuration) {
    return {
      phase: 'menstrual',
      dayInPhase: dayOfCycle,
      phaseDays: periodDuration,
    };
  }

  // Follicular phase
  if (dayOfCycle < ovulationDay) {
    return {
      phase: 'follicular',
      dayInPhase: dayOfCycle - periodDuration,
      phaseDays: ovulationDay - periodDuration - 1,
    };
  }

  // Ovulation (single day)
  if (dayOfCycle === ovulationDay) {
    return {
      phase: 'ovulation',
      dayInPhase: 1,
      phaseDays: 1,
    };
  }

  // Luteal phase
  if (dayOfCycle < premenstrualStart) {
    return {
      phase: 'luteal',
      dayInPhase: dayOfCycle - ovulationDay,
      phaseDays: premenstrualStart - ovulationDay - 1,
    };
  }

  // Premenstrual (including overdue days past cycleLength)
  return {
    phase: 'premenstrual',
    dayInPhase: dayOfCycle - premenstrualStart + 1,
    phaseDays: cycleLength - premenstrualStart + 1,
  };
}
