/**
 * Mobile API Client with secure token handling
 *
 * MOBILE SECURITY:
 * - Access token stored in expo-secure-store (hardware-backed encryption)
 * - Refresh token stored in expo-secure-store (not httpOnly cookie like web)
 * - On app launch, we call /refresh with stored refresh token to get new access token
 * - onAuthExpired callback syncs auth state when tokens become invalid
 *
 * Same public API as web client: api, apiGet, apiPost, apiPut, apiDelete,
 * setAccessToken, getAccessToken, clearTokens, initAuth, onAuthExpired
 */

import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const ACCESS_TOKEN_KEY = 'dm_access_token';
const REFRESH_TOKEN_KEY = 'dm_refresh_token';

// In-memory cache for fast access (SecureStore is async)
let accessTokenCache: string | null = null;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Callback to notify auth store when tokens expire
let onAuthExpiredCallback: (() => void) | null = null;

/**
 * Register a callback that fires when auth tokens become invalid.
 */
export const onAuthExpired = (callback: () => void) => {
  onAuthExpiredCallback = callback;
};

/**
 * Set access token — stores in both memory cache and secure store
 */
export const setAccessToken = async (token: string | null) => {
  accessTokenCache = token;
  if (token) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }
};

/**
 * Set refresh token — stored only in secure store
 */
export const setRefreshToken = async (token: string | null) => {
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
};

/**
 * Get access token from memory cache (sync, fast)
 */
export const getAccessToken = (): string | null => {
  return accessTokenCache;
};

/**
 * Load access token from secure store into memory cache (async, call on app start)
 */
export const loadTokenFromStore = async (): Promise<string | null> => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  accessTokenCache = token;
  return token;
};

/**
 * Clear all tokens (logout)
 */
export const clearTokens = async () => {
  accessTokenCache = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
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
 * Refresh access token using stored refresh token
 * Mobile sends refresh token in POST body (not cookie)
 */
async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        await clearTokens();
        onAuthExpiredCallback?.();
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': 'mobile',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearTokens();
        onAuthExpiredCallback?.();
        return null;
      }

      const data = await response.json();
      await setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await setRefreshToken(data.refreshToken);
      }
      return data.accessToken;
    } catch {
      await clearTokens();
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Platform': 'mobile',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Mobile: no credentials: 'include' (no cookies)
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        await clearTokens();
        onAuthExpiredCallback?.();
      }
    }
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

export const apiPatch = <T>(endpoint: string, data?: any) =>
  api<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });

/**
 * Initialize authentication on app startup
 * Loads token from secure store, attempts refresh if needed
 */
export async function initAuth(): Promise<boolean> {
  // Load cached token from secure store into memory
  const token = await loadTokenFromStore();
  if (token) {
    // Verify token is still valid by attempting a lightweight request
    try {
      await api('/auth/me', { method: 'GET' });
      return true;
    } catch {
      // Token expired, try refresh
    }
  }

  // Try to refresh using stored refresh token
  const newToken = await refreshAccessToken();
  return !!newToken;
}
