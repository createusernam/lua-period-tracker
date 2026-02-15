import { parseISO, formatDistanceToNow } from 'date-fns';
import { usePeriodStore } from '../stores/periodStore';

export default function CycleStatus() {
  const { cycleDay, prediction, periods } = usePeriodStore();

  if (periods.length === 0) {
    return (
      <div className="cycle-status">
        <div className="cycle-day">No periods logged</div>
        <div className="cycle-sub">Import or log your first period</div>
      </div>
    );
  }

  // Stale data: last period was way too long ago
  if (cycleDay?.stale) {
    const ago = formatDistanceToNow(parseISO(cycleDay.lastPeriodDate), { addSuffix: true });
    return (
      <div className="cycle-status">
        <div className="cycle-day">No recent periods</div>
        <div className="cycle-sub">Last period started {ago}</div>
        {prediction && (
          <div className="cycle-stats">
            Avg cycle: {prediction.avgCycleLength}d &middot; Avg period: {prediction.avgPeriodDuration}d
          </div>
        )}
      </div>
    );
  }

  const dayText = cycleDay
    ? `Day ${cycleDay.day} of ~${cycleDay.total}`
    : 'Cycle tracking active';

  let subText = '';
  if (cycleDay?.daysUntilNext !== null && cycleDay?.daysUntilNext !== undefined) {
    if (cycleDay.daysUntilNext <= 0) {
      subText = 'Period expected around now';
    } else {
      subText = `Next period in ~${cycleDay.daysUntilNext} days`;
    }
  } else if (periods.length === 1) {
    subText = 'Log one more period for predictions';
  }

  return (
    <div className="cycle-status">
      <div className="cycle-day">{dayText}</div>
      {subText && <div className="cycle-sub">{subText}</div>}
      {prediction && (
        <div className="cycle-stats">
          Avg cycle: {prediction.avgCycleLength}d &middot; Avg period: {prediction.avgPeriodDuration}d
        </div>
      )}
    </div>
  );
}
