export interface Period {
  id?: number;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string | null; // null = ongoing
  notes?: string;
}

export interface StepEntry {
  id?: number;
  date: string; // ISO date string YYYY-MM-DD
  steps: number;
}

export interface AppMeta {
  key: string;
  value: string;
}

export interface CyclePrediction {
  predictedStart: string;
  predictedEnd: string;
  avgCycleLength: number;
  avgPeriodDuration: number;
  confidence: 'high' | 'medium' | 'low';
  stddev: number;
  daysLate: number;
}

export interface FertilityWindow {
  fertileStart: string; // ISO date string
  fertileEnd: string;   // ISO date string
  ovulationDay: string; // ISO date string
}

export interface CycleInfo {
  startDate: string;
  endDate: string | null;
  cycleLength: number;
  periodDuration: number;
  fertility: FertilityWindow | null;
  /** True when cycleLength is estimated (last cycle, not yet completed) */
  estimated: boolean;
}

/** Cycle phase in the 5-phase model */
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'premenstrual';

/** Phase info returned by getCyclePhase() */
export interface PhaseInfo {
  phase: CyclePhase;
  dayInPhase: number;
  phaseDays: number;
}

/** Multi-cycle prediction: one future cycle */
export interface FutureCycle {
  cycleNumber: number;
  predictedStart: string;
  predictedEnd: string;
  fertility: FertilityWindow | null;
  avgCycleLength: number;
  avgPeriodDuration: number;
}

/** App screen for navigation */
export type Screen = 'home' | 'calendar' | 'edit' | 'settings';

/** Calendar sub-view */
export type CalendarViewMode = 'month' | 'year';

/** Supported languages */
export type Language = 'ru' | 'en';
