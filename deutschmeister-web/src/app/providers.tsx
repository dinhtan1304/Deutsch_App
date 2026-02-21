'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui';
import { ApiError, clearTokens, initAuth } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, applyTheme, BACKEND_SETTINGS_KEYS, AppSettings } from '@/stores/settingsStore';
import { usersApi } from '@/lib/api/users';
import { DictionaryProvider } from '@/providers/DictionaryProvider';
import { WordHighlightProvider } from '@/providers/WordHighlightProvider';
import { GrammarAnalyzerProvider } from '@/providers/GrammarAnalyzerProvider';

function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      const isAuthPage = window.location.pathname.startsWith('/auth');
      if (!isAuthPage) window.location.href = '/auth/login';
    }
  }
}

/**
 * BUG FIX 6: Merged AppInitializer (from the dead providers/index.tsx) into
 * app/providers.tsx so it's actually used.
 *
 * Previously:
 *   - providers/index.tsx had AppInitializer with full settings sync logic
 *   - app/layout.tsx imported Providers from app/providers.tsx (not providers/index.tsx)
 *   - Result: providers/index.tsx was dead code, backend settings sync never fired
 *   - Symptoms: changing theme/dailyGoal on one device never synced to another
 *
 * This component now handles:
 *   1. loadSettings() — reads from localStorage on mount (fast, no network)
 *   2. Re-applies theme whenever settings change
 *   3. initAuth() — refreshes access token via httpOnly cookie on page load
 *   4. syncFromBackend() — fetches backend settings after auth confirmed valid
 *      so device-switching (e.g. login on mobile) gets correct theme/preferences
 */
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { loadSettings, syncFromBackend, settings, isLoaded } = useSettingsStore();
  // Prevents the double GET /users/settings that would otherwise fire on mount for
  // authenticated users: Step 3 (mount effect) and Step 4 (isAuthenticated effect)
  // both run on the same render when the user is already logged in.
  const hasSyncedRef = useRef(false);

  // Step 1: Load settings from localStorage (synchronous, instant)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Step 2: Re-apply theme whenever it changes (handles system preference toggle)
  useEffect(() => {
    if (isLoaded) applyTheme(settings.theme);
  }, [isLoaded, settings.theme]);

  // Step 3: Verify token + sync backend settings on every page load/refresh
  useEffect(() => {
    const run = async () => {
      const zustandIsAuth = useAuthStore.getState().isAuthenticated;
      if (!zustandIsAuth) return;
      // Mark synced BEFORE the first await so Step 4's synchronous check sees it
      // and skips its own fetch — prevents two simultaneous GET /users/settings
      // when the user is already authenticated on mount.
      hasSyncedRef.current = true;

      // Verify token is still valid (refresh via httpOnly cookie)
      const tokenValid = await initAuth();
      if (!tokenValid) { hasSyncedRef.current = false; return; } // token expired → let Step 4 retry after re-login

      // Token is valid — fetch backend settings and merge
      // This syncs theme/soundEnabled/dailyGoal from server so device-switching works
      try {
        const backendSettings = await usersApi.getSettings();
        const picked = BACKEND_SETTINGS_KEYS.reduce((acc, key) => {
          const val = (backendSettings as unknown as Record<string, unknown>)[key as string];
          if (val !== undefined) (acc as Record<string, unknown>)[key as string] = val;
          return acc;
        }, {} as Partial<AppSettings>);
        syncFromBackend(picked);
      } catch {
        // Backend unavailable — continue with localStorage values
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — intentionally not re-running on isAuthenticated change

  // Step 4: When user logs in during the session, also sync backend settings.
  // Skipped on initial mount if Step 3 already claimed the sync (hasSyncedRef).
  useEffect(() => {
    if (!isAuthenticated || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    usersApi.getSettings()
      .then((backendSettings) => {
        const picked = BACKEND_SETTINGS_KEYS.reduce((acc, key) => {
          const val = (backendSettings as unknown as Record<string, unknown>)[key as string];
          if (val !== undefined) (acc as Record<string, unknown>)[key as string] = val;
          return acc;
        }, {} as Partial<AppSettings>);
        syncFromBackend(picked);
      })
      .catch(() => {}); // Silently ignore
  }, [isAuthenticated, syncFromBackend]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status === 401) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: handleGlobalError,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <WordHighlightProvider>
            <DictionaryProvider>
              <GrammarAnalyzerProvider>
                {children}
              </GrammarAnalyzerProvider>
            </DictionaryProvider>
          </WordHighlightProvider>
        </AppInitializer>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}