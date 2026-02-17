import { useMemo } from 'react';
import { usePeriodStore } from '../stores/periodStore';
import { useI18n } from '../i18n/context';

export default function FluctuationSnippet() {
  const cycles = usePeriodStore((s) => s.cycles);
  const prediction = usePeriodStore((s) => s.prediction);
  const { t } = useI18n();

  const stats = useMemo(() => {
    const allCompleted = cycles.filter((c) => !c.estimated && c.cycleLength > 0 && c.cycleLength < 90);
    if (allCompleted.length < 2) return null;

    // Use last 12 cycles for range stats
    const completed = allCompleted.slice(-12);
    const lengths = completed.map((c) => c.cycleLength);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);

    const last = completed[completed.length - 1];
    const prev = completed[completed.length - 2];

    return {
      min: minLen,
      max: maxLen,
      prevCycleLength: prev.cycleLength,
      lastPeriodDuration: last.periodDuration,
      avgCycle: prediction?.avgCycleLength ?? 0,
    };
  }, [cycles, prediction]);

  if (!stats) return null;

  return (
    <div className="fluctuation-section">
      <div className="fluctuation-title">{t('home.stats')}</div>
      <div className="fluctuation-rows">
        <div className="fluctuation-row">{t('stats.fluctuation', { min: stats.min, max: stats.max })}</div>
        <div className="fluctuation-row">{t('stats.prev_cycle', { days: stats.prevCycleLength })}</div>
        <div className="fluctuation-row">{t('stats.prev_period', { days: stats.lastPeriodDuration })}</div>
        {stats.avgCycle > 0 && (
          <div className="fluctuation-row">{t('stats.avg_cycle', { days: stats.avgCycle })}</div>
        )}
      </div>
    </div>
  );
}
