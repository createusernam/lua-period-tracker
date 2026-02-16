import { parseISO, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { usePeriodStore } from '../stores/periodStore';
import { useI18n } from '../i18n/context';

interface Props {
  dimmed?: boolean;
}

export default function PhaseStatus({ dimmed }: Props) {
  const { cycleDay, prediction, phase, periods } = usePeriodStore();
  const { t, lang } = useI18n();

  // Empty state — dimmed "No data"
  if (periods.length === 0) {
    return (
      <div className="phase-status" style={dimmed ? { opacity: 0.4 } : undefined}>
        <div className="phase-name">{t('status.no_data')}</div>
      </div>
    );
  }

  // Stale data: last period was way too long ago
  if (cycleDay?.stale) {
    const ago = formatDistanceToNow(parseISO(cycleDay.lastPeriodDate), { addSuffix: true, locale: lang === 'ru' ? ru : undefined });
    return (
      <div className="phase-status">
        <div className="phase-name">{t('status.no_recent')}</div>
        <div className="phase-detail">{t('status.last_period_ago', { ago })}</div>
      </div>
    );
  }

  // Only 1 period — no predictions yet
  if (!prediction || periods.length === 1) {
    return (
      <div className="phase-status">
        <div className="phase-detail">
          {cycleDay ? t('status.day_of', { day: cycleDay.day, total: 28 }) : ''}
        </div>
        <div className="phase-detail">{t('status.log_more')}</div>
      </div>
    );
  }

  // Normal state with phase
  const phaseKey = phase ? `phase.${phase.phase}` : '';
  const phaseColorClass = phase ? phase.phase : '';

  // Build countdown text
  let countdownText = '';
  if (phase?.phase === 'menstrual') {
    // During period — special text, no countdown to next
    countdownText = t('status.during_period', { day: phase.dayInPhase });
  } else if (cycleDay?.daysUntilNext !== null && cycleDay?.daysUntilNext !== undefined) {
    if (cycleDay.daysUntilNext > 0) {
      countdownText = t('status.period_in', { days: cycleDay.daysUntilNext });
    } else if (cycleDay.daysUntilNext === 0) {
      countdownText = t('status.period_today');
    } else {
      countdownText = t('status.period_overdue', { days: Math.abs(cycleDay.daysUntilNext) });
    }
  }

  return (
    <div className="phase-status">
      {phase && (
        <div className={`phase-name ${phaseColorClass}`}>{t(phaseKey)}</div>
      )}
      <div className="phase-detail">
        {cycleDay && (
          <>
            <span>{t('status.day_of', { day: cycleDay.day, total: cycleDay.total })}</span>
            {countdownText && (
              <>
                <span className="separator"> · </span>
                <span>{countdownText}</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
