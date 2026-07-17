import { clearSessionHint } from '@/lib/auth/sessionHint';

/**
 * API Client with secure token handling
 *
 * SECURITY IMPROVEMENTS:
 * - Refresh token is stored in httpOnly cookie (set by server)
 * - Access token is stored in memory only (not localStorage)
 * - On page refresh, we automatically call /refresh to get new access token
 * - onAuthExpired callback syncs auth state when tokens become invalid
 *
 * This prevents XSS attacks from stealing refresh tokens
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deutschmeister-api-production.up.railway.app/api';

/**
 * Active UI locale (vi/en/de), sent on every request as `x-app-locale` so the
 * backend can return AI feedback/explanations in the user's language. Reads the
 * next-intl NEXT_LOCALE cookie, falling back to the URL prefix, then 'vi'.
 */
function getAppLocale(): string {
  if (typeof document === 'undefined') return 'vi';
  const cookieLocale = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
  if (cookieLocale) return decodeURIComponent(cookieLocale);
  const seg = window.location.pathname.split('/')[1];
  return seg === 'en' || seg === 'de' ? seg : 'vi';
}

// Access token stored in memory only (more secure than localStorage)
let accessToken: string | null = null;

/**
 * Refresh outcome. Only a real 401 from /auth/refresh means the session is
 * gone ('expired'). Timeouts, offline, 429 and 5xx are 'transient' — the
 * httpOnly refresh cookie is likely still valid, so callers must NOT treat
 * them as a logout (users were getting kicked out mid-exercise on network
 * blips because every failure looked the same).
 */
type RefreshResult =
  | { status: 'ok'; token: string }
  | { status: 'expired' }
  | { status: 'transient' };

// Single-flight: concurrent callers share one in-flight refresh
let refreshPromise: Promise<RefreshResult> | null = null;

// Callback to notify auth store when tokens expire
// This bridges client.ts ↔ zustand authStore to prevent state desync
let onAuthExpiredCallback: (() => void) | null = null;

/**
 * Register a callback that fires when auth tokens become invalid.
 * Called by authStore to sync isAuthenticated state.
 */
export const onAuthExpired = (callback: () => void) => {
  onAuthExpiredCallback = callback;
};

/**
 * Set access token (stored in memory only — never persisted to localStorage)
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

/**
 * Get access token from memory only.
 * If null, initAuth() will call /refresh to restore it via httpOnly cookie.
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

/**
 * Clear access token from memory (logout).
 * Refresh token cookie is cleared server-side on logout endpoint.
 */
export const clearTokens = () => {
  accessToken = null;
  // Note: Refresh token cookie will be cleared by server on logout
};

// Stable, locale-independent error codes. UI layers translate these via the
// `errors` namespace (see useApiErrorMessage). The string message stays as a
// Vietnamese fallback for non-React contexts and legacy callers.
export type ApiErrorCode = 'AUTH_EXPIRED' | 'AUTH_REQUIRED';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
    public code?: ApiErrorCode,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Pull a user-facing message out of any thrown value.
 * NestJS class-validator errors come back as `{ message: string[] }` —
 * we join them so the form sees every failing field, not just the first.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (err instanceof ApiError) {
    const raw = (err.data as { message?: unknown })?.message ?? err.message;
    if (Array.isArray(raw)) return raw.filter(Boolean).join(' · ') || fallback;
    return typeof raw === 'string' && raw.length > 0 ? raw : fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Refresh access token using httpOnly cookie
 * The refresh token is automatically sent via cookie by the browser
 */
async function refreshAccessToken(): Promise<RefreshResult> {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
      let response: Response;
      try {
        response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // IMPORTANT: This sends the httpOnly cookie
          body: JSON.stringify({}), // Empty body, refresh token comes from cookie
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        console.warn('[Auth] Refresh failed:', response.status, await response.text().catch(() => ''));
        if (response.status === 401) {
          clearTokens();
          clearSessionHint();
          onAuthExpiredCallback?.();
          return { status: 'expired' };
        }
        return { status: 'transient' }; // 429 / 5xx — session may still be fine
      }

      const data = await response.json();
      console.log('[Auth] Refresh success, got new access token');
      setAccessToken(data.accessToken);
      return { status: 'ok', token: data.accessToken };
    } catch (err) {
      console.warn('[Auth] Refresh error (transient):', err);
      return { status: 'transient' }; // abort / offline / DNS
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** One automatic retry on transient failure — shared by api(), apiUpload(), initAuth(). */
async function refreshAccessTokenWithRetry(): Promise<RefreshResult> {
  const first = await refreshAccessToken();
  if (first.status !== 'transient') return first;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return refreshAccessToken();
}

/**
 * Main API request function with automatic token refresh
 */
export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-app-locale': getAppLocale(),
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // IMPORTANT: Always include credentials to send/receive cookies
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If unauthorized, try to refresh token (even if token was null — e.g. after page refresh)
  if (response.status === 401) {
    const result = await refreshAccessTokenWithRetry();
    if (result.status === 'ok') {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${result.token}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If STILL 401 after successful refresh → token/session truly invalid
      if (response.status === 401) {
        clearTokens();
        clearSessionHint();
        onAuthExpiredCallback?.();
      }
    }
    // 'expired': refreshAccessToken already cleared state + fired the callback.
    // 'transient': fall through and throw the 401 ApiError WITHOUT touching
    // auth state — the session likely survives and the caller can retry.
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP Error ${response.status}`,
      errorData
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Convenience methods
export const apiGet = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = <T>(endpoint: string, data?: unknown) =>
  api<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });

/**
 * Upload file via multipart/form-data with automatic token refresh.
 * Does NOT set Content-Type — lets the browser add the multipart boundary.
 *
 * Unlike api(), we pre-ensure a valid token BEFORE sending the upload
 * to avoid re-sending large payloads on 401 retry (FormData may not
 * be reliably re-consumable across all environments).
 */
export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // Pre-ensure valid token so we don't upload twice on 401
  let token = getAccessToken();
  if (!token) {
    const result = await refreshAccessTokenWithRetry();
    if (result.status === 'transient') {
      // Connection problem, not an expired session — don't log the user out
      throw new ApiError(0, 'Không thể kết nối máy chủ. Vui lòng thử lại.');
    }
    if (result.status === 'expired') {
      throw new ApiError(401, 'Vui lòng đăng nhập lại', undefined, 'AUTH_REQUIRED');
    }
    token = result.token;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-app-locale': getAppLocale() },
    body: formData,
    credentials: 'include',
  });

  if (response.status === 401) {
    clearTokens();
    clearSessionHint();
    onAuthExpiredCallback?.();
    throw new ApiError(401, 'Phiên đăng nhập hết hạn', undefined, 'AUTH_EXPIRED');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP Error ${response.status}`,
      errorData,
    );
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

/**
 * Initialize authentication on app startup.
 * 'transient' means the API was unreachable (offline, timeout, 5xx) — the
 * refresh cookie may still be valid, so callers must not treat it as logout.
 */
export type InitAuthResult = 'authenticated' | 'unauthenticated' | 'transient';

export async function initAuth(): Promise<InitAuthResult> {
  const token = getAccessToken();
  if (token) return 'authenticated';
  // Try to refresh using cookie (in case page was refreshed)
  const result = await refreshAccessTokenWithRetry();
  if (result.status === 'ok') return 'authenticated';
  return result.status === 'expired' ? 'unauthenticated' : 'transient';
}
