import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';
import { useI18n } from '../i18n/context';
import { translations } from '../i18n/translations';
import { getDayCircleClass } from './calendarUtils';

// Re-export for consumers that previously imported from here
export { buildDateSets, type CalendarDateSets } from '../services/calendarSets';

export default function HomeCalendar() {
  const dateSets = usePeriodStore((s) => s.dateSets);
  const { lang } = useI18n();
  const weekdays = translations[lang]['cal.weekdays'] as readonly string[];

  const today = new Date();
  const currentMonth = startOfMonth(today);

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
