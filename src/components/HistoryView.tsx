import { useState } from 'react';
import CycleHistory from './CycleHistory';
import CycleDynamicsChart from './CycleDynamicsChart';
import YearView from './YearView';

type HistoryMode = 'cycles' | 'year';

interface Props {
  onSwitchToCalendar: (month: Date) => void;
}

export default function HistoryView({ onSwitchToCalendar }: Props) {
  const [mode, setMode] = useState<HistoryMode>('cycles');

  return (
    <div className="history-view">
      <div className="history-mode-toggle">
        <button
          className={`mode-btn ${mode === 'cycles' ? 'active' : ''}`}
          onClick={() => setMode('cycles')}
        >
          Cycles
        </button>
        <button
          className={`mode-btn ${mode === 'year' ? 'active' : ''}`}
          onClick={() => setMode('year')}
        >
          Year
        </button>
      </div>

      {mode === 'cycles' && (
        <>
          <CycleDynamicsChart />
          <CycleHistory />
        </>
      )}

      {mode === 'year' && (
        <YearView onMonthSelect={onSwitchToCalendar} />
      )}
    </div>
  );
}
