import {
  parseISO,
  addDays,
  eachDayOfInterval,
  min as dateMin,
  startOfDay,
} from 'date-fns';
import { buildCycleHistory } from './predictions';
import { toDateString } from '../utils';
import type { Period, CyclePrediction, FutureCycle } from '../types';

export interface CalendarDateSets {
  periodDates: Set<string>;
  predictedPeriodDates: Set<string>;
  pastFertilityDates: Set<string>;
  futureFertilityDates: Set<string>;
  pastOvulationDates: Set<string>;
  futureOvulationDates: Set<string>;
}

export function buildDateSets(
  periods: Period[],
  prediction: CyclePrediction | null,
  futureCycles: FutureCycle[]
): CalendarDateSets {
  const todayStr = toDateString(startOfDay(new Date()));
  const now = new Date();

  // Period dates (logged)
  const periodDates = new Set<string>();
  for (const p of periods) {
    const start = parseISO(p.startDate);
    const end = p.endDate ? parseISO(p.endDate) : dateMin([addDays(start, 14), now]);
    eachDayOfInterval({ start, end }).forEach((d) => periodDates.add(toDateString(d)));
  }

  // Predicted period dates (from futureCycles, only >= today)
  const predictedPeriodDates = new Set<string>();
  for (const fc of futureCycles) {
    const start = parseISO(fc.predictedStart);
    const end = parseISO(fc.predictedEnd);
    if (start > end) continue;
    eachDayOfInterval({ start, end }).forEach((d) => {
      const key = toDateString(d);
      if (key >= todayStr && !periodDates.has(key)) predictedPeriodDates.add(key);
    });
  }

  // Past fertility/ovulation from cycle history
  const pastFertilityDates = new Set<string>();
  const pastOvulationDates = new Set<string>();
  const cycles = buildCycleHistory(periods, prediction);
  for (const c of cycles) {
    if (!c.fertility) continue;
    eachDayOfInterval({
      start: parseISO(c.fertility.fertileStart),
      end: parseISO(c.fertility.fertileEnd),
    }).forEach((d) => {
      const key = toDateString(d);
      if (!periodDates.has(key)) pastFertilityDates.add(key);
    });
    const ovKey = c.fertility.ovulationDay;
    if (!periodDates.has(ovKey)) pastOvulationDates.add(ovKey);
  }

  // Future fertility/ovulation from futureCycles (only >= today)
  const futureFertilityDates = new Set<string>();
  const futureOvulationDates = new Set<string>();
  for (const fc of futureCycles) {
    if (!fc.fertility) continue;
    eachDayOfInterval({
      start: parseISO(fc.fertility.fertileStart),
      end: parseISO(fc.fertility.fertileEnd),
    }).forEach((d) => {
      const key = toDateString(d);
      if (key >= todayStr && !periodDates.has(key) && !pastFertilityDates.has(key)) {
        futureFertilityDates.add(key);
      }
    });
    const ovKey = fc.fertility.ovulationDay;
    if (ovKey >= todayStr && !periodDates.has(ovKey) && !pastOvulationDates.has(ovKey)) {
      futureOvulationDates.add(ovKey);
    }
  }

  return {
    periodDates,
    predictedPeriodDates,
    pastFertilityDates,
    futureFertilityDates,
    pastOvulationDates,
    futureOvulationDates,
  };
}
