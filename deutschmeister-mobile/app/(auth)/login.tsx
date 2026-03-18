import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Svg, { Path } from 'react-native-svg';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Vui long nhap email va mat khau.');
      return;
    }
    setError('');
    try {
      await login({ email: email.trim(), password });
      // AuthProvider will handle redirect
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError(
          'Email chua duoc xac nhan. Vui long kiem tra hop thu va nhan link xac nhan.'
        );
      } else {
        setError(err.message || 'Dang nhap that bai. Vui long thu lai.');
      }
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(true);
      const callbackUrl = 'deutschmeister://callback';
      const url = `${API_URL}/auth/${provider}?redirect_uri=${encodeURIComponent(callbackUrl)}&platform=mobile`;
      const result = await WebBrowser.openAuthSessionAsync(url, callbackUrl);

      if (result.type === 'success' && result.url) {
        // Extract tokens from callback URL
        const params = new URL(result.url).searchParams;
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
          const { loginWithOAuth } = useAuthStore.getState();
          await loginWithOAuth(accessToken, refreshToken);
          // AuthProvider will handle redirect
        } else {
          setError('Dang nhap OAuth that bai. Khong nhan duoc token.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Dang nhap OAuth that bai.');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Heading */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-primary-500 items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">D</Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              Chao mung tro lai!
            </Text>
            <Text className="text-gray-400 text-sm">
              Dang nhap de tiep tuc hoc tieng Duc
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
              <Text className="text-red-400 text-xs leading-5">{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View className="mb-4">
            <Text className="text-gray-300 text-xs font-semibold mb-2">
              Email
            </Text>
            <View className="flex-row items-center bg-dark-card rounded-xl border border-dark-border px-3 h-12">
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9CA3AF"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="your@email.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Field */}
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-300 text-xs font-semibold">
                Mat khau
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text className="text-primary-400 text-xs font-medium">
                  Quen mat khau?
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center bg-dark-card rounded-xl border border-dark-border px-3 h-12">
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#9CA3AF"
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="mt-6 h-12 rounded-xl bg-primary-500 items-center justify-center flex-row"
            onPress={handleLogin}
            disabled={isLoading || oauthLoading}
            activeOpacity={0.8}
            style={isLoading ? { opacity: 0.6 } : undefined}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-sm ml-2">
                  Dang dang nhap...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="white" />
                <Text className="text-white font-bold text-sm ml-2">
                  Dang nhap
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-dark-border" />
            <Text className="text-gray-500 text-xs mx-3">
              hoac tiep tuc voi
            </Text>
            <View className="flex-1 h-px bg-dark-border" />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center h-12 rounded-xl border border-dark-border bg-dark-card mb-3"
            onPress={() => handleOAuth('google')}
            disabled={isLoading || oauthLoading}
            activeOpacity={0.7}
          >
            <GoogleIcon />
            <Text className="text-gray-200 text-sm font-medium ml-3">
              Tiep tuc voi Google
            </Text>
          </TouchableOpacity>

          {/* Facebook OAuth Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center h-12 rounded-xl border border-dark-border bg-dark-card"
            onPress={() => handleOAuth('facebook')}
            disabled={isLoading || oauthLoading}
            activeOpacity={0.7}
          >
            <FacebookIcon />
            <Text className="text-gray-200 text-sm font-medium ml-3">
              Tiep tuc voi Facebook
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-gray-400 text-sm">
              Chua co tai khoan?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
            >
              <Text className="text-primary-400 text-sm font-semibold">
                Dang ky mien phi
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
