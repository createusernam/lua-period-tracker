import { useMemo, useState, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  min as dateMin,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
  format,
  getYear,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';
import { estimateFertilityWindow } from '../services/predictions';

interface Props {
  onMonthSelect: (month: Date) => void;
}

export default function YearView({ onMonthSelect }: Props) {
  const [year, setYear] = useState(getYear(new Date()));
  const { periods, prediction } = usePeriodStore();

  // Period dates
  const periodDates = useMemo(() => {
    const dates = new Set<string>();
    const now = new Date();
    for (const p of periods) {
      const start = parseISO(p.startDate);
      // Cap ongoing periods to 14 days
      const end = p.endDate ? parseISO(p.endDate) : dateMin([addDays(start, 14), now]);
      eachDayOfInterval({ start, end }).forEach((d) =>
        dates.add(toDateString(d))
      );
    }
    return dates;
  }, [periods]);

  // Predicted dates
  const predictedDates = useMemo(() => {
    const dates = new Set<string>();
    if (!prediction) return dates;
    const start = parseISO(prediction.predictedStart);
    const end = parseISO(prediction.predictedEnd);
    if (start > end) return dates;
    eachDayOfInterval({ start, end }).forEach((d) => {
      const key = toDateString(d);
      if (!periodDates.has(key)) dates.add(key);
    });
    return dates;
  }, [prediction, periodDates]);

  // Fertility dates (for predicted cycle)
  const fertilityDates = useMemo(() => {
    const dates = new Set<string>();
    if (!prediction) return dates;
    const fertility = estimateFertilityWindow(
      prediction.predictedStart,
      prediction.avgCycleLength
    );
    if (!fertility) return dates;
    eachDayOfInterval({
      start: parseISO(fertility.fertileStart),
      end: parseISO(fertility.fertileEnd),
    }).forEach((d) => dates.add(toDateString(d)));
    return dates;
  }, [prediction]);

  const months = useMemo(() => {
    const result: Date[] = [];
    for (let m = 0; m < 12; m++) {
      result.push(new Date(year, m, 1));
    }
    return result;
  }, [year]);

  const handlePrev = useCallback(() => setYear((y) => y - 1), []);
  const handleNext = useCallback(() => setYear((y) => y + 1), []);

  return (
    <div className="year-view">
      <div className="year-nav">
        <button onClick={handlePrev} aria-label="Previous year">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="year-label">{year}</span>
        <button onClick={handleNext} aria-label="Next year">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="year-grid">
        {months.map((month) => (
          <MiniCalendar
            key={format(month, 'yyyy-MM')}
            month={month}
            periodDates={periodDates}
            predictedDates={predictedDates}
            fertilityDates={fertilityDates}
            onClick={() => onMonthSelect(month)}
          />
        ))}
      </div>
    </div>
  );
}

interface MiniCalendarProps {
  month: Date;
  periodDates: Set<string>;
  predictedDates: Set<string>;
  fertilityDates: Set<string>;
  onClick: () => void;
}

function MiniCalendar({
  month,
  periodDates,
  predictedDates,
  fertilityDates,
  onClick,
}: MiniCalendarProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [month]);

  return (
    <button className="mini-calendar" onClick={onClick} type="button" aria-label={format(month, 'MMMM yyyy')}>
      <div className="mini-month-name">{format(month, 'MMM')}</div>
      <div className="mini-grid">
        {days.map((day) => {
          const dateStr = toDateString(day);
          const inMonth = isSameMonth(day, month);
          const isPeriod = periodDates.has(dateStr);
          const isPredicted = predictedDates.has(dateStr);
          const isFertile = fertilityDates.has(dateStr);

          let className = 'mini-day';
          if (!inMonth) className += ' other';
          else if (isPeriod) className += ' period';
          else if (isPredicted) className += ' predicted';
          else if (isFertile) className += ' fertile';

          return <span key={dateStr} className={className} />;
        })}
      </div>
    </button>
  );
}
