import { useMemo } from 'react';
import { parseISO, format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { usePeriodStore } from '../stores/periodStore';
import { buildCycleHistory } from '../services/predictions';
import { useI18n } from '../i18n/context';
import type { CycleInfo } from '../types';

const MAX_DOTS = 45;

interface Props {
  limit?: number;
}

export default function CycleHistory({ limit }: Props) {
  const { periods, prediction } = usePeriodStore();
  const { t } = useI18n();

  const allCycles = useMemo(() => {
    return buildCycleHistory(periods, prediction).reverse(); // newest first
  }, [periods, prediction]);

  const displayed = useMemo(() => {
    if (limit) return allCycles.slice(0, limit);
    return allCycles;
  }, [allCycles, limit]);

  // Group by year
  const grouped = useMemo(() => {
    const groups: Record<string, CycleInfo[]> = {};
    for (const c of displayed) {
      const year = format(parseISO(c.startDate), 'yyyy');
      if (!groups[year]) groups[year] = [];
      groups[year].push(c);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [displayed]);

  if (allCycles.length === 0) {
    return (
      <div className="cycle-history-empty">
        <div className="history-empty-title">{t('history.no_data')}</div>
        <div className="history-empty-sub">{t('history.log_completed')}</div>
      </div>
    );
  }

  return (
    <div className="cycle-history">
      {!limit && <DotBarLegend />}

      {grouped.map(([year, cycles]) => (
        <div key={year} className="cycle-year-group">
          <div className="cycle-year-header">{year}</div>
          {cycles.map((cycle) => (
            <CycleHistoryItem key={cycle.startDate} cycle={cycle} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DotBarLegend() {
  const { t } = useI18n();
  return (
    <div className="dotbar-legend">
      <span className="legend-item">
        <span className="legend-dot period" />
        {t('legend.period')}
      </span>
      <span className="legend-item">
        <span className="legend-dot fertile" />
        {t('legend.fertile')}
      </span>
      <span className="legend-item">
        <span className="legend-dot ovulation" />
        {t('legend.ovulation')}
      </span>
    </div>
  );
}

function CycleHistoryItem({ cycle }: { cycle: CycleInfo }) {
  const { t, lang } = useI18n();
  const locale = lang === 'ru' ? ru : undefined;
  const startFormatted = format(parseISO(cycle.startDate), 'MMM d', { locale });
  const endFormatted = cycle.endDate
    ? format(parseISO(cycle.endDate), 'MMM d', { locale })
    : t('history.ongoing');

  const lengthText = cycle.cycleLength > 0
    ? (cycle.estimated
        ? t('history.est_days', { days: cycle.cycleLength })
        : t('history.days', { days: cycle.cycleLength }))
    : '—';

  return (
    <div className="cycle-item">
      <div className="cycle-item-header">
        <span className="cycle-item-length">{lengthText}</span>
        <span className="cycle-item-dates">{startFormatted} – {endFormatted}</span>
      </div>
      <DotBar cycle={cycle} />
    </div>
  );
}

function DotBar({ cycle }: { cycle: CycleInfo }) {
  const dots = useMemo(() => {
    const rawTotal = cycle.cycleLength > 0 ? cycle.cycleLength : cycle.periodDuration;
    if (rawTotal <= 0) return [];

    const total = Math.min(rawTotal, MAX_DOTS);
    const scale = rawTotal > MAX_DOTS ? MAX_DOTS / rawTotal : 1;

    const result: string[] = [];
    const fertileStart = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.fertileStart)
      : null;
    const fertileEnd = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.fertileEnd)
      : null;
    const ovulationDay = cycle.fertility
      ? dayNumber(cycle.startDate, cycle.fertility.ovulationDay)
      : null;

    for (let d = 1; d <= total; d++) {
      const origDay = scale < 1 ? Math.round(d / scale) : d;
      if (origDay <= cycle.periodDuration) {
        result.push('period');
      } else if (ovulationDay !== null && origDay === ovulationDay) {
        result.push('ovulation');
      } else if (
        fertileStart !== null &&
        fertileEnd !== null &&
        origDay >= fertileStart &&
        origDay <= fertileEnd
      ) {
        result.push('fertile');
      } else {
        result.push('luteal');
      }
    }
    return result;
  }, [cycle]);

  if (dots.length === 0) return null;

  return (
    <div className="dotbar">
      {dots.map((phase, i) => (
        <span key={i} className={`dot dot-${phase}`} />
      ))}
    </div>
  );
}

function dayNumber(cycleStart: string, dateStr: string): number {
  return differenceInDays(parseISO(dateStr), parseISO(cycleStart)) + 1;
}
