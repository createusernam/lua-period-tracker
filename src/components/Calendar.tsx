import { useMemo, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  subMonths,
  min as dateMin,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';

interface Props {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

export default function Calendar({ currentMonth, onMonthChange }: Props) {
  const { periods, prediction } = usePeriodStore();

  const periodDates = useMemo(() => {
    const dates = new Set<string>();
    const now = new Date();
    for (const p of periods) {
      const start = parseISO(p.startDate);
      // Cap ongoing periods to 14 days
      const end = p.endDate ? parseISO(p.endDate) : dateMin([addDays(start, 14), now]);
      const days = eachDayOfInterval({ start, end });
      days.forEach((d) => dates.add(toDateString(d)));
    }
    return dates;
  }, [periods]);

  const predictedDates = useMemo(() => {
    const dates = new Set<string>();
    if (!prediction) return dates;
    const start = parseISO(prediction.predictedStart);
    const end = parseISO(prediction.predictedEnd);
    if (start > end) return dates;
    const days = eachDayOfInterval({ start, end });
    days.forEach((d) => {
      const key = toDateString(d);
      if (!periodDates.has(key)) dates.add(key);
    });
    return dates;
  }, [prediction, periodDates]);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [currentMonth]);

  const goToPrevMonth = useCallback(() => onMonthChange(subMonths(currentMonth, 1)), [currentMonth, onMonthChange]);
  const goToNextMonth = useCallback(() => onMonthChange(addMonths(currentMonth, 1)), [currentMonth, onMonthChange]);
  const goToToday = useCallback(() => onMonthChange(new Date()), [onMonthChange]);

  const today = new Date();

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button onClick={goToPrevMonth} aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="calendar-title" onClick={goToToday}>
          {format(currentMonth, 'MMMM yyyy')}
        </button>
        <button onClick={goToNextMonth} aria-label="Next month">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-week">
            {week.map((day) => {
              const dateStr = toDateString(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const isPeriod = periodDates.has(dateStr);
              const isPredicted = predictedDates.has(dateStr);

              let className = 'calendar-day';
              if (!isCurrentMonth) className += ' other-month';
              if (isToday) className += ' today';
              if (isPeriod) className += ' period';
              if (isPredicted) className += ' predicted';

              return (
                <div key={dateStr} className={className}>
                  <span>{format(day, 'd')}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
