import { create } from 'zustand';
import { db } from '../db';
import { exportData } from './importExport';
import { getValidToken, TOKEN_KEY } from './googleAuth';
import { findBackupFile, readFile, createFile, updateFile, DriveApiError } from './googleDrive';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  setStatus: (status: SyncStatus, error?: string | null) => void;
  setLastSyncedAt: (ts: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  connected: false, // Restored by initSync() from localStorage token presence
  setConnected: (connected) => set({ connected }),
  setStatus: (status, error = null) => set({ status, error }),
  setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
}));

// Module-level cache for the Drive file ID
let driveFileId: string | null = null;

/** Debounce timer for upload after mutation */
let uploadTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

/** Upload mutex to prevent concurrent uploads */
let uploadInProgress = false;

/** Upload data to Google Drive (internal) */
async function uploadNow(): Promise<void> {
  const store = useSyncStore.getState();
  if (!store.connected || uploadInProgress) return;

  const token = await getValidToken();
  if (!token) {
    store.setConnected(false);
    store.setStatus('idle');
    return;
  }

  uploadInProgress = true;
  store.setStatus('syncing');

  try {
    const json = await exportData();

    if (!driveFileId) {
      driveFileId = await findBackupFile(token);
    }

    if (driveFileId) {
      await updateFile(driveFileId, json, token);
    } else {
      driveFileId = await createFile(json, token);
    }

    const now = new Date().toISOString();
    await db.meta.put({ key: 'lastSyncedAt', value: now });
    store.setLastSyncedAt(now);
    store.setStatus('success');
  } catch (err) {
    if (err instanceof DriveApiError) {
      if (err.status === 401) {
        store.setConnected(false);
        driveFileId = null;
      } else if (err.status === 404) {
        // Cached file was deleted externally — clear and retry next time
        driveFileId = null;
      }
    }
    store.setStatus('error', err instanceof Error ? err.message : 'Sync failed');
  } finally {
    uploadInProgress = false;
  }
}

/** Debounced upload — call after every data mutation. Fire-and-forget. */
export function uploadAfterMutation(): void {
  if (!useSyncStore.getState().connected) return;
  if (uploadTimer) clearTimeout(uploadTimer);
  uploadTimer = setTimeout(() => { void uploadNow(); }, DEBOUNCE_MS);
}

/** Trigger immediate sync (for "Sync now" button) */
export async function syncNow(): Promise<void> {
  if (uploadTimer) clearTimeout(uploadTimer);
  await uploadNow();
}

/** Download from Drive on app start, import if remote is newer */
export async function downloadOnStart(): Promise<void> {
  const store = useSyncStore.getState();
  if (!store.connected) return;

  const token = await getValidToken();
  if (!token) {
    store.setConnected(false);
    store.setStatus('idle');
    return;
  }

  store.setStatus('syncing');

  try {
    driveFileId = await findBackupFile(token);
    if (!driveFileId) {
      store.setStatus('idle');
      return;
    }

    const content = await readFile(driveFileId, token);

    let remote: Record<string, unknown>;
    try {
      remote = JSON.parse(content);
    } catch {
      store.setStatus('error', 'Backup file is corrupted');
      return;
    }

    if (!remote?.exportedAt || typeof remote.exportedAt !== 'string') {
      store.setStatus('idle');
      return;
    }

    // Compare with local lastSyncedAt
    const meta = await db.meta.get('lastSyncedAt');
    const localTs = meta?.value;

    if (!localTs || new Date(remote.exportedAt as string) > new Date(localTs)) {
      // Validate remote data before clearing local
      const periods = remote.periods;
      if (!Array.isArray(periods)) {
        store.setStatus('error', 'Invalid backup format');
        return;
      }

      // Atomic replace: clear periods + reimport in a single transaction
      await db.transaction('rw', db.periods, db.meta, async () => {
        await db.periods.clear();
        if (periods.length > 0) {
          await db.periods.bulkAdd(
            periods.map((p: { startDate: string; endDate: string | null }) => ({
              startDate: p.startDate,
              endDate: p.endDate ?? null,
            }))
          );
        }
        const now = new Date().toISOString();
        await db.meta.put({ key: 'lastSyncedAt', value: now });
      });

      const now = new Date().toISOString();
      store.setLastSyncedAt(now);
    } else {
      store.setLastSyncedAt(localTs);
    }

    store.setStatus('success');
  } catch (err) {
    if (err instanceof DriveApiError) {
      if (err.status === 401) {
        store.setConnected(false);
        driveFileId = null;
      } else if (err.status === 404) {
        driveFileId = null;
      }
    }
    store.setStatus('error', err instanceof Error ? err.message : 'Download failed');
  }
}

const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;

/** Upload if last sync was more than 7 days ago (weekly heartbeat backup) */
export async function weeklyBackupIfNeeded(): Promise<void> {
  const store = useSyncStore.getState();
  if (!store.connected) return;

  const meta = await db.meta.get('lastSyncedAt');
  if (!meta?.value) {
    // Never synced — do it now
    void uploadNow();
    return;
  }

  const elapsed = Date.now() - new Date(meta.value).getTime();
  if (elapsed >= WEEKLY_MS) {
    void uploadNow();
  }
}

/** Initialize sync state from DB meta on app start */
export async function initSync(): Promise<void> {
  const meta = await db.meta.get('lastSyncedAt');
  if (meta?.value) {
    useSyncStore.getState().setLastSyncedAt(meta.value);
  }

  // Restore connected state: token existence means user was previously connected.
  // Token may be expired — getValidToken() will silently refresh when sync runs.
  // disconnect() removes the token, so presence = still connected.
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  if (hasToken) {
    useSyncStore.getState().setConnected(true);
  }
}
