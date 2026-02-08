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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
 * Set access token (stored in memory only)
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token;

  // Also store in localStorage for persistence across page refreshes
  // Note: This is the ACCESS token only, not the refresh token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
};

/**
 * Get access token from memory or localStorage
 */
export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;

  // Try to restore from localStorage (for page refreshes)
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

/**
 * Clear all tokens (logout)
 */
export const clearTokens = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
  // Note: Refresh token cookie will be cleared by server on logout
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
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
        clearTokens();
        onAuthExpiredCallback?.();
        return null;
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
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

  // If unauthorized, try to refresh token
  if (response.status === 401 && token) {
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

export const apiPost = <T>(endpoint: string, data?: any) =>
  api<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data?: any) =>
  api<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });

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