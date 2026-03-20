import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

function GoogleIcon() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

function FacebookIcon() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

export default function LoginScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setError('');
    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và nhấn link xác nhận.');
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
        const params = new URL(result.url).searchParams;
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        if (accessToken && refreshToken) {
          await useAuthStore.getState().loginWithOAuth(accessToken, refreshToken);
        } else {
          setError('Đăng nhập OAuth thất bại. Không nhận được token.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập OAuth thất bại.');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Logo Row ── */}
          <Animated.View entering={FadeInDown.duration(400)} style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoLetter}>D</Text>
            </View>
            <Text style={s.appName}>DeutschMeister</Text>
          </Animated.View>

          {/* ── 2. Title + Subtitle ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.titleWrap}>
            <Text style={s.title}>Chào mừng trở lại!</Text>
            <Text style={s.subtitle}>Đăng nhập để tiếp tục học tiếng Đức</Text>
          </Animated.View>

          {/* ── Error ── */}
          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.pastel.rose.base} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── 3. Form Card ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.formCard}>
            {/* Email */}
            <View>
              <Text style={s.fieldLabel}>Email</Text>
              <View style={s.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />
                <TextInput
                  style={s.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldGap}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>Mật khẩu</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={s.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 4. Login Button ── */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading || oauthLoading}
              activeOpacity={0.85}
              style={[s.loginBtn, (isLoading || oauthLoading) && { opacity: 0.5 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.pastel.lime.on} size="small" />
              ) : (
                <Text style={s.loginBtnText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── 5. Divider ── */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>hoặc tiếp tục với</Text>
            <View style={s.dividerLine} />
          </View>

          {/* ── 6. OAuth Buttons ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <TouchableOpacity
              style={s.oauthBtn}
              onPress={() => handleOAuth('google')}
              disabled={isLoading || oauthLoading}
              activeOpacity={0.7}
            >
              <GoogleIcon />
              <Text style={s.oauthBtnText}>Tiếp tục với Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.oauthBtn, { marginTop: spacing.sm }]}
              onPress={() => handleOAuth('facebook')}
              disabled={isLoading || oauthLoading}
              activeOpacity={0.7}
            >
              <FacebookIcon />
              <Text style={s.oauthBtnText}>Tiếp tục với Facebook</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── 7. Register Link ── */}
          <View style={s.registerRow}>
            <Text style={s.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={s.registerLink}>Đăng ký miễn phí</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },

  // 1. Logo row
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pastel.lavender.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: '#ffffff',
  },
  appName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },

  // 2. Title + subtitle
  titleWrap: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.rose.dim,
    borderWidth: 1,
    borderColor: colors.pastel.rose.base + '40',
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.rose.base,
    lineHeight: 18,
  },

  // 3. Form card
  formCard: {
    backgroundColor: colors.bg.b1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.stone,
    padding: 20,
    marginBottom: spacing.xl,
  },

  // Fields
  fieldGap: { marginTop: spacing.lg },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.pastel.lavender.base,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.b2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },

  // 4. Login button
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.pastel.lime.base,
    marginTop: spacing.xl,
  },
  loginBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.lime.on,
  },

  // 5. Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  dividerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
  },

  // 6. OAuth buttons
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  oauthBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.primary,
  },

  // 7. Register link
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  registerLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
});
