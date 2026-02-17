export const TOKEN_KEY = 'lua-gdrive-token';
const EXPIRY_KEY = 'lua-gdrive-expiry';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SILENT_REFRESH_TIMEOUT_MS = 5000;

// Pending resolve/reject for the current token request
let pendingResolve: ((token: string) => void) | null = null;
let pendingReject: ((err: Error) => void) | null = null;
let requestInFlight = false;

let tokenClient: TokenClient | null = null;

function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

function isGisLoaded(): boolean {
  return typeof google !== 'undefined' && !!google.accounts?.oauth2;
}

function handleTokenResponse(response: TokenResponse): void {
  if (response.error) {
    pendingReject?.(new Error(response.error));
  } else {
    storeToken(response.access_token, response.expires_in);
    pendingResolve?.(response.access_token);
  }
  pendingResolve = null;
  pendingReject = null;
  requestInFlight = false;
}

function handleErrorResponse(error: { type: string; message: string }): void {
  pendingReject?.(new Error(error.message || error.type || 'auth_error'));
  pendingResolve = null;
  pendingReject = null;
  requestInFlight = false;
}

export function initTokenClient(): void {
  if (!isGisLoaded()) return;
  const clientId = getClientId();
  if (!clientId) return;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: handleTokenResponse,
    error_callback: handleErrorResponse,
  });
}

/** Open consent popup, return access token */
export function requestToken(): Promise<string> {
  if (requestInFlight) {
    return Promise.reject(new Error('auth_in_progress'));
  }

  return new Promise((resolve, reject) => {
    if (!isGisLoaded()) {
      reject(new Error('gis_not_loaded'));
      return;
    }
    if (!tokenClient) initTokenClient();
    if (!tokenClient) {
      reject(new Error('gis_not_loaded'));
      return;
    }

    requestInFlight = true;
    pendingResolve = resolve;
    pendingReject = reject;
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/** Return cached valid token, or silently refresh (prompt: ''). Times out after 5s. */
export function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (token && expiry && Date.now() < Number(expiry)) {
    return Promise.resolve(token);
  }

  // Try silent refresh with timeout
  return new Promise((resolve) => {
    if (!isGisLoaded() || !tokenClient) {
      if (isGisLoaded()) initTokenClient();
      if (!tokenClient) {
        resolve(null);
        return;
      }
    }

    if (requestInFlight) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      pendingResolve = null;
      pendingReject = null;
      requestInFlight = false;
      resolve(null);
    }, SILENT_REFRESH_TIMEOUT_MS);

    requestInFlight = true;
    pendingResolve = (t) => { clearTimeout(timeout); resolve(t); };
    pendingReject = () => { clearTimeout(timeout); resolve(null); };
    tokenClient!.requestAccessToken({ prompt: '' });
  });
}

/** Check if token exists AND is not expired */
export function isConnected(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  return !!token && !!expiry && Date.now() < Number(expiry);
}

export function disconnect(): void {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && isGisLoaded()) {
    google.accounts.oauth2.revoke(token, () => {});
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

function storeToken(token: string, expiresIn: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Store expiry with 60s buffer
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
}
