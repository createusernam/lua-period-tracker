const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const BACKUP_NAME = 'lua-backup.json';

export class DriveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

async function driveRequest(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new DriveApiError(`Drive API error: ${res.status}`, res.status);
  }
  return res;
}

/** Find lua-backup.json in user's Drive, return file ID or null */
export async function findBackupFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_NAME}' and trashed=false`);
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${q}&fields=files(id)&spaces=drive`,
    token,
  );
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

/** Read file content by ID */
export async function readFile(fileId: string, token: string): Promise<string> {
  const res = await driveRequest(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    token,
  );
  return res.text();
}

/** Create a new file with multipart upload */
export async function createFile(content: string, token: string): Promise<string> {
  const metadata = { name: BACKUP_NAME, mimeType: 'application/json' };
  const boundary = '---lua-backup-boundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await driveRequest(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  const data = await res.json();
  return data.id;
}

/** Update existing file content */
export async function updateFile(fileId: string, content: string, token: string): Promise<void> {
  await driveRequest(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    },
  );
}
