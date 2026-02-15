import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CycleStatus from '../components/CycleStatus';
import CycleHistory from '../components/CycleHistory';
import TabBar from '../components/TabBar';
import { usePeriodStore } from '../stores/periodStore';
import { db } from '../db';

beforeEach(async () => {
  await db.periods.clear();
  await db.steps.clear();
  await db.meta.clear();
  // Reset store to empty state
  usePeriodStore.setState({
    periods: [],
    prediction: null,
    cycleDay: null,
    loading: false,
    error: null,
  });
});

describe('CycleStatus', () => {
  it('shows empty state when no periods', () => {
    render(<CycleStatus />);
    expect(screen.getByText('No periods logged')).toBeInTheDocument();
    expect(screen.getByText('Import or log your first period')).toBeInTheDocument();
  });

  it('shows cycle day when periods exist', () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today.getTime() - 5 * 86400000);
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: fiveDaysAgo.toISOString().slice(0, 10), endDate: null }],
      cycleDay: { day: 6, total: 28, daysUntilNext: null, stale: false, lastPeriodDate: fiveDaysAgo.toISOString().slice(0, 10) },
    });
    render(<CycleStatus />);
    expect(screen.getByText('Day 6 of ~28')).toBeInTheDocument();
  });

  it('shows stale data message when data is old', () => {
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: '2022-01-01', endDate: '2022-01-04' }],
      cycleDay: { day: 800, total: 28, daysUntilNext: null, stale: true, lastPeriodDate: '2022-01-01' },
    });
    render(<CycleStatus />);
    expect(screen.getByText('No recent periods')).toBeInTheDocument();
  });

  it('shows "log one more" message for single period', () => {
    usePeriodStore.setState({
      periods: [{ id: 1, startDate: '2023-01-01', endDate: '2023-01-04' }],
      cycleDay: { day: 10, total: 28, daysUntilNext: null, stale: false, lastPeriodDate: '2023-01-01' },
    });
    render(<CycleStatus />);
    expect(screen.getByText('Log one more period for predictions')).toBeInTheDocument();
  });
});

describe('CycleHistory', () => {
  it('shows empty state when no completed periods', () => {
    render(<CycleHistory />);
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
      },
    });
    render(<CycleHistory />);
    // Should show year header
    expect(screen.getByText('2023')).toBeInTheDocument();
    // Should show filter pills
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Last 3')).toBeInTheDocument();
    expect(screen.getByText('Last 6')).toBeInTheDocument();
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
    render(<CycleHistory />);
    // One completed period shows as one cycle
    expect(screen.getByText('2023')).toBeInTheDocument();
  });
});

describe('TabBar', () => {
  it('renders calendar and history tabs', () => {
    const onChange = () => {};
    render(<TabBar active="calendar" onChange={onChange} />);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('marks active tab', () => {
    const onChange = () => {};
    const { container } = render(<TabBar active="history" onChange={onChange} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).not.toContain('active');
    expect(buttons[1].className).toContain('active');
  });
});
