import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import type { GrammarLesson, GrammarProgress } from '@/types/grammar';
import { spacing, radius, typography } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';

const LEVELS = ['all', 'A1', 'A2', 'B1'] as const;

// ── Screen ──

export default function GrammarScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: lessons,
    isLoading: loadingLessons,
    refetch: refetchLessons,
  } = useGrammarLessons(selectedLevel === 'all' ? undefined : selectedLevel);

  const {
    data: progress,
    refetch: refetchProgress,
  } = useGrammarProgress();

  // Build progress lookup map
  const progressMap = useMemo(() => {
    const map: Record<string, GrammarProgress> = {};
    if (progress) {
      for (const p of progress) {
        map[p.lessonId] = p;
      }
    }
    return map;
  }, [progress]);

  // Group lessons by level
  const groupedLessons = useMemo(() => {
    if (!lessons) return {};
    const groups: Record<string, GrammarLesson[]> = {};
    for (const lesson of lessons) {
      const key = lesson.level;
      if (!groups[key]) groups[key] = [];
      groups[key].push(lesson);
    }
    // Sort within each level by lessonNumber
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.lessonNumber - b.lessonNumber);
    }
    return groups;
  }, [lessons]);

  const levelOrder = ['A1', 'A2', 'B1'];
  const sortedLevelKeys = Object.keys(groupedLessons).sort(
    (a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLessons(), refetchProgress()]);
    setRefreshing(false);
  };

  // Status helpers
  const getStatusIcon = (status?: string): { name: React.ComponentProps<typeof Ionicons>['name']; color: string } => {
    switch (status) {
      case 'completed':
        return { name: 'checkmark-circle', color: colors.semantic.correct };
      case 'in_progress':
        return { name: 'time-outline', color: colors.pastel.peach.base };
      default:
        return { name: 'ellipse-outline', color: '#4B5563' };
    }
  };

  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'in_progress':
        return 'Đang học';
      default:
        return 'Chưa bắt đầu';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'A1': return colors.semantic.correct;
      case 'A2': return colors.pastel.peach.base;
      case 'B1': return colors.pastel.lavender.base;
      default: return colors.pastel.lavender.base;
    }
  };

  // ── Render ──

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <LinearGradient
          colors={[colors.pastel.lavender.base, colors.pastel.mint.base]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerIcon}
        >
          <Ionicons name="library-outline" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.flex1}>
          <Text style={styles.headerTitle}>Ngữ pháp</Text>
          <Text style={styles.headerSubtitle}>Grammatik</Text>
        </View>
      </View>

      {/* Level Filter Tabs */}
      <View style={styles.filterTabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setSelectedLevel(level)}
              style={[
                styles.filterTab,
                selectedLevel === level
                  ? styles.filterTabActive
                  : styles.filterTabInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedLevel === level
                    ? styles.filterTabTextActive
                    : styles.filterTabTextInactive,
                ]}
              >
                {level === 'all' ? 'Tất cả' : level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pastel.lavender.base}
            colors={[colors.pastel.lavender.base]}
          />
        }
      >
        {loadingLessons ? (
          <View style={styles.centeredEmpty}>
            <ActivityIndicator color={colors.pastel.lavender.base} size="large" />
            <Text style={styles.loadingText}>Đang tải bài học...</Text>
          </View>
        ) : sortedLevelKeys.length === 0 ? (
          <View style={styles.centeredEmpty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="library-outline" size={32} color={colors.pastel.lavender.base} />
            </View>
            <Text style={styles.emptyText}>Chưa có bài học nào</Text>
          </View>
        ) : (
          <View style={styles.sectionPadding}>
            {sortedLevelKeys.map((level) => {
              const levelLessons = groupedLessons[level];
              const completedCount = levelLessons.filter(
                (l) => progressMap[l.id]?.status === 'completed'
              ).length;
              const levelColor = getLevelColor(level);

              return (
                <View key={level} style={styles.levelGroup}>
                  {/* Level Header */}
                  <View style={styles.levelHeaderRow}>
                    <View style={styles.levelHeaderLeft}>
                      <View style={[styles.levelBadge, { backgroundColor: levelColor + '20' }]}>
                        <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                          {level}
                        </Text>
                      </View>
                      <Text style={styles.levelHeaderTitle}>
                        {level === 'A1' ? 'Anfänger' : level === 'A2' ? 'Grundlagen' : 'Mittelstufe'}
                      </Text>
                    </View>
                    <Text style={styles.completionText}>
                      {completedCount}/{levelLessons.length} hoàn thành
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: levelLessons.length > 0
                            ? `${(completedCount / levelLessons.length) * 100}%` as any
                            : '0%' as any,
                          backgroundColor: levelColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Lesson Cards */}
                  {levelLessons.map((lesson, index) => {
                    const lessonProgress = progressMap[lesson.id];
                    const status = lessonProgress?.status;
                    const statusInfo = getStatusIcon(status);
                    const score = lessonProgress?.score;

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          router.push(`/(tabs)/practice/grammar/${lesson.slug}` as any);
                        }}
                        style={styles.lessonCard}
                      >
                        {/* Lesson Number */}
                        <View style={[styles.lessonNumBox, { backgroundColor: levelColor + '15' }]}>
                          <Text style={[styles.lessonNumText, { color: levelColor }]}>
                            {lesson.lessonNumber}
                          </Text>
                        </View>

                        {/* Lesson Info */}
                        <View style={styles.flex1}>
                          <Text style={styles.lessonTitle} numberOfLines={1}>
                            {lesson.titleVi}
                          </Text>
                          <Text style={styles.lessonSubtitle} numberOfLines={1}>
                            {lesson.titleDe}
                          </Text>
                          <View style={styles.lessonMetaRow}>
                            <View style={styles.metaItem}>
                              <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                              <Text style={styles.metaText}>
                                {lesson.estimatedMinutes} phút
                              </Text>
                            </View>
                            {lesson.exerciseCount != null && (
                              <View style={styles.metaItem}>
                                <Ionicons name="list-outline" size={12} color={colors.text.tertiary} />
                                <Text style={styles.metaText}>
                                  {lesson.exerciseCount} bài tập
                                </Text>
                              </View>
                            )}
                            <View style={styles.metaItem}>
                              <Ionicons name={statusInfo.name} size={12} color={statusInfo.color} />
                              <Text style={[styles.metaTextColored, { color: statusInfo.color }]}>
                                {getStatusLabel(status)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Score / Arrow */}
                        <View style={styles.lessonRight}>
                          {score != null && status === 'completed' ? (
                            <View style={styles.scoreBox}>
                              <Text style={styles.scoreValue}>
                                {Math.round(score)}%
                              </Text>
                              <Text style={styles.scoreLabel}>điểm</Text>
                            </View>
                          ) : (
                            <Ionicons name="chevron-forward" size={18} color="#4B5563" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {/* Bottom spacer */}
            <View style={styles.spacer8} />
          </View>
        )}

        <View style={styles.spacer4} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.b0,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    paddingTop: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerIcon: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Filter Tabs
  filterTabsWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  filterTab: {
    marginRight: 8,
    borderRadius: radius.stone,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterTabActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  filterTabInactive: {
    backgroundColor: colors.bg.b2,
  },
  filterTabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
  },
  filterTabTextActive: {
    color: colors.pastel.lavender.base,
  },
  filterTabTextInactive: {
    color: colors.text.secondary,
  },
  // Loading / Empty
  centeredEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  emptyIconCircle: {
    marginBottom: 16,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.body,
    color: colors.text.secondary,
  },
  // Section
  sectionPadding: {
    paddingHorizontal: spacing.md,
  },
  levelGroup: {
    marginBottom: 24,
  },
  levelHeaderRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
  },
  levelHeaderTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  completionText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  // Progress Bar
  progressBarBg: {
    marginBottom: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bg.b3,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  // Lesson Card
  lessonCard: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: colors.bg.b2,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: 16,
  },
  lessonNumBox: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.stone,
  },
  lessonNumText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.heading,
  },
  lessonTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.heading,
    color: colors.text.primary,
  },
  lessonSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  lessonMetaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  metaTextColored: {
    fontSize: 10,
    fontFamily: typography.fontFamily.body,
  },
  // Score / Arrow
  lessonRight: {
    alignItems: 'flex-end',
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.bodyBold,
    color: colors.text.primary,
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.body,
    color: colors.text.tertiary,
  },
  // Spacers
  spacer8: {
    height: 32,
  },
  spacer4: {
    height: 16,
  },
});
