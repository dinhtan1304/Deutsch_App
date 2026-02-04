'use client';

import { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, applyTheme } from '@/stores/settingsStore';

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
  const { loadSettings, settings, isLoaded } = useSettingsStore();
  
  // Load settings on mount
  useEffect(() => {
    console.log('[AppInitializer] Loading settings...');
    loadSettings();
  }, [loadSettings]);

  // Apply theme whenever settings change
  useEffect(() => {
    if (isLoaded) {
      console.log('[AppInitializer] Settings loaded, applying theme:', settings.theme);
      applyTheme(settings.theme);
    }
  }, [isLoaded, settings.theme]);

  // Fetch user
  useEffect(() => {
    if (authHydrated) {
      fetchUser();
    }
  }, [authHydrated, fetchUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Apply initial theme from localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('deutschmeister-settings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.theme) {
            console.log('[Providers] Initial theme from storage:', settings.theme);
            applyTheme(settings.theme);
          }
        }
      } catch (e) {
        console.error('Error loading initial theme:', e);
      }
    }
  }, []);

  // Show nothing while mounting to prevent flash
  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        {children}
      </AppInitializer>
    </QueryClientProvider>
  );
}