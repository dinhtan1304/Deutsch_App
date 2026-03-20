import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { initAuth } from '@/lib/api/client';
import { View, ActivityIndicator } from 'react-native';

interface AuthProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  hasHydrated: boolean;
}

/**
 * Auth gate: redirects to login if not authenticated,
 * redirects to dashboard if authenticated and on auth screen.
 */
export function AuthProvider({ children, isAuthenticated, hasHydrated }: AuthProviderProps) {
  const segments = useSegments();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth on app start (with timeout)
  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;
    const init = async () => {
      try {
        // Race initAuth against a 5s timeout
        await Promise.race([
          initAuth(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
      } catch {
        // Token refresh failed or timed out — user will be redirected to login
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [hasHydrated]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isInitializing || !hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but on auth screen, redirect to dashboard
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isInitializing, hasHydrated]);

  // Show loading while initializing auth
  if (isInitializing || !hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#8EAD92" />
      </View>
    );
  }

  return <>{children}</>;
}
