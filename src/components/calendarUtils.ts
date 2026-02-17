import type { CalendarDateSets } from '../services/calendarSets';

/**
 * Determine the CSS class for a calendar day circle.
 * Used by both HomeCalendar and ScrollCalendar.
 */
export function getDayCircleClass(
  dateStr: string,
  isCurrentMonth: boolean,
  isToday: boolean,
  sets: CalendarDateSets,
): string {
  let className = 'calendar-day';

  if (!isCurrentMonth) {
    className += ' other-month';
    return className;
  }

  if (isToday) className += ' today';

  // Priority order: logged period > predicted period > ovulation > fertility
  if (sets.periodDates.has(dateStr)) {
    className += ' period';
  } else if (sets.predictedPeriodDates.has(dateStr)) {
    className += ' predicted-period';
  } else if (sets.pastOvulationDates.has(dateStr)) {
    className += ' ovulation';
  } else if (sets.futureOvulationDates.has(dateStr)) {
    className += ' predicted-ovulation';
  } else if (sets.pastFertilityDates.has(dateStr)) {
    className += ' fertile';
  } else if (sets.futureFertilityDates.has(dateStr)) {
    className += ' predicted-fertile';
  }

  return className;
}
