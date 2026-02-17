import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhaseStatus from '../components/PhaseStatus';
import CycleHistory from '../components/CycleHistory';
import { I18nProvider } from '../i18n/context';
import { usePeriodStore } from '../stores/periodStore';
import { db } from '../db';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

beforeEach(async () => {
  await db.periods.clear();
  await db.steps.clear();
  await db.meta.clear();
  // Reset store to empty state
  usePeriodStore.setState({
    periods: [],
    prediction: null,
    cycleDay: null,
    futureCycles: [],
    phase: null,
    loading: false,
    error: null,
  });
  // Reset language to English for consistent test output
  localStorage.setItem('lua-language', 'en');
});

describe('PhaseStatus', () => {
  it('shows empty state when no periods', () => {
    renderWithI18n(<PhaseStatus />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows cycle day when periods exist', () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today.getTime() - 5 * 86400000);
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: fiveDaysAgo.toISOString().slice(0, 10), endDate: null }],
      cycleDay: { day: 6, total: 28, daysUntilNext: null, stale: false, lastPeriodDate: fiveDaysAgo.toISOString().slice(0, 10) },
    });
    renderWithI18n(<PhaseStatus />);
    expect(screen.getByText('Day 6')).toBeInTheDocument();
  });

  it('shows stale data message when data is old', () => {
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: '2022-01-01', endDate: '2022-01-04' }],
      cycleDay: { day: 800, total: 28, daysUntilNext: null, stale: true, lastPeriodDate: '2022-01-01' },
    });
    renderWithI18n(<PhaseStatus />);
    expect(screen.getByText('No recent periods')).toBeInTheDocument();
  });

  it('shows "log one more" message for single period', () => {
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: '2023-01-01', endDate: '2023-01-04' }],
      cycleDay: { day: 10, total: 28, daysUntilNext: null, stale: false, lastPeriodDate: '2023-01-01' },
    });
    renderWithI18n(<PhaseStatus />);
    expect(screen.getByText('Log one more period for predictions')).toBeInTheDocument();
  });
});

describe('CycleHistory', () => {
  it('shows empty state when no completed periods', () => {
    renderWithI18n(<CycleHistory />);
    expect(screen.getByText('No cycle data')).toBeInTheDocument();
  });

  it('shows cycle history with dot-bar when data exists', () => {
    usePeriodStore.setState({
      periods: [
        { id: 1, startDate: '2023-01-01', endDate: '2023-01-04' },
        { id: 2, startDate: '2023-01-29', endDate: '2023-02-01' },
        { id: 3, startDate: '2023-02-26', endDate: '2023-03-01' },
      ],
      prediction: {
        predictedStart: '2023-03-26',
        predictedEnd: '2023-03-29',
        avgCycleLength: 28,
        avgPeriodDuration: 4,
        confidence: 'high',
        stddev: 0,
        daysLate: 0,
      },
    });
    renderWithI18n(<CycleHistory />);
    // Should show year header
    expect(screen.getByText('2023')).toBeInTheDocument();
    // Should show legend
    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Fertile')).toBeInTheDocument();
    expect(screen.getByText('Ovulation')).toBeInTheDocument();
  });

  it('shows only single period in empty cycle state', () => {
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: '2023-01-01', endDate: '2023-01-04' }],
      prediction: null,
    });
    renderWithI18n(<CycleHistory />);
    // One completed period shows as one cycle
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('respects limit prop', () => {
    usePeriodStore.setState({
      periods: [
        { id: 1, startDate: '2023-01-01', endDate: '2023-01-04' },
        { id: 2, startDate: '2023-01-29', endDate: '2023-02-01' },
        { id: 3, startDate: '2023-02-26', endDate: '2023-03-01' },
        { id: 4, startDate: '2023-03-26', endDate: '2023-03-29' },
        { id: 5, startDate: '2023-04-23', endDate: '2023-04-26' },
      ],
      prediction: {
        predictedStart: '2023-05-21',
        predictedEnd: '2023-05-24',
        avgCycleLength: 28,
        avgPeriodDuration: 4,
        confidence: 'high',
        stddev: 0,
        daysLate: 0,
      },
    });
    const { container } = renderWithI18n(<CycleHistory limit={2} />);
    const items = container.querySelectorAll('.cycle-item');
    expect(items.length).toBe(2);
  });
});
