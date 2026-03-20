import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings, useUpdateSettings } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/authStore';
import type { Settings, UpdateSettingsPayload } from '@/lib/api/users';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type ThemeOption = 'light' | 'dark' | 'system';
type LevelOption = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';

const THEME_OPTIONS: Array<{ value: ThemeOption; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { value: 'dark', label: 'Tối', icon: 'moon' },
  { value: 'light', label: 'Sáng', icon: 'sunny' },
  { value: 'system', label: 'Hệ thống', icon: 'phone-portrait-outline' },
];

const DAILY_GOALS = [5, 10, 15, 20, 30, 50];

const LEVELS: Array<{ value: LevelOption; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
];

function SectionTitle({ title }: { title: string }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  children,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: React.ReactNode;
  color?: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedColor = color ?? colors.text.secondary;
  return (
    <View style={styles.settingRow}>
      <View
        style={[styles.settingIconBox, { backgroundColor: `${resolvedColor}20` }]}
      >
        <Ionicons name={icon} size={18} color={resolvedColor} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const logout = useAuthStore((s) => s.logout);

  const [localSettings, setLocalSettings] = useState<Partial<Settings>>({});

  // Sync server settings to local state + apply theme
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      if (settings.theme) {
        setThemeMode(settings.theme);
      }
    }
  }, [settings, setThemeMode]);

  const handleUpdate = useCallback(
    (patch: UpdateSettingsPayload) => {
      setLocalSettings((prev) => ({ ...prev, ...patch }));
      updateSettings.mutate(patch);
      // Apply theme change immediately
      if (patch.theme) {
        setThemeMode(patch.theme);
      }
    },
    [updateSettings, setThemeMode],
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login' as any);
        },
      },
    ]);
  }, [logout, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.pastel.lavender.base} />
      </SafeAreaView>
    );
  }

  const theme = (localSettings.theme as ThemeOption) ?? 'dark';
  const soundEnabled = localSettings.soundEnabled ?? true;
  const vibrationEnabled = localSettings.vibrationEnabled ?? true;
  const dailyGoal = localSettings.dailyGoal ?? 10;
  const preferredLevel = (localSettings.preferredLevel as LevelOption) ?? 'all';
  const showVietnamese = localSettings.showVietnamese ?? true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>

        {/* ===== Appearance ===== */}
        <SectionTitle title="Giao diện" />
        <View style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.cardLabel}>Chế độ hiển thị</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const isActive = theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleUpdate({ theme: opt.value })}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: isActive ? colors.pastel.lavender.base : colors.border.strong },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isActive ? colors.text.primary : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.themeBtnText,
                        { color: isActive ? colors.text.primary : colors.text.secondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ===== Sound & Haptics ===== */}
        <SectionTitle title="Âm thanh & Rung" />
        <View style={styles.card}>
          <SettingRow icon="volume-high-outline" label="Âm thanh" color={colors.pastel.sky.base}>
            <Switch
              value={soundEnabled}
              onValueChange={(val) => handleUpdate({ soundEnabled: val })}
              trackColor={{ false: colors.bg.b3, true: colors.pastel.mint.dim }}
              thumbColor={soundEnabled ? colors.pastel.mint.base : '#FFFFFF'}
            />
          </SettingRow>
          <View style={styles.divider} />
          <SettingRow icon="phone-portrait-outline" label="Rung" color={colors.pastel.lavender.base}>
            <Switch
              value={vibrationEnabled}
              onValueChange={(val) => handleUpdate({ vibrationEnabled: val })}
              trackColor={{ false: colors.bg.b3, true: colors.pastel.mint.dim }}
              thumbColor={vibrationEnabled ? colors.pastel.mint.base : '#FFFFFF'}
            />
          </SettingRow>
        </View>

        {/* ===== Learning ===== */}
        <SectionTitle title="Học tập" />
        <View style={styles.card}>
          {/* Daily Goal */}
          <View style={styles.cardInner}>
            <View style={styles.goalHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: colors.pastel.mint.dim }]}>
                <Ionicons name="flag-outline" size={18} color={colors.pastel.mint.base} />
              </View>
              <Text style={styles.settingLabel}>Mục tiêu hàng ngày</Text>
              <Text style={styles.goalValue}>{dailyGoal} từ</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingLeft: 48 }}
            >
              {DAILY_GOALS.map((goal) => {
                const isActive = dailyGoal === goal;
                return (
                  <Pressable
                    key={goal}
                    onPress={() => handleUpdate({ dailyGoal: goal })}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isActive ? colors.pastel.lavender.base : colors.border.strong },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? colors.text.primary : colors.text.secondary },
                      ]}
                    >
                      {goal}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Preferred Level */}
          <View style={styles.cardInner}>
            <View style={styles.goalHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: colors.pastel.peach.dim }]}>
                <Ionicons name="school-outline" size={18} color={colors.pastel.peach.base} />
              </View>
              <Text style={styles.settingLabel}>Trình độ ưu tiên</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingLeft: 48 }}
            >
              {LEVELS.map((lvl) => {
                const isActive = preferredLevel === lvl.value;
                return (
                  <Pressable
                    key={lvl.value}
                    onPress={() => handleUpdate({ preferredLevel: lvl.value })}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isActive ? colors.pastel.lavender.base : colors.border.strong },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isActive ? colors.text.primary : colors.text.secondary },
                      ]}
                    >
                      {lvl.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Show Vietnamese */}
          <SettingRow icon="language-outline" label="Hiện tiếng Việt" color={colors.pastel.mint.base}>
            <Switch
              value={showVietnamese}
              onValueChange={(val) => handleUpdate({ showVietnamese: val })}
              trackColor={{ false: colors.bg.b3, true: colors.pastel.mint.dim }}
              thumbColor={showVietnamese ? colors.pastel.mint.base : '#FFFFFF'}
            />
          </SettingRow>
        </View>

        {/* ===== Logout ===== */}
        <View style={styles.logoutSection}>
          <Pressable
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.pastel.rose.base} />
            <Text style={styles.logoutText}>
              Đăng xuất
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    overflow: 'hidden',
  },
  cardInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardLabel: {
    marginBottom: 10,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.lg,
    paddingVertical: 10,
  },
  themeBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  settingIconBox: {
    marginRight: spacing.md,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  settingLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  divider: {
    marginLeft: 64,
    height: 1,
    backgroundColor: colors.border.strong,
  },
  goalHeader: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.pastel.lavender.base,
  },
  chipBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  logoutSection: {
    marginHorizontal: spacing.lg,
    marginTop: 32,
    marginBottom: 48,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.stone,
    backgroundColor: colors.pastel.rose.dim,
    paddingVertical: spacing.lg,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.pastel.rose.base,
  },
});
