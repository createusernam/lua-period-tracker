import { parseISO, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { usePeriodStore } from '../stores/periodStore';
import { useI18n } from '../i18n/context';

interface Props {
  dimmed?: boolean;
}

export default function PhaseStatus({ dimmed }: Props) {
  const cycleDay = usePeriodStore((s) => s.cycleDay);
  const prediction = usePeriodStore((s) => s.prediction);
  const phase = usePeriodStore((s) => s.phase);
  const isEmpty = usePeriodStore((s) => s.periods.length === 0);
  const isSingle = usePeriodStore((s) => s.periods.length === 1);
  const { t, lang } = useI18n();

  // Empty state — dimmed "No data"
  if (isEmpty) {
    return (
      <div className={`phase-status${dimmed ? ' dimmed' : ''}`}>
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
  if (!prediction || isSingle) {
    return (
      <div className="phase-status">
        <div className="phase-detail">
          {cycleDay ? t('status.day', { day: cycleDay.day }) : ''}
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
      const absDays = Math.abs(cycleDay.daysUntilNext);
      countdownText = t(absDays === 1 ? 'status.period_overdue_1' : 'status.period_overdue', { days: absDays });
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
            <span>{t('status.day', { day: cycleDay.day })}</span>
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
