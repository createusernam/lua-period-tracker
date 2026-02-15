import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  min as dateMin,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';

interface Props {
  onClose: () => void;
  /** If editing an existing period, pass it here */
  editingPeriod?: { id: number; startDate: string; endDate: string | null };
}

export default function CalendarPicker({ onClose, editingPeriod }: Props) {
  const { addPeriod, updatePeriod, periods, prediction } = usePeriodStore();
  const [startDate, setStartDate] = useState<string | null>(
    editingPeriod?.startDate ?? null
  );
  const [endDate, setEndDate] = useState<string | null>(
    editingPeriod?.endDate ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const todayStr = toDateString(new Date());

  // Generate months: 12 back + current + 3 forward
  const months = useMemo(() => {
    const now = new Date();
    const result: Date[] = [];
    for (let i = -12; i <= 3; i++) {
      result.push(i === 0 ? startOfMonth(now) : addMonths(startOfMonth(now), i));
    }
    return result;
  }, []);

  // Existing period dates (for display)
  const existingPeriodDates = useMemo(() => {
    const dates = new Set<string>();
    const now = new Date();
    for (const p of periods) {
      // Skip the period being edited
      if (editingPeriod && p.id === editingPeriod.id) continue;
      const start = parseISO(p.startDate);
      // Cap ongoing periods to 14 days to avoid unbounded expansion
      const end = p.endDate ? parseISO(p.endDate) : dateMin([addDays(start, 14), now]);
      const days = eachDayOfInterval({ start, end });
      days.forEach((d) => dates.add(toDateString(d)));
    }
    return dates;
  }, [periods, editingPeriod]);

  // Predicted period dates
  const predictedDates = useMemo(() => {
    const dates = new Set<string>();
    if (!prediction) return dates;
    const start = parseISO(prediction.predictedStart);
    const end = parseISO(prediction.predictedEnd);
    if (start > end) return dates;
    eachDayOfInterval({ start, end }).forEach((d) => dates.add(toDateString(d)));
    return dates;
  }, [prediction]);

  // Selected range
  const selectedDates = useMemo(() => {
    const dates = new Set<string>();
    if (!startDate) return dates;
    const s = parseISO(startDate);
    const e = endDate ? parseISO(endDate) : s;
    eachDayOfInterval({ start: s, end: e }).forEach((d) =>
      dates.add(toDateString(d))
    );
    return dates;
  }, [startDate, endDate]);

  // Scroll to current month on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      todayRef.current?.scrollIntoView({ block: 'center' });
    });
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDayTap = useCallback(
    (dateStr: string) => {
      const date = parseISO(dateStr);
      if (isAfter(date, startOfDay(new Date()))) return; // No future dates

      if (!startDate) {
        setStartDate(dateStr);
        setEndDate(null);
      } else if (!endDate) {
        const start = parseISO(startDate);
        if (isSameDay(date, start)) {
          // Tap same day: set as single-day period
          setEndDate(dateStr);
        } else if (isBefore(date, start)) {
          // Tapped before start: move start
          setEndDate(startDate);
          setStartDate(dateStr);
        } else {
          // Tapped after start: set as end
          setEndDate(dateStr);
        }
      } else {
        // Already have a range: reset and start new selection
        setStartDate(dateStr);
        setEndDate(null);
      }
    },
    [startDate, endDate]
  );

  const handleSave = async () => {
    if (!startDate || saving) return;
    setError(null);

    const finalEnd = endDate || startDate;
    const newStart = parseISO(startDate);
    const newEnd = parseISO(finalEnd);

    // Check for overlaps with existing periods
    for (const p of periods) {
      if (editingPeriod && p.id === editingPeriod.id) continue;
      const pStart = parseISO(p.startDate);
      const pEnd = p.endDate ? parseISO(p.endDate) : new Date();
      if (newStart <= pEnd && newEnd >= pStart) {
        setError('Overlaps with an existing period');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingPeriod) {
        await updatePeriod(editingPeriod.id, {
          startDate,
          endDate: finalEnd,
        });
      } else {
        await addPeriod({ startDate, endDate: finalEnd });
      }
      onClose();
    } catch {
      setError('Failed to save period');
      setSaving(false);
    }
  };

  return (
    <div className="picker-overlay">
      <div className="picker">
        <div className="picker-header">
          <button className="picker-cancel" onClick={onClose}>
            Cancel
          </button>
          <h2>{editingPeriod ? 'Edit Period' : 'Log Period'}</h2>
          <button
            className="picker-save"
            onClick={handleSave}
            disabled={!startDate || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {startDate && (
          <div className="picker-selection-info">
            {format(parseISO(startDate), 'MMM d')}
            {endDate && endDate !== startDate && (
              <> – {format(parseISO(endDate), 'MMM d')}</>
            )}
          </div>
        )}

        {error && <div className="picker-error">{error}</div>}

        <div className="picker-months" ref={scrollRef}>
          {months.map((month) => (
            <PickerMonth
              key={format(month, 'yyyy-MM')}
              month={month}
              todayStr={todayStr}
              selectedDates={selectedDates}
              existingPeriodDates={existingPeriodDates}
              predictedDates={predictedDates}
              startDate={startDate}
              endDate={endDate}
              onDayTap={handleDayTap}
              todayRef={todayRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PickerMonthProps {
  month: Date;
  todayStr: string;
  selectedDates: Set<string>;
  existingPeriodDates: Set<string>;
  predictedDates: Set<string>;
  startDate: string | null;
  endDate: string | null;
  onDayTap: (dateStr: string) => void;
  todayRef: React.RefObject<HTMLDivElement | null>;
}

function PickerMonth({
  month,
  todayStr,
  selectedDates,
  existingPeriodDates,
  predictedDates,
  startDate,
  endDate,
  onDayTap,
  todayRef,
}: PickerMonthProps) {
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

  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <div className="picker-month" ref={isCurrentMonth ? todayRef : undefined}>
      <div className="picker-month-title">{format(month, 'MMMM yyyy')}</div>
      <div className="picker-weekdays">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="weekday">
            {d}
          </div>
        ))}
      </div>
      <div className="picker-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="picker-week">
            {week.map((day) => {
              const dateStr = toDateString(day);
              const inMonth = isSameMonth(day, month);
              const isToday = dateStr === todayStr;
              const isFuture = isAfter(day, startOfDay(new Date()));
              const isSelected = selectedDates.has(dateStr);
              const isExisting = existingPeriodDates.has(dateStr);
              const isPredicted = predictedDates.has(dateStr);
              const isStart = dateStr === startDate;
              const isEnd = dateStr === endDate;

              let className = 'picker-day';
              if (!inMonth) className += ' other-month';
              if (isToday) className += ' today';
              if (isFuture) className += ' future';
              if (isSelected) className += ' selected';
              if (isStart) className += ' range-start';
              if (isEnd) className += ' range-end';
              if (isExisting && !isSelected) className += ' existing-period';
              if (isPredicted && !isSelected && !isExisting) className += ' predicted';

              return (
                <button
                  key={dateStr}
                  className={className}
                  onClick={() => !isFuture && inMonth && onDayTap(dateStr)}
                  disabled={isFuture || !inMonth}
                  type="button"
                >
                  <span>{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
