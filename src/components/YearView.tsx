import { useMemo, useState, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  format,
  getYear,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';
import { buildDateSets, type CalendarDateSets } from './HomeCalendar';
import { useI18n } from '../i18n/context';
import { translations } from '../i18n/translations';

interface Props {
  onMonthSelect: (month: Date) => void;
}

export default function YearView({ onMonthSelect }: Props) {
  const [year, setYear] = useState(getYear(new Date()));
  const { periods, prediction, futureCycles } = usePeriodStore();
  const { t, lang } = useI18n();
  const monthNames = translations[lang]['cal.months'] as readonly string[];

  const dateSets = useMemo(() => {
    return buildDateSets(periods, prediction, futureCycles);
  }, [periods, prediction, futureCycles]);

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
        <button onClick={handlePrev} aria-label={t('cal.prev_year')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="year-label">{year}</span>
        <button onClick={handleNext} aria-label={t('cal.next_year')}>
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
            monthName={monthNames[month.getMonth()]}
            dateSets={dateSets}
            onClick={() => onMonthSelect(month)}
          />
        ))}
      </div>
    </div>
  );
}

interface MiniCalendarProps {
  month: Date;
  monthName: string;
  dateSets: CalendarDateSets;
  onClick: () => void;
}

function MiniCalendar({
  month,
  monthName,
  dateSets,
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
    <button className="mini-calendar" onClick={onClick} type="button" aria-label={`${monthName} ${getYear(month)}`}>
      <div className="mini-month-name">{monthName}</div>
      <div className="mini-grid">
        {days.map((day) => {
          const dateStr = toDateString(day);
          const inMonth = isSameMonth(day, month);

          if (!inMonth) {
            return <span key={dateStr} className="mini-day other" />;
          }

          let className = 'mini-day';
          if (dateSets.periodDates.has(dateStr)) {
            className += ' period';
          } else if (dateSets.predictedPeriodDates.has(dateStr)) {
            className += ' predicted';
          } else if (dateSets.pastOvulationDates.has(dateStr) || dateSets.futureOvulationDates.has(dateStr)) {
            className += ' ovulation';
          } else if (dateSets.pastFertilityDates.has(dateStr) || dateSets.futureFertilityDates.has(dateStr)) {
            className += ' fertile';
          }

          return <span key={dateStr} className={className}>{day.getDate()}</span>;
        })}
      </div>
    </button>
  );
}
