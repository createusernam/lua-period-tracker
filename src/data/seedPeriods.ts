import type { Period } from '../types';

/**
 * Synthetic demo data for testing and development.
 * These are algorithmically generated periods with realistic
 * cycle lengths (25-33 days) and durations (3-5 days).
 * NO real personal data.
 */
export const seedPeriods: Omit<Period, 'id'>[] = [
  // 2022
  { startDate: '2022-01-05', endDate: '2022-01-08' },
  { startDate: '2022-02-02', endDate: '2022-02-05' },
  { startDate: '2022-03-04', endDate: '2022-03-07' },
  { startDate: '2022-04-01', endDate: '2022-04-03' },
  { startDate: '2022-04-30', endDate: '2022-05-03' },
  { startDate: '2022-05-28', endDate: '2022-05-31' },
  { startDate: '2022-06-27', endDate: '2022-06-30' },
  { startDate: '2022-07-25', endDate: '2022-07-28' },
  { startDate: '2022-08-24', endDate: '2022-08-27' },
  { startDate: '2022-09-22', endDate: '2022-09-24' },
  { startDate: '2022-10-21', endDate: '2022-10-24' },
  { startDate: '2022-11-20', endDate: '2022-11-23' },
  { startDate: '2022-12-19', endDate: '2022-12-21' },

  // 2023
  { startDate: '2023-01-17', endDate: '2023-01-20' },
  { startDate: '2023-02-15', endDate: '2023-02-18' },
  { startDate: '2023-03-16', endDate: '2023-03-18' },
  { startDate: '2023-04-14', endDate: '2023-04-17' },
  { startDate: '2023-05-13', endDate: '2023-05-16' },
  { startDate: '2023-06-12', endDate: '2023-06-14' },
  { startDate: '2023-07-10', endDate: '2023-07-13' },
  { startDate: '2023-08-09', endDate: '2023-08-12' },
  { startDate: '2023-09-08', endDate: '2023-09-10' },
  { startDate: '2023-10-07', endDate: '2023-10-10' },
  { startDate: '2023-11-06', endDate: '2023-11-09' },
  { startDate: '2023-12-05', endDate: '2023-12-07' },

  // 2024
  { startDate: '2024-01-03', endDate: '2024-01-06' },
  { startDate: '2024-02-01', endDate: '2024-02-04' },
  { startDate: '2024-03-02', endDate: '2024-03-04' },
  { startDate: '2024-03-31', endDate: '2024-04-03' },
  { startDate: '2024-04-29', endDate: '2024-05-01' },
  { startDate: '2024-05-28', endDate: '2024-05-31' },
  { startDate: '2024-06-27', endDate: '2024-06-29' },
  { startDate: '2024-07-26', endDate: '2024-07-29' },
  { startDate: '2024-08-25', endDate: '2024-08-27' },
  { startDate: '2024-09-23', endDate: '2024-09-26' },
  { startDate: '2024-10-22', endDate: '2024-10-24' },
  { startDate: '2024-11-20', endDate: '2024-11-23' },
  { startDate: '2024-12-19', endDate: '2024-12-22' },

  // 2025
  { startDate: '2025-01-17', endDate: '2025-01-19' },
  { startDate: '2025-02-14', endDate: '2025-02-17' },
];
