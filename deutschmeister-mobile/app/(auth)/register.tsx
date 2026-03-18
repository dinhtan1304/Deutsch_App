import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Svg, { Path } from 'react-native-svg';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Password strength rules
const PW_RULES = [
  { id: 'length', label: 'It nhat 8 ky tu', test: (p: string) => p.length >= 8 },
  { id: 'lower', label: 'Chu thuong (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Chu hoa (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Co so (0-9)', test: (p: string) => /\d/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    const results = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));
    const score = results.filter((r) => r.ok).length;
    const colors = ['', '#EF4444', '#F97316', '#F59E0B', '#22C55E'];
    const labels = ['', 'Yeu', 'Trung binh', 'Kha', 'Manh'];
    return {
      results,
      score,
      pct: (score / PW_RULES.length) * 100,
      color: colors[score],
      label: labels[score],
    };
  }, [password]);

  if (!password) return null;

  return (
    <View className="mt-2">
      {/* Strength bar */}
      <View className="flex-row items-center mb-2">
        <View className="flex-1 h-1 rounded-full bg-dark-secondary overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${strength.pct}%`,
              backgroundColor: strength.color,
            }}
          />
        </View>
        {strength.label ? (
          <Text
            className="ml-2 text-xs font-bold"
            style={{ color: strength.color, minWidth: 60, textAlign: 'right' }}
          >
            {strength.label}
          </Text>
        ) : null}
      </View>

      {/* Rule checklist */}
      <View className="flex-row flex-wrap">
        {strength.results.map((r) => (
          <View key={r.id} className="flex-row items-center w-1/2 mb-1">
            <View
              className="w-4 h-4 rounded-full items-center justify-center mr-1.5"
              style={{
                borderWidth: 1.5,
                borderColor: r.ok ? '#4ADE80' : 'rgba(255,255,255,0.2)',
                backgroundColor: r.ok ? 'rgba(74,222,128,0.15)' : 'transparent',
              }}
            >
              {r.ok ? (
                <Ionicons name="checkmark" size={10} color="#4ADE80" />
              ) : null}
            </View>
            <Text
              className="text-xs"
              style={{ color: r.ok ? '#4ADE80' : 'rgba(255,255,255,0.35)' }}
            >
              {r.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const isPasswordValid = useMemo(
    () => PW_RULES.every((r) => r.test(password)),
    [password]
  );

  const isFormValid = useMemo(
    () =>
      isPasswordValid &&
      password === confirmPassword &&
      name.trim().length >= 2 &&
      email.trim().length > 0,
    [isPasswordValid, password, confirmPassword, name, email]
  );

  const handleRegister = async () => {
    setError('');
    if (name.trim().length < 2) {
      setError('Ten phai co it nhat 2 ky tu.');
      return;
    }
    if (!isPasswordValid) {
      setError('Mat khau chua du manh.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mat khau xac nhan khong khop.');
      return;
    }

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      Alert.alert(
        'Dang ky thanh cong!',
        'Chung toi da gui email xac nhan den dia chi email cua ban. Vui long kiem tra hop thu va nhan link xac nhan de hoan tat dang ky.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      setError(err.message || 'Dang ky that bai. Vui long thu lai.');
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(true);
      const callbackUrl = 'deutschmeister://callback';
      const url = `${API_URL}/auth/${provider}?redirect_uri=${encodeURIComponent(callbackUrl)}&platform=mobile`;
      const result = await WebBrowser.openAuthSessionAsync(url, callbackUrl);

      if (result.type === 'success' && result.url) {
        const params = new URL(result.url).searchParams;
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (accessToken && refreshToken) {
          const { loginWithOAuth } = useAuthStore.getState();
          await loginWithOAuth(accessToken, refreshToken);
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
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm ml-1">Quay lai</Text>
          </TouchableOpacity>

          {/* Logo & Heading */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-2xl bg-primary-500 items-center justify-center mr-3">
                <Text className="text-white text-lg font-bold">D</Text>
              </View>
              <Text className="text-primary-400 text-xl font-extrabold">
                Deutschmeister
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              Tao tai khoan mien phi
            </Text>
            <Text className="text-gray-400 text-sm">
              Bat dau hanh trinh chinh phuc tieng Duc ngay hom nay!
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
              <Text className="text-red-400 text-xs leading-5">{error}</Text>
            </View>
          ) : null}

          {/* Card */}
          <View className="bg-dark-card/50 rounded-3xl p-5 border border-dark-border mb-4">
            {/* Name Field */}
            <View className="mb-4">
              <Text className="text-gray-300 text-xs font-semibold mb-2">
                Ho ten
              </Text>
              <View className="flex-row items-center bg-dark-card rounded-xl border border-dark-border px-3 h-12">
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-white text-sm"
                  placeholder="Nguyen Van A"
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={100}
                />
              </View>
            </View>

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
                  placeholder="email@example.com"
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
            <View className="mb-4">
              <Text className="text-gray-300 text-xs font-semibold mb-2">
                Mat khau
              </Text>
              <View className="flex-row items-center bg-dark-card rounded-xl border border-dark-border px-3 h-12">
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-white text-sm"
                  placeholder="Nhap mat khau"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  maxLength={50}
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
              <PasswordStrength password={password} />
            </View>

            {/* Confirm Password Field */}
            <View className="mb-2">
              <Text className="text-gray-300 text-xs font-semibold mb-2">
                Xac nhan mat khau
              </Text>
              <View
                className="flex-row items-center bg-dark-card rounded-xl px-3 h-12"
                style={{
                  borderWidth: 1,
                  borderColor:
                    confirmPassword && confirmPassword !== password
                      ? 'rgba(239,68,68,0.5)'
                      : confirmPassword && confirmPassword === password
                        ? 'rgba(74,222,128,0.5)'
                        : '#374151',
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#9CA3AF"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-white text-sm"
                  placeholder="Nhap lai mat khau"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
                {confirmPassword ? (
                  confirmPassword === password ? (
                    <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                  ) : (
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  )
                ) : null}
              </View>
              {confirmPassword && confirmPassword !== password ? (
                <Text className="text-red-400 text-xs mt-1">
                  Mat khau khong khop
                </Text>
              ) : null}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className="mt-4 h-12 rounded-xl items-center justify-center flex-row"
              style={{
                backgroundColor:
                  !isFormValid || isLoading
                    ? 'rgba(34,197,94,0.4)'
                    : '#22C55E',
              }}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading || oauthLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Dang dang ky...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Dang ky
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-dark-border" />
            <Text className="text-gray-500 text-xs mx-3">
              hoac dang ky voi
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

          {/* Login Link */}
          <View className="flex-row items-center justify-center mt-6 mb-4">
            <Text className="text-gray-400 text-sm">Da co tai khoan? </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text className="text-primary-400 text-sm font-semibold">
                Dang nhap
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
