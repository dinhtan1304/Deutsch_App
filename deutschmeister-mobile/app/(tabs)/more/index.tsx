import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function MenuItem({ icon, label, sublabel, color, dimColor, onPress, isLast }: {
  icon: IoniconsName; label: string; sublabel?: string;
  color: string; dimColor: string; onPress: () => void; isLast?: boolean;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    >
      <View style={StyleSheet.flatten([styles.menuIconWrap, { backgroundColor: dimColor }])}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel} numberOfLines={1}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const MENU_SECTIONS = [
  {
    title: 'HỌC TẬP',
    items: [
      { icon: 'library-outline' as IoniconsName, label: 'Chủ đề', sublabel: 'Từ vựng A1–B1', pastel: 'mint' as const, route: '/more/topics' },
      { icon: 'folder-outline' as IoniconsName, label: 'Kho từ vựng', sublabel: 'Từ vựng cá nhân', pastel: 'peach' as const, route: '/more/word-bank' },
      { icon: 'document-text-outline' as IoniconsName, label: 'Ngữ pháp', sublabel: 'Bài học & bài tập', pastel: 'lavender' as const, route: '/(tabs)/practice/grammar' },
      { icon: 'refresh-outline' as IoniconsName, label: 'Ôn tập SRS', sublabel: 'Lặp lại ngắt quãng', pastel: 'rose' as const, route: '/more/review' },
    ],
  },
  {
    title: 'CỘNG ĐỒNG',
    items: [
      { icon: 'trophy-outline' as IoniconsName, label: 'Thành tựu', sublabel: 'Huy hiệu & phần thưởng', pastel: 'lavender' as const, route: '/more/achievements' },
      { icon: 'podium-outline' as IoniconsName, label: 'Bảng xếp hạng', sublabel: 'Xếp hạng tuần', pastel: 'peach' as const, route: '/more/leaderboard' },
      { icon: 'flag-outline' as IoniconsName, label: 'Thách thức', sublabel: 'Thách thức hàng tuần', pastel: 'mint' as const, route: '/more/challenges' },
    ],
  },
  {
    title: 'TÀI KHOẢN',
    items: [
      { icon: 'person-outline' as IoniconsName, label: 'Hồ sơ', sublabel: 'Thông tin cá nhân', pastel: 'lavender' as const, route: '/more/profile' },
      { icon: 'heart-outline' as IoniconsName, label: 'Yêu thích', sublabel: 'Từ đã lưu', pastel: 'rose' as const, route: '/more/favorites' },
      { icon: 'time-outline' as IoniconsName, label: 'Lịch sử', sublabel: 'Từ đã xem', pastel: 'sky' as const, route: '/more/history' },
      { icon: 'settings-outline' as IoniconsName, label: 'Cài đặt', sublabel: 'Giao diện & âm thanh', pastel: 'sky' as const, route: '/more/settings' },
      { icon: 'diamond-outline' as IoniconsName, label: 'Gói đăng ký', sublabel: 'Nâng cấp Premium', pastel: 'lime' as const, route: '/more/pricing' },
    ],
  },
];

export default function MoreScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="apps" size={22} color={colors.pastel.lavender.base} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Cài đặt & Thêm</Text>
            <Text style={styles.headerSubtitle}>Quản lý tài khoản và tùy chỉnh</Text>
          </View>
        </Animated.View>

        {MENU_SECTIONS.map((section, sectionIdx) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.duration(400).delay((sectionIdx + 1) * 100)}
            style={styles.sectionWrap}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <MenuItem
                  key={item.route}
                  icon={item.icon}
                  label={item.label}
                  sublabel={item.sublabel}
                  color={colors.pastel[item.pastel].base}
                  dimColor={colors.pastel[item.pastel].dim}
                  onPress={() => router.push(item.route as any)}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </Animated.View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.b0 },
  scrollView: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.pastel.lavender.dim,
    borderWidth: 1,
    borderColor: colors.pastel.lavender.base + '33',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Sections
  sectionWrap: { marginTop: spacing.xl },
  sectionTitle: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.widest,
    color: colors.text.tertiary,
  },
  sectionCard: {
    marginHorizontal: spacing.screenH,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden' as const,
  },

  // Menu items — single row: [icon] [label + sublabel] [chevron]
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600' as const,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  menuSublabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Bottom
  bottomSpacer: { height: spacing['3xl'] + 20 },
});
