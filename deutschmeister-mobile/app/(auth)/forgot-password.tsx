import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/lib/api/auth';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

export default function ForgotPasswordScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gửi email thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
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
          {/* Back */}
          <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
            <Text style={s.backText}>Quay lại</Text>
          </TouchableOpacity>

          {/* Icon + Title */}
          <View style={s.heroSection}>
            <View style={s.iconCircle}>
              <Ionicons name="key-outline" size={28} color={colors.pastel.lavender.base} />
            </View>
            <Text style={s.title}>Quên mật khẩu?</Text>
            <Text style={s.subtitle}>
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn link đặt lại mật khẩu.
            </Text>
          </View>

          {isSuccess ? (
            <View style={s.successCard}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark-circle" size={28} color={colors.pastel.mint.base} />
              </View>
              <Text style={s.successTitle}>Đã gửi email!</Text>
              <Text style={s.successDesc}>
                Vui lòng kiểm tra hộp thư{' '}
                <Text style={s.emailHighlight}>{email}</Text> và làm theo hướng dẫn để đặt lại mật khẩu.
              </Text>
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={s.primaryBtnText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={s.fieldWrap}>
                <Text style={s.label}>Địa chỉ email</Text>
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} style={{ marginRight: 10 }} />
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

              <TouchableOpacity
                style={[s.primaryBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color={colors.pastel.lime.on} size="small" />
                    <Text style={[s.primaryBtnText, { marginLeft: 8 }]}>Đang gửi...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color={colors.pastel.lime.on} />
                    <Text style={[s.primaryBtnText, { marginLeft: 8 }]}>Gửi link đặt lại</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={s.loginLink} onPress={() => router.replace('/(auth)/login')}>
                <Text style={s.loginLinkText}>
                  Quay lại <Text style={s.loginLinkAccent}>Đăng nhập</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createS = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.b0 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, marginLeft: 4 },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.pastel.lavender.dim,
    borderWidth: 1, borderColor: colors.pastel.lavender.base + '33',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { color: colors.text.primary, fontSize: typography.fontSize.xl, fontWeight: '800', fontFamily: typography.fontFamily.heading, marginBottom: 8 },
  subtitle: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, textAlign: 'center', lineHeight: 20 },
  successCard: {
    backgroundColor: colors.pastel.mint.dim,
    borderWidth: 1, borderColor: colors.pastel.mint.base + '40',
    borderRadius: radius.stone, padding: 20, alignItems: 'center',
  },
  successIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.pastel.mint.base + '33',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  successTitle: { color: colors.pastel.mint.base, fontSize: typography.fontSize.base, fontWeight: '700', fontFamily: typography.fontFamily.bodyBold, marginBottom: 8 },
  successDesc: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emailHighlight: { color: colors.text.primary, fontWeight: '500', fontFamily: typography.fontFamily.bodyMedium },
  errorBox: {
    marginBottom: 16, padding: 12, borderRadius: radius.lg,
    backgroundColor: colors.pastel.rose.dim,
    borderWidth: 1, borderColor: colors.pastel.rose.base + '40',
  },
  errorText: { color: colors.pastel.rose.base, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.body, lineHeight: 18 },
  fieldWrap: { marginBottom: 24 },
  label: { color: colors.text.secondary, fontSize: typography.fontSize.xs, fontWeight: '600', fontFamily: typography.fontFamily.bodySemibold, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg.b2, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border.default,
    paddingHorizontal: 12, height: 48,
  },
  input: { flex: 1, color: colors.text.primary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body },
  primaryBtn: {
    height: 50, borderRadius: 999,
    backgroundColor: colors.pastel.lime.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: colors.pastel.lime.on, fontWeight: '800', fontFamily: typography.fontFamily.bodyBlack, fontSize: typography.fontSize.base },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginLinkText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.body },
  loginLinkAccent: { color: colors.pastel.lime.base, fontWeight: '600', fontFamily: typography.fontFamily.bodySemibold },
});
