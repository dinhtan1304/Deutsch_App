import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, typography } from '@/theme';
import type { DashboardStats } from '@/types/dashboard';
import { useThemeStore } from '@/stores/themeStore';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

function buildCards(stats: DashboardStats, colors: any): StatCard[] {
  return [
    {
      label: 'Chuỗi ngày',
      value: stats.streak,
      icon: 'flame',
      color: colors.pastel.peach.base,
      bgColor: colors.pastel.peach.dim,
    },
    {
      label: 'Từ đã học',
      value: `${stats.totalWordsLearned}/${stats.totalWords}`,
      icon: 'book',
      color: colors.pastel.sky.base,
      bgColor: colors.pastel.sky.dim,
    },
    {
      label: 'Chính xác',
      value: `${stats.accuracy}%`,
      icon: 'checkmark-circle',
      color: colors.pastel.mint.base,
      bgColor: colors.pastel.mint.dim,
    },
    {
      label: 'Phút học',
      value: stats.totalMinutes,
      icon: 'time',
      color: colors.pastel.lavender.base,
      bgColor: colors.pastel.lavender.dim,
    },
    {
      label: 'Games',
      value: stats.gamesPlayed,
      icon: 'game-controller',
      color: colors.pastel.lavender.base,
      bgColor: colors.pastel.lavender.dim,
    },
    {
      label: 'Chủ đề',
      value: `${stats.topicsCompleted}/${stats.totalTopics}`,
      icon: 'layers',
      color: colors.pastel.mint.base,
      bgColor: colors.pastel.mint.dim,
    },
    {
      label: 'Cần ôn tập',
      value: stats.wordsToReview,
      icon: 'refresh-circle',
      color: colors.pastel.rose.base,
      bgColor: colors.pastel.rose.dim,
    },
  ];
}

export function StatsCards({ stats }: StatsCardsProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cards = buildCards(stats, colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
    >
      {cards.map((card) => (
        <View
          key={card.label}
          style={styles.card}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: card.bgColor }]}
          >
            <Ionicons name={card.icon} size={20} color={card.color} />
          </View>
          <Text
            style={[styles.valueText, { color: card.color }]}
          >
            {card.value}
          </Text>
          <Text style={styles.labelText}>{card.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export function StatsCardsSkeleton() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[styles.card, { height: 120 }]}
        >
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonValue} />
          <View style={styles.skeletonLabel} />
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: spacing.lg,
    width: 130,
  },
  iconContainer: {
    marginBottom: spacing.md,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  valueText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  labelText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  skeletonIcon: {
    marginBottom: spacing.md,
    height: 40,
    width: 40,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b3,
  },
  skeletonValue: {
    height: 24,
    width: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
  skeletonLabel: {
    marginTop: spacing.sm,
    height: 12,
    width: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.b3,
  },
});
