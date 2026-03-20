import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet,
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

// ── Password rules ────────────────────────────────────
const PW_RULES = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (p: string) => p.length >= 8 },
  { id: 'lower', label: 'Chữ thường (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Chữ hoa (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Có số (0-9)', test: (p: string) => /\d/.test(p) },
];

const STRENGTH_LABELS = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];

function getStrengthColors(colors: any) {
  return [
    '',
    colors.pastel.rose.base,
    colors.pastel.peach.base,
    colors.pastel.sky.base,
    colors.pastel.mint.base,
  ];
}

function PasswordStrength({ password }: { password: string }) {
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  const strengthColors = useMemo(() => getStrengthColors(colors), [colors]);
  const strength = useMemo(() => {
    const results = PW_RULES.map((r) => ({ ...r, ok: r.test(password) }));
    const score = results.filter((r) => r.ok).length;
    return {
      results,
      score,
      pct: (score / PW_RULES.length) * 100,
      color: strengthColors[score],
      label: STRENGTH_LABELS[score],
    };
  }, [password, strengthColors]);

  if (!password) return null;

  return (
    <View style={ps.wrap}>
      <View style={ps.barRow}>
        <View style={ps.barOuter}>
          <View
            style={[
              ps.barInner,
              { width: `${strength.pct}%` as any, backgroundColor: strength.color },
            ]}
          />
        </View>
        {strength.label ? (
          <Text style={[ps.label, { color: strength.color }]}>{strength.label}</Text>
        ) : null}
      </View>
      <View style={ps.rulesWrap}>
        {strength.results.map((r) => (
          <View key={r.id} style={ps.ruleRow}>
            <View style={[ps.ruleCircle, r.ok && ps.ruleCircleOk]}>
              {r.ok ? (
                <Ionicons name="checkmark" size={10} color={colors.pastel.mint.base} />
              ) : null}
            </View>
            <Text style={[ps.ruleText, r.ok && ps.ruleTextOk]}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createPs = (colors: any) => StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  barOuter: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.b3,
    overflow: 'hidden',
  },
  barInner: { height: 4, borderRadius: 2 },
  label: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    minWidth: 60,
    textAlign: 'right',
  },
  rulesWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 4,
  },
  ruleCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  ruleCircleOk: {
    borderColor: colors.pastel.mint.base,
    backgroundColor: colors.pastel.mint.dim,
  },
  ruleText: { fontSize: typography.fontSize.xs, color: colors.text.tertiary, fontFamily: typography.fontFamily.body },
  ruleTextOk: { color: colors.pastel.mint.base },
});

// ── SVG Icons ─────────────────────────────────────────
function GoogleIcon() {
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
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
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────
export default function RegisterScreen() {
  const colors = useThemeStore((s) => s.colors);
  const ps = useMemo(() => createPs(colors), [colors]);
  const s = useMemo(() => createS(colors), [colors]);
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
    [password],
  );
  const isFormValid = useMemo(
    () =>
      isPasswordValid &&
      password === confirmPassword &&
      name.trim().length >= 2 &&
      email.trim().length > 0,
    [isPasswordValid, password, confirmPassword, name, email],
  );

  const handleRegister = async () => {
    setError('');
    if (name.trim().length < 2) {
      setError('Tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!isPasswordValid) {
      setError('Mật khẩu chưa đủ mạnh.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      Alert.alert(
        'Đăng ký thành công!',
        'Chúng tôi đã gửi email xác nhận. Vui lòng kiểm tra hộp thư.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
          setError('Đăng nhập OAuth thất bại.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập OAuth thất bại.');
    } finally {
      setOauthLoading(false);
    }
  };

  const confirmBorderColor = !confirmPassword
    ? colors.border.default
    : confirmPassword === password
      ? colors.pastel.mint.base + '80'
      : colors.pastel.rose.base + '80';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo Row ── */}
          <Animated.View entering={FadeInDown.duration(400)} style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>D</Text>
            </View>
            <Text style={s.brandText}>Deutschmeister</Text>
          </Animated.View>

          {/* ── Title + Subtitle ── */}
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.headingWrap}>
            <Text style={s.title}>Tạo tài khoản miễn phí</Text>
            <Text style={s.subtitle}>
              Bắt đầu hành trình chinh phục tiếng Đức ngay hôm nay!
            </Text>
          </Animated.View>

          {/* ── Error ── */}
          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.pastel.rose.base} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Form Card ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.formCard}>
            {/* Name */}
            <Text style={s.fieldLabel}>Họ tên</Text>
            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={s.input}
                placeholder="Nguyen Van A"
                placeholderTextColor={colors.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={100}
              />
            </View>

            {/* Email */}
            <Text style={[s.fieldLabel, { marginTop: spacing.lg }]}>Email</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={s.input}
                placeholder="email@example.com"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <Text style={[s.fieldLabel, { marginTop: spacing.lg }]}>Mật khẩu</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={s.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={colors.text.tertiary}
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
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
            <PasswordStrength password={password} />

            {/* Confirm Password */}
            <Text style={[s.fieldLabel, { marginTop: spacing.lg }]}>Xác nhận mật khẩu</Text>
            <View style={[s.inputRow, { borderColor: confirmBorderColor }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />
              <TextInput
                style={s.input}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
              {confirmPassword ? (
                confirmPassword === password ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.pastel.mint.base} />
                ) : (
                  <Ionicons name="close-circle" size={20} color={colors.pastel.rose.base} />
                )
              ) : null}
            </View>
            {confirmPassword && confirmPassword !== password ? (
              <Text style={s.mismatchText}>Mật khẩu không khớp</Text>
            ) : null}
          </Animated.View>

          {/* ── Register Button ── */}
          <TouchableOpacity
            style={[s.registerBtn, (!isFormValid || isLoading) && { opacity: 0.5 }]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading || oauthLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.pastel.lime.on} size="small" />
            ) : (
              <Text style={s.registerBtnText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>hoặc đăng ký với</Text>
            <View style={s.dividerLine} />
          </View>

          {/* ── OAuth ── */}
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

          {/* ── Login Link ── */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={s.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────
const createS = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.b0 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },

  // Logo row
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pastel.lavender.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: 18,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.lavender.on,
  },
  brandText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },

  // Heading
  headingWrap: { marginBottom: spacing.xl },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    lineHeight: 20,
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

  // Form Card
  formCard: {
    backgroundColor: colors.bg.b1,
    borderRadius: radius.stone,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 20,
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
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
  mismatchText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.pastel.rose.base,
    marginTop: 4,
  },

  // Register Button
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 999,
    backgroundColor: colors.pastel.lime.base,
    marginTop: spacing.xl,
  },
  registerBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.bodyBlack,
    color: colors.pastel.lime.on,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border.subtle },
  dividerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
    marginHorizontal: spacing.md,
  },

  // OAuth
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

  // Login link
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lime.base,
  },
});
