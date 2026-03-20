import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Appearance } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Listen for system appearance changes when in 'system' mode
  useEffect(() => {
    if (themeMode !== 'system') return;
    const sub = Appearance.addChangeListener(() => {
      setThemeMode('system'); // Re-resolve colors
    });
    return () => sub.remove();
  }, [themeMode, setThemeMode]);

  // Hide splash screen once auth state is hydrated AND fonts loaded
  useEffect(() => {
    if (_hasHydrated && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }

    // Safety: force hide splash after 3s even if hydration/fonts fail
    const timeout = setTimeout(() => {
      console.warn('[RootLayout] Hydration/font timeout — forcing splash hide');
      useAuthStore.getState().setHasHydrated(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    return () => clearTimeout(timeout);
  }, [_hasHydrated, fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.b0 }}>
      <QueryProvider>
        <AuthProvider
          isAuthenticated={isAuthenticated}
          hasHydrated={_hasHydrated}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Slot />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
