import { useState, useRef } from 'react';
import { exportData, importData, clearAllData, downloadFile } from '../services/importExport';
import { usePeriodStore } from '../stores/periodStore';
import { requestToken, disconnect, initTokenClient } from '../services/googleAuth';
import { useSyncStore, syncNow, downloadOnStart } from '../services/syncService';
import { useI18n } from '../i18n/context';
import { formatRelativeTime } from '../utils';

interface Props {
  onClose: () => void;
}

export default function Settings({ onClose }: Props) {
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const loadPeriods = usePeriodStore((s) => s.loadPeriods);
  const { t, lang } = useI18n();
  const { status, lastSyncedAt, error, connected } = useSyncStore();

  const handleExport = async () => {
    try {
      const json = await exportData();
      downloadFile(json, `lua-export-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(t('settings.exported'));
    } catch (err) {
      setMessage(t('settings.export_failed', { error: err instanceof Error ? err.message : 'Unknown error' }));
    }
  };

  const handleImport = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importData(text);
      await loadPeriods();
      setMessage(t('settings.imported', { count }));
    } catch (err) {
      setMessage(t('settings.import_failed', { error: err instanceof Error ? err.message : 'Unknown error' }));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClearAll = async () => {
    if (!confirm(t('settings.confirm_delete'))) return;
    await clearAllData();
    await loadPeriods();
    setMessage(t('settings.deleted'));
  };

  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      initTokenClient();
      await requestToken();
      useSyncStore.getState().setConnected(true);
      await downloadOnStart();
      await loadPeriods();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg === 'gis_not_loaded') {
        setMessage(t('sync.gis_not_loaded'));
      } else if (msg !== 'auth_in_progress') {
        setMessage(t('sync.connect_failed', { error: msg }));
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (!confirm(t('sync.confirm_disconnect'))) return;
    disconnect();
    useSyncStore.getState().setConnected(false);
    useSyncStore.getState().setStatus('idle');
  };

  const handleSyncNow = () => {
    void syncNow();
  };

  // Build sync status text
  let syncStatusText = '';
  let syncDotClass = 'sync-dot';
  if (connected) {
    if (status === 'syncing') {
      syncStatusText = t('sync.syncing');
      syncDotClass = 'sync-dot syncing';
    } else if (status === 'error' && error) {
      syncStatusText = t('sync.sync_failed', { error });
      syncDotClass = 'sync-dot error';
    } else if (status === 'success' && lastSyncedAt) {
      syncStatusText = t('sync.last_synced', { time: formatRelativeTime(lastSyncedAt, lang) });
      syncDotClass = 'sync-dot success';
    } else {
      syncStatusText = t('sync.idle');
      syncDotClass = 'sync-dot idle';
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button onClick={onClose} className="settings-back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('settings.back')}
        </button>
        <h2>{t('settings.title')}</h2>
        <div className="settings-header-spacer" />
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="section-title">{t('settings.data_section')}</div>
          <button className="settings-row" onClick={handleExport}>
            {t('settings.export')}
          </button>
          <button className="settings-row" onClick={handleImport}>
            {t('settings.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFile}
          />
          <button className="settings-row danger" onClick={handleClearAll}>
            {t('settings.delete_all')}
          </button>
        </div>

        <div className="settings-section">
          <div className="section-title">{t('sync.section_title')}</div>
          {connected ? (
            <>
              <div className="sync-status-row">
                <span className={syncDotClass} />
                <span className="sync-status-text">{syncStatusText}</span>
              </div>
              <button className="settings-row" onClick={handleSyncNow} disabled={status === 'syncing'}>
                {t('sync.sync_now')}
              </button>
              <button className="settings-row danger" onClick={handleDisconnect}>
                {t('sync.disconnect')}
              </button>
            </>
          ) : (
            <button className="settings-row" onClick={handleConnect} disabled={connecting}>
              {connecting ? t('sync.syncing') : t('sync.connect')}
            </button>
          )}
        </div>

        <div className="settings-section">
          <div className="section-title">{t('settings.about')}</div>
          <div className="settings-about">
            {t('settings.about_text').split('\n').map((line, i) => (
              <span key={i}>{i > 0 && <br />}{line}</span>
            ))}
          </div>
        </div>

        {message && <div className="settings-message">{message}</div>}
      </div>
    </div>
  );
}
