import { create } from 'zustand';
import { db } from '../db';
import type { Period, CyclePrediction, FutureCycle, PhaseInfo, CycleInfo } from '../types';
import { predictNextPeriod, getDayOfCycle, predictNextNPeriods, getCyclePhase, buildCycleHistory } from '../services/predictions';
import { buildDateSets, type CalendarDateSets } from '../services/calendarSets';
import { uploadAfterMutation } from '../services/syncService';

interface PeriodState {
  periods: Period[];
  prediction: CyclePrediction | null;
  cycleDay: { day: number; total: number; daysUntilNext: number | null; stale: boolean; lastPeriodDate: string } | null;
  futureCycles: FutureCycle[];
  phase: PhaseInfo | null;
  cycles: CycleInfo[];
  dateSets: CalendarDateSets;
  loading: boolean;
  error: string | null;

  loadPeriods: () => Promise<void>;
  addPeriod: (period: Omit<Period, 'id'>) => Promise<void>;
  updatePeriod: (id: number, updates: Partial<Period>) => Promise<void>;
  deletePeriod: (id: number) => Promise<void>;
  getOngoingPeriod: () => Period | null;
}

let loadingPromise: Promise<void> | null = null;

const EMPTY_CYCLES: CycleInfo[] = [];
const EMPTY_DATE_SETS: CalendarDateSets = {
  periodDates: new Set(),
  predictedPeriodDates: new Set(),
  pastFertilityDates: new Set(),
  futureFertilityDates: new Set(),
  pastOvulationDates: new Set(),
  futureOvulationDates: new Set(),
};

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periods: [],
  prediction: null,
  cycleDay: null,
  futureCycles: [],
  phase: null,
  cycles: EMPTY_CYCLES,
  dateSets: EMPTY_DATE_SETS,
  loading: true,
  error: null,

  loadPeriods: async () => {
    // Deduplicate concurrent loads
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      try {
        const periods = await db.periods.toArray();
        const sorted = [...periods].sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        const prediction = predictNextPeriod(sorted);
        const cycleDay = getDayOfCycle(sorted, prediction);
        const futureCycles = predictNextNPeriods(sorted, 12, 6);
        const phase = cycleDay && prediction
          ? getCyclePhase(cycleDay.day, prediction.avgCycleLength, prediction.avgPeriodDuration)
          : null;
        const cycles = buildCycleHistory(sorted, prediction);
        const dateSets = buildDateSets(sorted, prediction, futureCycles);
        set({
          periods: sorted,
          prediction,
          cycleDay,
          futureCycles,
          phase,
          cycles,
          dateSets,
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load data',
        });
      } finally {
        loadingPromise = null;
      }
    })();
    return loadingPromise;
  },

  addPeriod: async (period) => {
    try {
      await db.periods.add({ ...period });
      await get().loadPeriods();
      uploadAfterMutation();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save period' });
      throw err;
    }
  },

  updatePeriod: async (id, updates) => {
    try {
      await db.periods.update(id, updates);
      await get().loadPeriods();
      uploadAfterMutation();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update period' });
      throw err;
    }
  },

  deletePeriod: async (id) => {
    try {
      await db.periods.delete(id);
      await get().loadPeriods();
      uploadAfterMutation();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete period' });
      throw err;
    }
  },

  getOngoingPeriod: () => {
    return get().periods.find((p) => p.endDate === null) ?? null;
  },
}));
