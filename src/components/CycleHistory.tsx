import { useMemo, useState } from 'react';
import { parseISO, format, differenceInDays } from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { buildCycleHistory } from '../services/predictions';
import type { CycleFilter, CycleInfo } from '../types';

const MAX_DOTS = 45;

export default function CycleHistory() {
  const { periods, prediction } = usePeriodStore();
  const [filter, setFilter] = useState<CycleFilter>('all');

  const allCycles = useMemo(() => {
    return buildCycleHistory(periods, prediction).reverse(); // newest first
  }, [periods, prediction]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'last3':
        return allCycles.slice(0, 3);
      case 'last6':
        return allCycles.slice(0, 6);
      default:
        return allCycles;
    }
  }, [allCycles, filter]);

  // Group by year
  const grouped = useMemo(() => {
    const groups: Record<string, CycleInfo[]> = {};
    for (const c of filtered) {
      const year = format(parseISO(c.startDate), 'yyyy');
      if (!groups[year]) groups[year] = [];
      groups[year].push(c);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filtered]);

  if (allCycles.length === 0) {
    return (
      <div className="cycle-history-empty">
        <div className="history-empty-title">No cycle data</div>
        <div className="history-empty-sub">
          Log at least one completed period to see cycle history.
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-history">
      <div className="filter-pills">
        {(['all', 'last3', 'last6'] as CycleFilter[]).map((f) => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'last3' ? 'Last 3' : 'Last 6'}
          </button>
        ))}
      </div>

      <DotBarLegend />

      {grouped.map(([year, cycles]) => (
        <div key={year} className="cycle-year-group">
          <div className="cycle-year-header">{year}</div>
          {cycles.map((cycle) => (
            <CycleHistoryItem key={cycle.startDate} cycle={cycle} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DotBarLegend() {
  return (
    <div className="dotbar-legend">
      <span className="legend-item">
        <span className="legend-dot period" />
        Period
      </span>
      <span className="legend-item">
        <span className="legend-dot fertile" />
        Fertile
      </span>
      <span className="legend-item">
        <span className="legend-dot ovulation" />
        Ovulation
      </span>
    </div>
  );
}

function CycleHistoryItem({ cycle }: { cycle: CycleInfo }) {
  const startFormatted = format(parseISO(cycle.startDate), 'MMM d');
  const endFormatted = cycle.endDate
    ? format(parseISO(cycle.endDate), 'MMM d')
    : 'Ongoing';

  return (
    <div className="cycle-item">
      <div className="cycle-item-header">
        <span className="cycle-item-length">
          {cycle.cycleLength > 0
            ? cycle.estimated ? `~${cycle.cycleLength} days` : `${cycle.cycleLength} days`
            : '—'}
        </span>
        <span className="cycle-item-dates">
          {startFormatted} – {endFormatted}
        </span>
      </div>
      <DotBar cycle={cycle} />
    </div>
  );
}

function DotBar({ cycle }: { cycle: CycleInfo }) {
  const dots = useMemo(() => {
    const rawTotal = cycle.cycleLength > 0 ? cycle.cycleLength : cycle.periodDuration;
    if (rawTotal <= 0) return [];

    const total = Math.min(rawTotal, MAX_DOTS);
    const scale = rawTotal > MAX_DOTS ? MAX_DOTS / rawTotal : 1;

    const result: string[] = [];
    const fertileStart = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.fertileStart)
      : null;
    const fertileEnd = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.fertileEnd)
      : null;
    const ovulationDay = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.ovulationDay)
      : null;

    for (let d = 1; d <= total; d++) {
      // Map back to original day when scaled
      const origDay = scale < 1 ? Math.round(d / scale) : d;
      if (origDay <= cycle.periodDuration) {
        result.push('period');
      } else if (ovulationDay !== null && origDay === ovulationDay) {
        result.push('ovulation');
      } else if (
        fertileStart !== null &&
        fertileEnd !== null &&
        origDay >= fertileStart &&
        origDay <= fertileEnd
      ) {
        result.push('fertile');
      } else {
        result.push('luteal');
      }
    }
    return result;
  }, [cycle]);

  if (dots.length === 0) return null;

  return (
    <div className="dotbar">
      {dots.map((phase, i) => (
        <span key={i} className={`dot dot-${phase}`} />
      ))}
    </div>
  );
}

function dayNumber(cycleStart: string, dateStr: string): number {
  return differenceInDays(parseISO(dateStr), parseISO(cycleStart)) + 1;
}
