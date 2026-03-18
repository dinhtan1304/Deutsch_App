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

  // Initialize auth on app start
  useEffect(() => {
    if (!hasHydrated) return;

    const init = async () => {
      try {
        await initAuth();
      } catch {
        // Token refresh failed — user will be redirected to login
      } finally {
        setIsInitializing(false);
      }
    };

    init();
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
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return <>{children}</>;
}
