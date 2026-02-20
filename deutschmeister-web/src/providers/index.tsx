'use client';

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, applyTheme, BACKEND_SETTINGS_KEYS, AppSettings } from '@/stores/settingsStore';
import { usersApi } from '@/lib/api/users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInitializer({ children }: { children: ReactNode }) {
  const fetchUser = useAuthStore(state => state.fetchUser);
  const authHydrated = useAuthStore(state => state._hasHydrated);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { loadSettings, syncFromBackend, settings, isLoaded } = useSettingsStore();

  // Step 1: Load from localStorage immediately (fast, no network)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Step 2: Re-apply theme whenever settings change
  useEffect(() => {
    if (isLoaded) {
      applyTheme(settings.theme);
    }
  }, [isLoaded, settings.theme]);

  // Step 3: Fetch user on hydration
  useEffect(() => {
    if (authHydrated) {
      fetchUser();
    }
  }, [authHydrated, fetchUser]);

  // Step 4: Once authenticated, fetch backend settings and merge
  // Backend settings (theme, soundEnabled, dailyGoal, preferredLevel, showVietnamese)
  // take priority over localStorage so device-switching works correctly
  useEffect(() => {
    if (!isAuthenticated) return;

    usersApi.getSettings()
      .then((backendSettings) => {
        // Only pick keys that are stored in the backend
        const picked = BACKEND_SETTINGS_KEYS.reduce((acc, key) => {
          const val = (backendSettings as unknown as Record<string, unknown>)[key as string];
          if (val !== undefined) (acc as Record<string, unknown>)[key as string] = val;
          return acc;
        }, {} as Partial<AppSettings>);

        syncFromBackend(picked);
      })
      .catch(() => {
        // Backend unavailable — continue with localStorage values, no crash
      });
  }, [isAuthenticated, syncFromBackend]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Apply initial theme from localStorage immediately (before React hydrates)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('deutschmeister-settings');
        if (stored) {
          const s = JSON.parse(stored);
          if (s.theme) applyTheme(s.theme);
        }
      } catch {}
    }
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        {children}
      </AppInitializer>
    </QueryClientProvider>
  );
}