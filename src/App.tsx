import { useState, useEffect, useCallback } from 'react';
import { initializeDatabase } from './db';
import { usePeriodStore } from './stores/periodStore';
import Calendar from './components/Calendar';
import CycleStatus from './components/CycleStatus';
import LogPeriodButton from './components/LogPeriodButton';
import HistoryView from './components/HistoryView';
import TabBar from './components/TabBar';
import Settings from './components/Settings';
import type { Tab } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const [showSettings, setShowSettings] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const { loading, loadPeriods } = usePeriodStore();

  useEffect(() => {
    initializeDatabase().then(() => loadPeriods());
  }, []);

  // When year view taps a month, switch to calendar tab and navigate there
  const handleMonthSelect = useCallback((month: Date) => {
    setCalendarMonth(month);
    setTab('calendar');
  }, []);

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="app">
        <Settings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lua</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <div className="app-content">
        {tab === 'calendar' && (
          <>
            <CycleStatus />
            <Calendar currentMonth={calendarMonth} onMonthChange={setCalendarMonth} />
            <LogPeriodButton />
          </>
        )}
        {tab === 'history' && (
          <HistoryView onSwitchToCalendar={handleMonthSelect} />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
