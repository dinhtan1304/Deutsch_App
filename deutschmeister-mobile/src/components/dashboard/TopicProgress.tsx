import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { spacing, radius, typography } from '@/theme';
import type { TopicProgress as TopicProgressType } from '@/types/dashboard';
import { useThemeStore } from '@/stores/themeStore';

interface TopicProgressProps {
  topics: TopicProgressType[];
}

export function TopicProgress({ topics }: TopicProgressProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!topics.length) {
    return null;
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>
        Tiến độ chủ đề
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
      >
        {topics.map((topic) => {
          const progressWidth = Math.max(topic.percent, 2);
          return (
            <View
              key={topic.id}
              style={styles.topicCard}
            >
              {/* Icon + Name */}
              <View style={styles.topicHeader}>
                <View
                  style={[
                    styles.topicIcon,
                    {
                      backgroundColor: topic.color
                        ? `${topic.color}22`
                        : 'rgba(99,102,241,0.15)',
                    },
                  ]}
                >
                  <Text style={styles.topicIconText}>{topic.icon || '📖'}</Text>
                </View>
                <View style={styles.topicNameContainer}>
                  <Text
                    style={styles.topicNameVi}
                    numberOfLines={1}
                  >
                    {topic.nameVi}
                  </Text>
                  <Text
                    style={styles.topicNameDe}
                    numberOfLines={1}
                  >
                    {topic.nameDe}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressWidth}%`,
                      backgroundColor: topic.color || colors.pastel.lavender.base,
                    },
                  ]}
                />
              </View>

              {/* Stats */}
              <View style={styles.topicStats}>
                <Text style={styles.topicStatsText}>
                  {topic.wordsLearned}/{topic.totalWords} từ
                </Text>
                <Text
                  style={[
                    styles.topicPercent,
                    { color: topic.color || colors.pastel.lavender.base },
                  ]}
                >
                  {topic.percent}%
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TopicProgressSkeleton() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View>
      <View style={styles.skeletonTitleContainer}>
        <View style={styles.skeletonTitle} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            style={[styles.topicCard, { height: 120 }]}
          >
            <View style={styles.topicHeader}>
              <View style={styles.skeletonIcon} />
              <View style={styles.topicNameContainer}>
                <View style={styles.skeletonNameVi} />
                <View style={styles.skeletonNameDe} />
              </View>
            </View>
            <View style={styles.skeletonProgressBar} />
            <View style={styles.skeletonStats} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  sectionTitle: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  topicCard: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
    width: 160,
  },
  topicHeader: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicIcon: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  topicIconText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
  topicNameContainer: {
    flex: 1,
  },
  topicNameVi: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  topicNameDe: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  progressBarTrack: {
    marginBottom: spacing.sm,
    height: 8,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicStatsText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  topicPercent: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
  },
  skeletonTitleContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skeletonTitle: {
    height: 20,
    width: 128,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonIcon: {
    height: 32,
    width: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonNameVi: {
    height: 12,
    width: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonNameDe: {
    marginTop: spacing.xs,
    height: 12,
    width: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonProgressBar: {
    marginBottom: spacing.sm,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
  },
  skeletonStats: {
    height: 12,
    width: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
});
