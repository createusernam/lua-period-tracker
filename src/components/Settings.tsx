import { useState, useRef } from 'react';
import { exportData, importData, clearAllData, downloadFile } from '../services/importExport';
import { usePeriodStore } from '../stores/periodStore';
import { useI18n } from '../i18n/context';

interface Props {
  onClose: () => void;
}

export default function Settings({ onClose }: Props) {
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const loadPeriods = usePeriodStore((s) => s.loadPeriods);
  const { t } = useI18n();

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
