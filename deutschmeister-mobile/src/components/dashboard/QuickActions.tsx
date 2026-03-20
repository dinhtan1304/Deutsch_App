import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

interface ActionItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
}

function getActions(colors: ThemeColors): ActionItem[] {
  return [
    {
      label: 'Học từ vựng',
      icon: 'book',
      color: colors.pastel.sky.base,
      bgColor: colors.pastel.sky.dim,
      route: '/(tabs)/words',
    },
    {
      label: 'Chơi game',
      icon: 'game-controller',
      color: colors.pastel.mint.base,
      bgColor: colors.pastel.mint.dim,
      route: '/(tabs)/games',
    },
    {
      label: 'Luyện thi',
      icon: 'school',
      color: colors.pastel.lavender.base,
      bgColor: colors.pastel.lavender.dim,
      route: '/(tabs)/practice',
    },
    {
      label: 'Ôn tập SRS',
      icon: 'refresh-circle',
      color: colors.pastel.peach.base,
      bgColor: colors.pastel.peach.dim,
      route: '/(tabs)/words',
    },
  ];
}

export function QuickActions() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const actions = useMemo(() => getActions(colors), [colors]);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Hành động nhanh</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.route as any)}
            style={styles.actionCard}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: action.bgColor }]}
            >
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>
              {action.label}
            </Text>
            <View style={styles.ctaRow}>
              <Text style={[styles.ctaText, { color: action.color }]}>
                Bắt đầu
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={action.color}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
    width: '47.5%',
  },
  iconContainer: {
    marginBottom: spacing.md,
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
    color: colors.text.primary,
  },
  ctaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ctaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
  },
});
