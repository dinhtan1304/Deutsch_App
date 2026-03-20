import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@/theme';
import type { RecentActivity as RecentActivityType } from '@/types/dashboard';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeColors } from '@/theme/colors';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

function getActivityConfig(colors: ThemeColors): Record<
  RecentActivityType['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> {
  return {
    game: {
      icon: 'game-controller',
      color: colors.pastel.mint.base,
      bgColor: colors.pastel.mint.dim,
    },
    word: {
      icon: 'book',
      color: colors.pastel.sky.base,
      bgColor: colors.pastel.sky.dim,
    },
    topic: {
      icon: 'layers',
      color: colors.pastel.lavender.base,
      bgColor: colors.pastel.lavender.dim,
    },
    review: {
      icon: 'refresh-circle',
      color: colors.pastel.peach.base,
      bgColor: colors.pastel.peach.dim,
    },
    grammar: {
      icon: 'create',
      color: colors.pastel.lavender.base,
      bgColor: colors.pastel.lavender.dim,
    },
  };
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activityConfig = useMemo(() => getActivityConfig(colors), [colors]);
  if (!activities.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>
          Hoạt động gần đây
        </Text>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={32} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>
            Chưa có hoạt động nào
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Hoạt động gần đây
      </Text>
      {activities.slice(0, 5).map((activity, index) => {
        const config = activityConfig[activity.type];
        const isLast = index >= Math.min(activities.length, 5) - 1;
        return (
          <View
            key={`${activity.type}-${activity.timestamp}-${index}`}
            style={[
              styles.activityRow,
              !isLast && styles.activityRowBorder,
            ]}
          >
            <View
              style={[styles.activityIcon, { backgroundColor: config.bgColor }]}
            >
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription} numberOfLines={1}>
                {activity.description}
              </Text>
              <Text style={styles.activityTime}>
                {formatTimestamp(activity.timestamp)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function RecentActivitySkeleton() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.skeletonTitle} />
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonDesc} />
            <View style={styles.skeletonTime} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.strong,
  },
  activityIcon: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.primary,
  },
  activityTime: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  skeletonTitle: {
    marginBottom: spacing.md,
    height: 20,
    width: 144,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  skeletonIcon: {
    height: 36,
    width: 36,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b3,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonDesc: {
    height: 16,
    width: 192,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonTime: {
    marginTop: spacing.xs,
    height: 12,
    width: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
});
