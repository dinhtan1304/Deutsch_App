import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

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
        setErrorMsg('Khong nhan duoc thong tin xac thuc. Vui long thu lai.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      try {
        await loginWithOAuth(accessToken, refreshToken);
        // AuthProvider will handle redirect to main app
      } catch {
        setErrorMsg('Dang nhap that bai. Vui long thu lai.');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    };

    handleCallback();
  }, [params.accessToken, params.refreshToken, params.error]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-1 items-center justify-center px-6">
        {errorMsg ? (
          <View className="items-center">
            <View className="w-14 h-14 rounded-full bg-red-500/20 items-center justify-center mb-4">
              <Text className="text-red-400 text-2xl">!</Text>
            </View>
            <Text className="text-red-400 text-base font-semibold mb-2">
              Loi xac thuc
            </Text>
            <Text className="text-gray-400 text-sm text-center leading-5">
              {errorMsg}
            </Text>
            <Text className="text-gray-500 text-xs mt-4">
              Dang chuyen huong ve trang dang nhap...
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-white text-base font-semibold mt-4">
              Dang xac thuc...
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Vui long doi trong giay lat
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
