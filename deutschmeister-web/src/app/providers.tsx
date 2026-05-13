'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ui';
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

function handleGlobalError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    clearTokens();
    clearSessionHint();
  }
}

function pickBackendSettings(settings: Record<string, unknown>): Partial<AppSettings> {
  return BACKEND_SETTINGS_KEYS.reduce((acc, key) => {
    const val = settings[key as string];
    if (val !== undefined) (acc as Record<string, unknown>)[key as string] = val;
    return acc;
  }, {} as Partial<AppSettings>);
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { loadSettings, syncFromBackend, settings, isLoaded } = useSettingsStore();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (isLoaded) applyTheme(settings.theme);
  }, [isLoaded, settings.theme]);

  useEffect(() => {
    const isPublicRoute =
      pathname === '/' ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/pricing') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/resources');

    const run = async () => {
      if (isPublicRoute && !hasSessionHint()) {
        hasSyncedRef.current = false;
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
        const tokenValid = await initAuth();
        if (!tokenValid) {
          hasSyncedRef.current = false;
          useAuthStore.setState({
            bootstrap: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            _hasHydrated: true,
          });
          return;
        }

        const bootstrap = await authApi.bootstrap();
        setSessionHint();
        hasSyncedRef.current = true;
        useAuthStore.getState().setBootstrap(bootstrap);
        queryClient.setQueryData(subscriptionKeys.me(), bootstrap.subscription);
        queryClient.setQueryData(['xp'], bootstrap.xp);
        queryClient.setQueryData(notifKeys.unread(), bootstrap.unreadCount);
        syncFromBackend(pickBackendSettings(bootstrap.settings));
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearTokens();
          clearSessionHint();
        }
        hasSyncedRef.current = false;
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
  }, [pathname, queryClient, syncFromBackend]);

  useEffect(() => {
    if (!isAuthenticated || hasSyncedRef.current) return;
    hasSyncedRef.current = true;
    authApi.bootstrap()
      .then((bootstrap) => {
        setSessionHint();
        useAuthStore.getState().setBootstrap(bootstrap);
        queryClient.setQueryData(subscriptionKeys.me(), bootstrap.subscription);
        queryClient.setQueryData(['xp'], bootstrap.xp);
        queryClient.setQueryData(notifKeys.unread(), bootstrap.unreadCount);
        syncFromBackend(pickBackendSettings(bootstrap.settings));
      })
      .catch(() => {});
  }, [isAuthenticated, queryClient, syncFromBackend]);

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
                  {children}
                  <AchievementToastProvider />
                </GrammarAnalyzerProvider>
              </DictionaryProvider>
            </WordHighlightProvider>
          </AppInitializer>
        </AuthRecaptchaGate>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
