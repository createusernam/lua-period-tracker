import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addDays,
  format,
  min as dateMin,
  startOfDay,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { buildCycleHistory } from '../services/predictions';
import { toDateString } from '../utils';
import { useI18n } from '../i18n/context';
import { translations } from '../i18n/translations';
import { getDayCircleClass } from './calendarUtils';

export default function HomeCalendar() {
  const { periods, prediction, futureCycles } = usePeriodStore();
  const { lang } = useI18n();
  const weekdays = translations[lang]['cal.weekdays'] as readonly string[];

  const today = new Date();
  const currentMonth = startOfMonth(today);

  const dateSets = useMemo(() => {
    return buildDateSets(periods, prediction, futureCycles);
  }, [periods, prediction, futureCycles]);

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

  return (
    <div className="home-calendar">
      <div className="calendar-weekdays">
        {weekdays.map((d, i) => (
          <div key={i} className="weekday">{d}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-week">
            {week.map((day) => {
              const dateStr = toDateString(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const className = getDayCircleClass(dateStr, isCurrentMonth, isToday, dateSets);

              return (
                <div key={dateStr} className={className}>
                  <span>{isCurrentMonth ? format(day, 'd') : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Shared date set builder used by both HomeCalendar and ScrollCalendar
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
