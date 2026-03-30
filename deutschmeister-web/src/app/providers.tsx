'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui';
import { ApiError, clearTokens, initAuth } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, applyTheme, BACKEND_SETTINGS_KEYS, AppSettings } from '@/stores/settingsStore';
import { usersApi } from '@/lib/api/users';
import { DictionaryProvider } from '@/providers/DictionaryProvider';
import { WordHighlightProvider } from '@/providers/WordHighlightProvider';
import { GrammarAnalyzerProvider } from '@/providers/GrammarAnalyzerProvider';
import { AchievementToastProvider } from '@/components/ui/AchievementToast';

function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    // Don't hard-redirect here — let the onAuthExpired callback in authStore
    // handle the state change, and let each page's own auth guard redirect.
    // Hard redirect was causing flash-to-login on page refresh before initAuth could complete.
    clearTokens();
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
  const hasSyncedRef = useRef(false);
  // Block rendering until auth verification completes (prevents flash-to-login on refresh)
  const [authReady, setAuthReady] = useState(false);

  // Step 1: Load settings from localStorage (synchronous, instant)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Step 2: Re-apply theme whenever it changes (handles system preference toggle)
  useEffect(() => {
    if (isLoaded) applyTheme(settings.theme);
  }, [isLoaded, settings.theme]);

  // Step 3: Verify token + sync backend settings on every page load/refresh
  // BLOCKS children rendering until complete to prevent race conditions
  useEffect(() => {
    const run = async () => {
      const zustandIsAuth = useAuthStore.getState().isAuthenticated;
      if (!zustandIsAuth) {
        setAuthReady(true);
        return;
      }

      hasSyncedRef.current = true;

      // Verify token is still valid (refresh via httpOnly cookie)
      const tokenValid = await initAuth();
      if (!tokenValid) {
        hasSyncedRef.current = false;
        setAuthReady(true);
        return;
      }

      // Token is valid — fetch backend settings and merge
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

      setAuthReady(true);
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Step 4: When user logs in during the session, also sync backend settings.
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
      .catch(() => {});
  }, [isAuthenticated, syncFromBackend]);

  // Don't render children until auth verification is done
  // This prevents pages from firing API calls before the access token is refreshed
  if (!authReady) return null;

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

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const inner = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <WordHighlightProvider>
            <DictionaryProvider>
              <GrammarAnalyzerProvider>
                {children}
                <AchievementToastProvider />
              </GrammarAnalyzerProvider>
            </DictionaryProvider>
          </WordHighlightProvider>
        </AppInitializer>
      </QueryClientProvider>
    </ErrorBoundary>
  );

  // Only wrap with reCAPTCHA if site key is configured
  if (!recaptchaKey) return inner;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
      {inner}
    </GoogleReCaptchaProvider>
  );
}