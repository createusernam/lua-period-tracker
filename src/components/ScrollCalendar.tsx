import { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  min as dateMin,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
  startOfDay,
  format,
  getYear,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { useI18n } from '../i18n/context';
import { translations } from '../i18n/translations';
import { toDateString } from '../utils';
import { buildDateSets } from './HomeCalendar';
import { getDayCircleClass } from './calendarUtils';
import type { CalendarDateSets } from './HomeCalendar';
import type { CalendarViewMode, Period } from '../types';
import YearView from './YearView';

export interface PeriodChange {
  action: 'add' | 'update' | 'delete';
  period: Omit<Period, 'id'> & { id?: number };
}

interface Props {
  mode: 'readonly' | 'edit';
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onClose: () => void;
  onSave?: (changes: PeriodChange[]) => Promise<void>;
  onEditFromCalendar?: () => void;
}

export default function ScrollCalendar({
  mode,
  viewMode,
  onViewModeChange,
  onClose,
  onSave,
  onEditFromCalendar,
}: Props) {
  const { periods, prediction, futureCycles } = usePeriodStore();
  const { t, lang } = useI18n();
  const weekdays = translations[lang]['cal.weekdays'] as readonly string[];
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollToMonthRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Selected days for edit mode
  const initialSelected = useMemo(() => {
    if (mode !== 'edit') return new Set<string>();
    const dates = new Set<string>();
    const now = new Date();
    for (const p of periods) {
      const start = parseISO(p.startDate);
      // Cap ongoing periods at 14 days (matches buildDateSets behavior)
      const end = p.endDate ? parseISO(p.endDate) : dateMin([addDays(start, 14), now]);
      const days = eachDayOfInterval({ start, end });
      days.forEach((d) => dates.add(toDateString(d)));
    }
    return dates;
  }, [periods, mode]);

  const [selectedDays, setSelectedDays] = useState<Set<string>>(initialSelected);

  // Track if any changes were made
  const hasChanges = useMemo(() => {
    if (selectedDays.size !== initialSelected.size) return true;
    for (const d of selectedDays) {
      if (!initialSelected.has(d)) return true;
    }
    return false;
  }, [selectedDays, initialSelected]);

  // Build date sets for visual markers
  const dateSets = useMemo(() => {
    return buildDateSets(periods, prediction, futureCycles);
  }, [periods, prediction, futureCycles]);

  // Generate months to render
  const months = useMemo(() => {
    const today = new Date();
    let startMonth: Date;
    let endMonth: Date;

    if (mode === 'edit') {
      startMonth = subMonths(today, 24);
      endMonth = addMonths(today, 3);
    } else {
      // Read-only: go back to earliest period or 3 years
      const earliest = periods.length > 0
        ? parseISO(periods[0].startDate)
        : subMonths(today, 36);
      const threeYearsBack = subMonths(today, 36);
      startMonth = earliest < threeYearsBack ? earliest : threeYearsBack;
      endMonth = addMonths(today, 12);
    }

    const result: Date[] = [];
    let current = startOfMonth(startMonth);
    const end = startOfMonth(endMonth);
    while (current <= end) {
      result.push(current);
      current = addMonths(current, 1);
    }
    return result;
  }, [periods, mode]);

  // Scroll to today on mount, or to selected month from year view
  useEffect(() => {
    if (viewMode === 'month') {
      requestAnimationFrame(() => {
        const targetMonth = scrollToMonthRef.current;
        if (targetMonth) {
          scrollToMonthRef.current = null;
          const el = scrollRef.current?.querySelector(`[data-month="${targetMonth}"]`);
          if (el) {
            el.scrollIntoView({ block: 'start' });
            return;
          }
        }
        todayRef.current?.scrollIntoView({ block: 'center' });
      });
    }
  }, [viewMode]);

  const handleScrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleDayClick = useCallback((dateStr: string) => {
    if (mode !== 'edit') return;
    // Don't allow selecting future dates
    const todayStr = toDateString(startOfDay(new Date()));
    if (dateStr > todayStr) return;

    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }, [mode]);

  const handleSave = useCallback(async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      const changes = computePeriodChanges(periods, selectedDays);
      await onSave(changes);
      onClose();
    } catch {
      setSaving(false);
    }
  }, [onSave, saving, periods, selectedDays, onClose]);

  const handleMonthSelectFromYear = useCallback((month: Date) => {
    scrollToMonthRef.current = format(month, 'yyyy-MM');
    onViewModeChange('month');
  }, [onViewModeChange]);

  // Year view
  if (viewMode === 'year') {
    return (
      <div className="scroll-calendar-overlay">
        <div className="scroll-calendar-header">
          <button className="scroll-close-btn" onClick={onClose} aria-label={t('common.close')}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="scroll-view-toggle">
            <button onClick={() => onViewModeChange('month')}>{t('cal.month')}</button>
            <button className="active" onClick={() => onViewModeChange('year')}>{t('cal.year')}</button>
          </div>
          <div className="scroll-header-spacer" />
        </div>
        <div className="scroll-calendar-content">
          <YearView onMonthSelect={handleMonthSelectFromYear} />
        </div>
      </div>
    );
  }

  // Month view
  const today = new Date();

  return (
    <div className="scroll-calendar-overlay">
      <div className="scroll-calendar-header">
        {mode === 'edit' ? (
          <>
            <div className="scroll-header-spacer" />
            <span className="scroll-edit-title">{t('edit.title')}</span>
            <button className="scroll-today-btn" onClick={handleScrollToToday}>{t('cal.today')}</button>
          </>
        ) : (
          <>
            <button className="scroll-close-btn" onClick={onClose} aria-label={t('common.close')}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="scroll-view-toggle">
              <button className="active" onClick={() => onViewModeChange('month')}>{t('cal.month')}</button>
              <button onClick={() => onViewModeChange('year')}>{t('cal.year')}</button>
            </div>
            <button className="scroll-today-btn" onClick={handleScrollToToday}>{t('cal.today')}</button>
          </>
        )}
      </div>

      {mode === 'edit' && (
        <div className="scroll-edit-instruction">{t('edit.instruction')}</div>
      )}

      <div className="scroll-weekday-row">
        {weekdays.map((d, i) => (
          <div key={i} className="weekday">{d}</div>
        ))}
      </div>

      <div className="scroll-calendar-months" ref={scrollRef}>
        {months.map((month) => (
          <ScrollCalendarMonth
            key={format(month, 'yyyy-MM')}
            month={month}
            today={today}
            todayRef={todayRef}
            dateSets={dateSets}
            mode={mode}
            selectedDays={mode === 'edit' ? selectedDays : undefined}
            onDayClick={mode === 'edit' ? handleDayClick : undefined}
            lang={lang}
          />
        ))}
      </div>

      {mode === 'edit' && (
        <div className="scroll-edit-footer">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            {t('edit.cancel')}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? t('edit.saving') : t('edit.save')}
          </button>
        </div>
      )}

      {mode === 'readonly' && onEditFromCalendar && (
        <button className="scroll-edit-fab" onClick={onEditFromCalendar}>
          {t('cal.edit_dates')}
        </button>
      )}
    </div>
  );
}

// Memoized month sub-component
interface MonthProps {
  month: Date;
  today: Date;
  todayRef: React.RefObject<HTMLDivElement | null>;
  dateSets: CalendarDateSets;
  mode: 'readonly' | 'edit';
  selectedDays?: Set<string>;
  onDayClick?: (dateStr: string) => void;
  lang: string;
}

const ScrollCalendarMonth = memo(function ScrollCalendarMonth({
  month,
  today,
  todayRef,
  dateSets,
  mode,
  selectedDays,
  onDayClick,
  lang,
}: MonthProps) {
  const monthNames = translations[lang as 'ru' | 'en']['cal.months'] as readonly string[];
  const monthIdx = month.getMonth();
  const year = getYear(month);
  const title = `${monthNames[monthIdx]} ${year}`;

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });

    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [month]);

  const todayStr = toDateString(today);
  const isFutureCutoff = toDateString(startOfDay(new Date()));

  return (
    <div className="scroll-month-block" data-month={format(month, 'yyyy-MM')}>
      <div className="scroll-month-title">{title}</div>
      <div className="calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="calendar-week">
            {week.map((day) => {
              const dateStr = toDateString(day);
              const isCurrentMonth = isSameMonth(day, month);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > isFutureCutoff;

              if (mode === 'edit') {
                const isSelected = selectedDays?.has(dateStr);
                const isPredicted = dateSets.predictedPeriodDates.has(dateStr);

                let className = 'calendar-day edit-day';
                if (!isCurrentMonth) {
                  className += ' other-month';
                } else if (isSelected) {
                  className += ' selected';
                } else if (isPredicted) {
                  className += ' predicted-period';
                }
                if (isToday) className += ' today';
                if (isFuture && !isSelected) className += ' future-disabled';

                return (
                  <div
                    key={dateStr}
                    className={className}
                    onClick={isCurrentMonth && !isFuture ? () => onDayClick?.(dateStr) : undefined}
                    ref={isToday ? todayRef : undefined}
                  >
                    {isToday && <span className="today-label-text">{translations[lang as 'ru' | 'en']['cal.today'] as string}</span>}
                    <span>{isCurrentMonth ? format(day, 'd') : ''}</span>
                    {isSelected && isCurrentMonth && (
                      <svg className="check-overlay" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                );
              }

              // Read-only mode
              const className = getDayCircleClass(dateStr, isCurrentMonth, isToday, dateSets);

              return (
                <div
                  key={dateStr}
                  className={className}
                  ref={isToday ? todayRef : undefined}
                >
                  <span>{isCurrentMonth ? format(day, 'd') : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Compute period changes by diffing selected days against existing periods.
 */
export function computePeriodChanges(periods: Period[], selectedDays: Set<string>): PeriodChange[] {
  const changes: PeriodChange[] = [];

  // Group consecutive selected days into ranges
  const sortedDays = [...selectedDays].sort();
  const ranges: { start: string; end: string }[] = [];

  for (const day of sortedDays) {
    const lastRange = ranges[ranges.length - 1];
    if (lastRange) {
      const lastEnd = parseISO(lastRange.end);
      const current = parseISO(day);
      const diffMs = current.getTime() - lastEnd.getTime();
      if (diffMs <= 86400000) {
        // Consecutive or same day
        lastRange.end = day;
        continue;
      }
    }
    ranges.push({ start: day, end: day });
  }

  // Track which existing periods are accounted for
  const matched = new Set<number>();

  for (const range of ranges) {
    // Find an existing period that overlaps with this range
    const existing = periods.find((p) => {
      if (p.id === undefined || matched.has(p.id)) return false;
      const pStart = p.startDate;
      const pEnd = p.endDate ?? p.startDate;
      return pStart <= range.end && pEnd >= range.start;
    });

    if (existing && existing.id !== undefined) {
      matched.add(existing.id);
      // Check if dates changed
      if (existing.startDate !== range.start || existing.endDate !== range.end) {
        changes.push({
          action: 'update',
          period: { id: existing.id, startDate: range.start, endDate: range.end },
        });
      }
    } else {
      changes.push({
        action: 'add',
        period: { startDate: range.start, endDate: range.end },
      });
    }
  }

  // Delete existing periods that are no longer represented
  for (const p of periods) {
    if (p.id !== undefined && !matched.has(p.id)) {
      // Check if any of this period's days are still selected
      const pDays = eachDayOfInterval({
        start: parseISO(p.startDate),
        end: p.endDate ? parseISO(p.endDate) : parseISO(p.startDate),
      });
      const anySelected = pDays.some((d) => selectedDays.has(toDateString(d)));
      if (!anySelected) {
        changes.push({
          action: 'delete',
          period: { id: p.id, startDate: p.startDate, endDate: p.endDate },
        });
      }
    }
  }

  return changes;
}
