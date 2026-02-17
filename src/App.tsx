import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { db } from './db';
import { initializeDatabase } from './db';
import { usePeriodStore } from './stores/periodStore';
import { importData } from './services/importExport';
import { initTokenClient } from './services/googleAuth';
import { downloadOnStart, uploadAfterMutation, initSync, useSyncStore, weeklyBackupIfNeeded } from './services/syncService';
import { useI18n } from './i18n/context';
import PhaseStatus from './components/PhaseStatus';
import HomeCalendar from './components/HomeCalendar';
import FluctuationSnippet from './components/FluctuationSnippet';
import CycleDynamicsChart from './components/CycleDynamicsChart';
import CycleHistory from './components/CycleHistory';
import OnboardingCard from './components/OnboardingCard';
import LanguageSwitcher from './components/LanguageSwitcher';
import ScrollCalendar from './components/ScrollCalendar';
import Settings from './components/Settings';
import type { PeriodChange } from './components/ScrollCalendar';
import type { Screen, CalendarViewMode } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [editOrigin, setEditOrigin] = useState<Screen>('home');
  const [calendarMode, setCalendarMode] = useState<CalendarViewMode>('month');
  const loading = usePeriodStore((s) => s.loading);
  const isEmpty = usePeriodStore((s) => s.periods.length === 0);
  const loadPeriods = usePeriodStore((s) => s.loadPeriods);
  const { t, lang } = useI18n();
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeDatabase().then(async () => {
      initTokenClient();
      await initSync();
      // initSync restores connected state from token presence in localStorage.
      // getValidToken() inside downloadOnStart will silently refresh if expired.
      if (useSyncStore.getState().connected) {
        await downloadOnStart();
        weeklyBackupIfNeeded();
      }
      await loadPeriods();
    });
  }, []);

  // Navigation handlers
  const handleOpenCalendar = useCallback(() => {
    setCalendarMode('month');
    setScreen('calendar');
  }, []);

  const handleOpenEdit = useCallback((from: Screen) => {
    setEditOrigin(from);
    setScreen('edit');
  }, []);

  const handleCloseCalendar = useCallback(() => {
    setScreen('home');
  }, []);

  const handleCloseEdit = useCallback(() => {
    setScreen(editOrigin);
  }, [editOrigin]);

  const handleEditFromCalendar = useCallback(() => {
    setEditOrigin('calendar');
    setScreen('edit');
  }, []);

  // Save handler for edit mode — atomic Dexie transaction
  const handleSaveChanges = useCallback(async (changes: PeriodChange[]) => {
    await db.transaction('rw', db.periods, async () => {
      for (const change of changes) {
        if (change.action === 'add') {
          await db.periods.add({ startDate: change.period.startDate, endDate: change.period.endDate });
        } else if (change.action === 'update' && change.period.id) {
          await db.periods.update(change.period.id, { startDate: change.period.startDate, endDate: change.period.endDate });
        } else if (change.action === 'delete' && change.period.id) {
          await db.periods.delete(change.period.id);
        }
      }
    });
    await loadPeriods();
    uploadAfterMutation();
  }, [loadPeriods]);

  // Import handler for onboarding
  const handleImport = useCallback(() => {
    importRef.current?.click();
  }, []);

  const [importError, setImportError] = useState('');

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const text = await file.text();
      await importData(text);
      await loadPeriods();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    if (importRef.current) importRef.current.value = '';
  }, [loadPeriods]);

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Settings screen
  if (screen === 'settings') {
    return (
      <div className="app">
        <Settings onClose={() => setScreen('home')} />
      </div>
    );
  }

  // Calendar screen (read-only)
  if (screen === 'calendar') {
    return (
      <div className="app">
        <ScrollCalendar
          mode="readonly"
          viewMode={calendarMode}
          onViewModeChange={setCalendarMode}
          onClose={handleCloseCalendar}
          onEditFromCalendar={handleEditFromCalendar}
        />
      </div>
    );
  }

  // Edit screen
  if (screen === 'edit') {
    return (
      <div className="app">
        <ScrollCalendar
          key="edit"
          mode="edit"
          viewMode="month"
          onViewModeChange={() => {}}
          onClose={handleCloseEdit}
          onSave={handleSaveChanges}
        />
      </div>
    );
  }

  // Home screen
  const today = new Date();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="settings-btn"
            onClick={() => setScreen('settings')}
            aria-label={t('settings.title')}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <LanguageSwitcher />
        </div>
        <div className="header-date">{format(today, 'd MMMM yyyy', { locale: lang === 'ru' ? ru : undefined })}</div>
        <button className="calendar-icon-btn" onClick={handleOpenCalendar} aria-label={t('home.cycle_history')}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </header>

      <div className="app-content">
        {/* Phase status — dimmed when empty */}
        <PhaseStatus dimmed={isEmpty} />

        {/* Calendar — current month, always shown */}
        <HomeCalendar />

        {isEmpty ? (
          <>
            <OnboardingCard
              onImport={handleImport}
              onLogFirst={() => handleOpenEdit('home')}
            />
            {importError && <div className="import-error">{importError}</div>}
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleImportFile}
            />
          </>
        ) : (
          <>
            {/* Log period button */}
            <button
              className="log-period-btn"
              onClick={() => handleOpenEdit('home')}
            >
              {t('home.log_period')}
            </button>

            {/* Below the fold */}
            <div className="section-divider" />
            <FluctuationSnippet />

            <div className="section-divider" />
            <CycleDynamicsChart />

            <div className="section-divider" />
            <button className="section-title-link" onClick={handleOpenCalendar}>
              {t('home.cycle_history')}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <CycleHistory limit={3} />
          </>
        )}
      </div>
    </div>
  );
}
