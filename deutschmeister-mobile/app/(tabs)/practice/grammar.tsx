import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGrammarLessons, useGrammarProgress } from '@/hooks/useGrammar';
import type { GrammarLesson, GrammarProgress } from '@/types/grammar';

const LEVELS = ['all', 'A1', 'A2', 'B1'] as const;

// ── Screen ──

export default function GrammarScreen() {
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
        return { name: 'checkmark-circle', color: '#22C55E' };
      case 'in_progress':
        return { name: 'time-outline', color: '#F59E0B' };
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
      case 'A1': return '#22C55E';
      case 'A2': return '#F59E0B';
      case 'B1': return '#6366F1';
      default: return '#8B5CF6';
    }
  };

  // ── Render ──

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-9 w-9 items-center justify-center rounded-xl"
        >
          <Ionicons name="library-outline" size={18} color="#FFFFFF" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Ngữ pháp</Text>
          <Text className="text-xs text-gray-400">Grammatik</Text>
        </View>
      </View>

      {/* Level Filter Tabs */}
      <View className="px-4 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setSelectedLevel(level)}
              className={`mr-2 rounded-xl px-4 py-2.5 ${
                selectedLevel === level ? '' : 'bg-dark-card'
              }`}
              style={
                selectedLevel === level
                  ? { backgroundColor: 'rgba(139,92,246,0.15)' }
                  : undefined
              }
            >
              <Text
                className={`text-xs font-bold ${
                  selectedLevel === level ? 'text-purple-400' : 'text-gray-400'
                }`}
              >
                {level === 'all' ? 'Tất cả' : level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >
        {loadingLessons ? (
          <View className="flex-1 items-center justify-center pt-20">
            <ActivityIndicator color="#8B5CF6" size="large" />
            <Text className="mt-3 text-sm text-gray-400">Đang tải bài học...</Text>
          </View>
        ) : sortedLevelKeys.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <View
              className="mb-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
            >
              <Ionicons name="library-outline" size={32} color="#8B5CF6" />
            </View>
            <Text className="text-sm text-gray-400">Chưa có bài học nào</Text>
          </View>
        ) : (
          <View className="px-4">
            {sortedLevelKeys.map((level) => {
              const levelLessons = groupedLessons[level];
              const completedCount = levelLessons.filter(
                (l) => progressMap[l.id]?.status === 'completed'
              ).length;
              const levelColor = getLevelColor(level);

              return (
                <View key={level} className="mb-6">
                  {/* Level Header */}
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="rounded-md px-2 py-0.5"
                        style={{ backgroundColor: levelColor + '20' }}
                      >
                        <Text className="text-xs font-bold" style={{ color: levelColor }}>
                          {level}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-white">
                        {level === 'A1' ? 'Anfänger' : level === 'A2' ? 'Grundlagen' : 'Mittelstufe'}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {completedCount}/{levelLessons.length} hoàn thành
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View className="mb-3 h-1.5 rounded-full bg-dark-secondary">
                    <View
                      className="h-1.5 rounded-full"
                      style={{
                        width: levelLessons.length > 0
                          ? `${(completedCount / levelLessons.length) * 100}%`
                          : '0%',
                        backgroundColor: levelColor,
                      }}
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
                          // Navigate to lesson detail (future route)
                          router.push(`/(tabs)/practice/grammar/${lesson.slug}` as any);
                        }}
                        className="mb-2 flex-row items-center rounded-2xl bg-dark-card p-4"
                      >
                        {/* Lesson Number */}
                        <View
                          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: levelColor + '15' }}
                        >
                          <Text className="text-sm font-bold" style={{ color: levelColor }}>
                            {lesson.lessonNumber}
                          </Text>
                        </View>

                        {/* Lesson Info */}
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                            {lesson.titleVi}
                          </Text>
                          <Text className="text-xs text-gray-400" numberOfLines={1}>
                            {lesson.titleDe}
                          </Text>
                          <View className="mt-1 flex-row items-center gap-3">
                            <View className="flex-row items-center gap-1">
                              <Ionicons name="time-outline" size={12} color="#6B7280" />
                              <Text className="text-[10px] text-gray-500">
                                {lesson.estimatedMinutes} phút
                              </Text>
                            </View>
                            {lesson.exerciseCount != null && (
                              <View className="flex-row items-center gap-1">
                                <Ionicons name="list-outline" size={12} color="#6B7280" />
                                <Text className="text-[10px] text-gray-500">
                                  {lesson.exerciseCount} bài tập
                                </Text>
                              </View>
                            )}
                            <View className="flex-row items-center gap-1">
                              <Ionicons name={statusInfo.name} size={12} color={statusInfo.color} />
                              <Text className="text-[10px]" style={{ color: statusInfo.color }}>
                                {getStatusLabel(status)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Score / Arrow */}
                        <View className="items-end">
                          {score != null && status === 'completed' ? (
                            <View className="items-end">
                              <Text className="text-sm font-bold text-white">
                                {Math.round(score)}%
                              </Text>
                              <Text className="text-[10px] text-gray-500">điểm</Text>
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
            <View className="h-8" />
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
