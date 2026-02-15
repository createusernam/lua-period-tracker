import { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';
import { toDateString } from '../utils';
import CalendarPicker from './CalendarPicker';

export default function LogPeriodButton() {
  const [showPicker, setShowPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { periods, updatePeriod } = usePeriodStore();

  const ongoing = periods.find((p) => p.endDate === null);

  const handleEndPeriod = async () => {
    if (ongoing?.id) {
      await updatePeriod(ongoing.id, { endDate: toDateString(new Date()) });
    }
    setShowConfirm(false);
  };

  if (ongoing) {
    const dayCount = differenceInDays(new Date(), parseISO(ongoing.startDate)) + 1;
    return (
      <>
        <div className="log-period-wrap">
          <button
            className="btn-primary log-period-btn ongoing"
            onClick={() => setShowConfirm(true)}
          >
            End Period: Day {dayCount}
          </button>
        </div>

        {showConfirm && (
          <div className="sheet-overlay" onClick={() => setShowConfirm(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <h2>End period?</h2>
              <p className="sheet-description">
                Mark today as the last day of this period (Day {dayCount}).
              </p>
              <div className="sheet-actions">
                <button className="btn-primary" onClick={handleEndPeriod}>
                  Yes, End Period
                </button>
                <button className="btn-secondary" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="log-period-wrap">
        <button
          className="btn-primary log-period-btn"
          onClick={() => setShowPicker(true)}
        >
          + Log Period
        </button>
      </div>

      {showPicker && <CalendarPicker onClose={() => setShowPicker(false)} />}
    </>
  );
}
