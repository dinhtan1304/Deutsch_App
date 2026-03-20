import { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

/**
 * OAuth callback screen.
 * Handles the deep link redirect from OAuth providers.
 *
 * The OAuth flow works as follows:
 * 1. User taps Google/Facebook button on login/register screen
 * 2. expo-web-browser opens the API's OAuth URL
 * 3. After auth, the API redirects to deutschmeister://callback?accessToken=...&refreshToken=...
 * 4. expo-web-browser catches the redirect and returns the URL to the calling screen
 *
 * This screen serves as a fallback if the deep link is opened directly
 * (e.g., from an email link or if the browser flow doesn't return to the app properly).
 */
export default function OAuthCallbackScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>();
  const { loginWithOAuth } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      if (params.error) {
        setErrorMsg(params.error);
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      const { accessToken, refreshToken } = params;

      if (!accessToken || !refreshToken) {
        setErrorMsg('Không nhận được thông tin xác thực. Vui lòng thử lại.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      try {
        await loginWithOAuth(accessToken, refreshToken);
        // AuthProvider will handle redirect to main app
      } catch {
        setErrorMsg('Đăng nhập thất bại. Vui lòng thử lại.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    };

    handleCallback();
  }, [params.accessToken, params.refreshToken, params.error]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {errorMsg ? (
          <View style={styles.centerItems}>
            <View style={styles.errorIconCircle}>
              <Text style={styles.errorExclamation}>!</Text>
            </View>
            <Text style={styles.errorTitle}>
              Lỗi xác thực
            </Text>
            <Text style={styles.errorMessage}>
              {errorMsg}
            </Text>
            <Text style={styles.redirectText}>
              Đang chuyển hướng về trang đăng nhập...
            </Text>
          </View>
        ) : (
          <View style={styles.centerItems}>
            <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
            <Text style={styles.loadingTitle}>
              Đang xác thực...
            </Text>
            <Text style={styles.loadingSubtitle}>
              Vui lòng đợi trong giây lát
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  centerItems: {
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pastel.rose.dim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorExclamation: {
    color: colors.pastel.rose.base,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.body,
  },
  errorTitle: {
    color: colors.pastel.rose.base,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  redirectText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    marginTop: spacing.lg,
  },
  loadingTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    marginTop: spacing.lg,
  },
  loadingSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});
