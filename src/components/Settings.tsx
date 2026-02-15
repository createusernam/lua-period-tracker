import { useState, useRef } from 'react';
import { exportData, importData, clearAllData, downloadFile } from '../services/importExport';
import { usePeriodStore } from '../stores/periodStore';

interface Props {
  onClose: () => void;
}

export default function Settings({ onClose }: Props) {
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const loadPeriods = usePeriodStore((s) => s.loadPeriods);

  const handleExport = async () => {
    try {
      const json = await exportData();
      downloadFile(json, `lua-export-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage('Exported successfully');
    } catch (err) {
      setMessage(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      setMessage(`Imported ${count} periods`);
    } catch (err) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    // Always reset so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    await clearAllData();
    await loadPeriods();
    setMessage('All data deleted');
  };

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button onClick={onClose} className="settings-back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h2>Settings</h2>
        <div className="settings-header-spacer" />
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="section-title">Data</div>
          <button className="settings-row" onClick={handleExport}>
            Export data as JSON
          </button>
          <button className="settings-row" onClick={handleImport}>
            Import data from JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFile}
          />
          <button className="settings-row danger" onClick={handleClearAll}>
            Delete all data
          </button>
        </div>

        <div className="settings-section">
          <div className="section-title">About</div>
          <div className="settings-about">
            <strong>Lua</strong> — Period Tracker
            <br />
            All data stored locally on your device.
            <br />
            No accounts. No ads. No tracking.
          </div>
        </div>

        {message && <div className="settings-message">{message}</div>}
      </div>
    </div>
  );
}
