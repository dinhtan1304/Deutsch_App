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

// Access token stored in memory only (more secure than localStorage)
let accessToken: string | null = null;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Refresh access token using httpOnly cookie
 * The refresh token is automatically sent via cookie by the browser
 */
async function refreshAccessToken(): Promise<string | null> {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT: This sends the httpOnly cookie
        body: JSON.stringify({}), // Empty body, refresh token comes from cookie
      });

      if (!response.ok) {
        console.warn('[Auth] Refresh failed:', response.status, await response.text().catch(() => ''));
        clearTokens();
        onAuthExpiredCallback?.();
        return null;
      }

      const data = await response.json();
      console.log('[Auth] Refresh success, got new access token');
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (err) {
      console.warn('[Auth] Refresh error:', err);
      clearTokens();
      onAuthExpiredCallback?.();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
    const newToken = await refreshAccessToken();
    if (newToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // If STILL 401 after successful refresh → token/session truly invalid
      if (response.status === 401) {
        clearTokens();
        onAuthExpiredCallback?.();
      }
    }
    // If refresh failed (newToken is null), onAuthExpiredCallback already
    // called inside refreshAccessToken() — no hard redirect needed
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
    token = await refreshAccessToken();
  }
  if (!token) {
    onAuthExpiredCallback?.();
    throw new ApiError(401, 'Vui lòng đăng nhập lại');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    credentials: 'include',
  });

  if (response.status === 401) {
    clearTokens();
    onAuthExpiredCallback?.();
    throw new ApiError(401, 'Phiên đăng nhập hết hạn');
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
 * Initialize authentication on app startup
 * Attempts to refresh token if we have a stored access token
 */
export async function initAuth(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) {
    // Try to refresh using cookie (in case page was refreshed)
    const newToken = await refreshAccessToken();
    return !!newToken;
  }
  return true;
}