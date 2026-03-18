import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuthStore } from '@/stores/authStore';

import '../global.css';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const colorScheme = useColorScheme();

  // Hide splash screen once auth state is hydrated
  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider
          isAuthenticated={isAuthenticated}
          hasHydrated={_hasHydrated}
        >
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Slot />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
