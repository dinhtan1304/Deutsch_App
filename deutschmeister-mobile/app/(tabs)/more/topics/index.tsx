import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTopics, useUserTopicsProgress, useTopicsStats } from '@/hooks/useTopics';
import { PastelCard } from '@/components/ui/PastelCard';
import { spacing, radius, typography, type PastelKey } from '@/theme';
import type { Topic, TopicWithProgress } from '@/types/topic';
import { useThemeStore } from '@/stores/themeStore';

// ── Constants ──────────────────────────────────────────

const LEVELS = ['A1', 'A2', 'B1'] as const;
type Level = (typeof LEVELS)[number];

const TOPIC_EMOJIS: Record<string, string> = {
  family: '👨‍👩‍👧',
  food: '🍔',
  home: '🏠',
  travel: '✈️',
  weather: '☀️',
  clothing: '👕',
  body: '🦴',
  animals: '🐾',
  education: '🎓',
  work: '💼',
  health: '🏥',
  sports: '⚽',
  nature: '🌿',
  technology: '💻',
  numbers: '🔢',
  colors: '🎨',
  time: '⏰',
  transport: '🚗',
  places: '📍',
  shopping: '🛒',
  hobby: '🎵',
  emotion: '😀',
  greetings: '👋',
  school: '🏫',
  daily: '☕',
  house: '🏠',
  drink: '🍹',
  fruit: '🍎',
  vegetable: '🥦',
  kitchen: '🍳',
  bathroom: '🛁',
  bedroom: '🛏️',
};

function getTopicEmoji(slug: string): string {
  const key = Object.keys(TOPIC_EMOJIS).find((k) => slug.toLowerCase().includes(k));
  return key ? TOPIC_EMOJIS[key] : '📖';
}

// ── Stat Card Item ─────────────────────────────────────

interface StatItem {
  label: string;
  value: string | number;
  color: PastelKey;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

function StatCard({ item }: { item: StatItem }) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  return (
    <PastelCard color={item.color} style={s.statCard}>
      <View style={[s.statIconBox, { backgroundColor: colors.pastel[item.color].base + '22' }]}>
        <Ionicons name={item.icon} size={18} color={colors.pastel[item.color].base} />
      </View>
      <Text style={[s.statValue, { color: colors.pastel[item.color].base }]}>
        {item.value}
      </Text>
      <Text style={s.statLabel}>{item.label}</Text>
    </PastelCard>
  );
}

// ── Topic Card ─────────────────────────────────────────

interface TopicCardProps {
  topic: Topic;
  progress?: { wordsLearned: number; wordsTotal: number; masteryPercent: number };
  onPress: () => void;
}

function TopicCard({ topic, progress, onPress }: TopicCardProps) {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const emoji = topic.icon || getTopicEmoji(topic.slug);
  const learned = progress?.wordsLearned ?? 0;
  const total = progress?.wordsTotal ?? topic.wordCount;
  const percent = progress?.masteryPercent ?? 0;

  return (
    <Pressable style={s.topicCard} onPress={onPress}>
      <View style={s.topicRow}>
        {/* Emoji / Icon */}
        <View style={s.topicIconBox}>
          <Text style={s.topicEmoji}>{emoji}</Text>
        </View>

        {/* Info */}
        <View style={s.topicInfo}>
          <View style={s.topicNameRow}>
            <Text style={s.topicName} numberOfLines={1}>
              {topic.nameVi || topic.nameEn}
            </Text>
            <Text style={s.topicWordCount}>{topic.wordCount} từ</Text>
          </View>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${Math.min(percent, 100)}%` },
              ]}
            />
          </View>

          {/* Progress text */}
          <Text style={s.progressText}>
            {learned}/{total} đã học
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────

export default function TopicsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const s = useMemo(() => createS(colors), [colors]);
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<Level>('A1');

  // Data hooks
  const {
    data: topicsData,
    isLoading: topicsLoading,
    refetch: refetchTopics,
    isRefetching,
  } = useTopics({ level: selectedLevel, isActive: true, limit: 100 });

  const { data: progressData, refetch: refetchProgress } = useUserTopicsProgress(true);
  const { data: statsData, refetch: refetchStats } = useTopicsStats();

  // Build progress lookup by topic id
  const progressMap = useMemo(() => {
    const map: Record<string, { wordsLearned: number; wordsTotal: number; masteryPercent: number }> = {};
    if (Array.isArray(progressData)) {
      for (const p of progressData as TopicWithProgress[]) {
        map[p.id] = {
          wordsLearned: p.wordsLearned,
          wordsTotal: p.wordsTotal,
          masteryPercent: p.masteryPercent,
        };
      }
    }
    return map;
  }, [progressData]);

  const topics: Topic[] = topicsData?.data ?? [];

  // Stats
  const statItems = useMemo((): StatItem[] => {
    const d = statsData as any;
    return [
      {
        label: 'Tổng chủ đề',
        value: d?.totalTopics ?? 0,
        color: 'lavender',
        icon: 'library',
      },
      {
        label: 'Tổng từ vựng',
        value: d?.totalWords ?? 0,
        color: 'sky',
        icon: 'book',
      },
      {
        label: 'Đã học',
        value: d?.learnedWords ?? 0,
        color: 'mint',
        icon: 'checkmark-circle',
      },
      {
        label: 'Hoàn thành',
        value: d?.completedTopics ?? 0,
        color: 'peach',
        icon: 'trophy',
      },
    ];
  }, [statsData]);

  const isLoading = topicsLoading;

  const onRefresh = useCallback(() => {
    refetchTopics();
    refetchProgress();
    refetchStats();
  }, [refetchTopics, refetchProgress, refetchStats]);

  const renderTopic = useCallback(
    ({ item }: { item: Topic }) => (
      <TopicCard
        topic={item}
        progress={progressMap[item.id]}
        onPress={() => router.push(`/(tabs)/more/topics/${item.id}` as any)}
      />
    ),
    [progressMap, router],
  );

  const keyExtractor = useCallback((item: Topic) => item.id, []);

  // ── Header component for FlatList ──
  const ListHeader = useMemo(
    () => (
      <>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={s.headerTextWrap}>
            <View style={s.headerRow}>
              <View style={s.headerIconBox}>
                <Ionicons name="library" size={20} color={colors.pastel.mint.base} />
              </View>
              <Text style={s.headerTitle}>Chủ đề</Text>
            </View>
            <Text style={s.headerSubtitle}>
              Từ vựng theo chủ đề A1-B1
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statsRow}
          style={s.statsScroll}
        >
          {statItems.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </ScrollView>

        {/* Level filter */}
        <View style={s.filterRow}>
          {LEVELS.map((level) => {
            const isActive = selectedLevel === level;
            return (
              <Pressable
                key={level}
                onPress={() => setSelectedLevel(level)}
                style={[
                  s.filterPill,
                  {
                    backgroundColor: isActive
                      ? colors.pastel.lime.base
                      : colors.bg.b2,
                  },
                ]}
              >
                <Text
                  style={[
                    s.filterPillText,
                    {
                      color: isActive
                        ? colors.pastel.lime.on
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    ),
    [statItems, selectedLevel, router],
  );

  // ── Empty & Loading ──
  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.pastel.mint.base} />
        </View>
      );
    }
    return (
      <View style={s.centered}>
        <Ionicons name="library-outline" size={48} color={colors.text.tertiary} />
        <Text style={s.emptyText}>Chưa có chủ đề nào</Text>
      </View>
    );
  }, [isLoading]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <FlatList
        data={topics}
        renderItem={renderTopic}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={<View style={s.footer} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.pastel.mint.base}
            colors={[colors.pastel.mint.base]}
          />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────

const createS = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.pastel.mint.dim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Stats
  statsScroll: {
    marginBottom: spacing.md,
  },
  statsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    width: 120,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  filterPillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.bodySemibold,
  },

  // Topic card
  topicCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.stone,
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.b3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicEmoji: {
    fontSize: 22,
    fontFamily: typography.fontFamily.body,
  },
  topicInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  topicWordCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.bodyMedium,
    color: colors.text.tertiary,
  },

  // Progress
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.b3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.pastel.lime.base,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },

  // States
  centered: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  footer: {
    height: 24,
  },
});
