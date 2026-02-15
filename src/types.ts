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

export type Tab = 'calendar' | 'history';
export type CycleFilter = 'all' | 'last3' | 'last6';
