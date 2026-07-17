'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useState, useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import { ErrorBoundary, ToastProvider } from '@/components/ui';
import { ApiError, clearTokens, initAuth } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { clearSessionHint, hasSessionHint, setSessionHint } from '@/lib/auth/sessionHint';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, applyTheme, BACKEND_SETTINGS_KEYS, AppSettings } from '@/stores/settingsStore';
import { DictionaryProvider } from '@/providers/DictionaryProvider';
import { WordHighlightProvider } from '@/providers/WordHighlightProvider';
import { GrammarAnalyzerProvider } from '@/providers/GrammarAnalyzerProvider';
import { AchievementToastProvider } from '@/components/ui/AchievementToast';
import { notifKeys } from '@/hooks/useNotifications';
import { subscriptionKeys } from '@/hooks/useSubscription';

// Real session expiry is handled centrally in client.ts (onAuthExpired fires
// only after a genuine 401 from /auth/refresh or the post-refresh retry). A
// 401 surfacing here can be a transient refresh failure (offline, timeout,
// 429) — clearing tokens/hint here used to kick users to login mid-exercise.
function handleGlobalError() {}

function pickBackendSettings(settings: Record<string, unknown>): Partial<AppSettings> {
  return BACKEND_SETTINGS_KEYS.reduce((acc, key) => {
    const val = settings[key as string];
    if (val !== undefined) (acc as Record<string, unknown>)[key as string] = val;
    return acc;
  }, {} as Partial<AppSettings>);
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { loadSettings, syncFromBackend, settings, isLoaded } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (isLoaded) applyTheme(settings.theme);
  }, [isLoaded, settings.theme]);

  useEffect(() => {
    const run = async () => {
      if (!hasSessionHint()) {
        useAuthStore.setState({
          bootstrap: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          _hasHydrated: true,
        });
        return;
      }

      useAuthStore.getState().setLoading(true);
      try {
        const tokenState = await initAuth();
        if (tokenState !== 'authenticated') {
          // 'unauthenticated': real expiry — client.ts already cleared the
          // session hint. 'transient': API unreachable — the hint stays, so
          // RequireAuth shows a retry panel instead of redirecting to login.
          useAuthStore.setState({
            bootstrap: null,
            user: null,
            isAuthenticated: false,
          });
          return;
        }

        const bootstrap = await authApi.bootstrap();
        setSessionHint();
        useAuthStore.getState().setBootstrap(bootstrap);
        queryClient.setQueryData(subscriptionKeys.me(), bootstrap.subscription);
        queryClient.setQueryData(['xp'], bootstrap.xp);
        queryClient.setQueryData(notifKeys.unread(), bootstrap.unreadCount);
        syncFromBackend(pickBackendSettings(bootstrap.settings));
      } catch (error) {
        // Only a real 401 ends the session; other bootstrap errors (network,
        // 5xx) keep the hint so the user gets a retry panel, not a logout.
        if (error instanceof ApiError && error.status === 401) {
          clearTokens();
          clearSessionHint();
        }
        useAuthStore.setState({
          bootstrap: null,
          user: null,
          isAuthenticated: false,
        });
      } finally {
        const state = useAuthStore.getState();
        state.setLoading(false);
        state.setHasHydrated(true);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

function AuthRecaptchaGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const needsRecaptcha =
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/forgot-password' ||
    pathname === '/auth/reset-password';

  if (!recaptchaKey || !needsRecaptcha) return <>{children}</>;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
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
        <AuthRecaptchaGate>
          <AppInitializer>
            <WordHighlightProvider>
              <DictionaryProvider>
                <GrammarAnalyzerProvider>
                  <ToastProvider>
                    {children}
                    <AchievementToastProvider />
                  </ToastProvider>
                </GrammarAnalyzerProvider>
              </DictionaryProvider>
            </WordHighlightProvider>
          </AppInitializer>
        </AuthRecaptchaGate>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
