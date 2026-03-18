import { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { useFullDashboard, dashboardKeys } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import {
  StatsCards,
  StatsCardsSkeleton,
  WeeklyChart,
  WeeklyChartSkeleton,
  QuickActions,
  RecentActivity,
  RecentActivitySkeleton,
  TopicProgress,
  TopicProgressSkeleton,
} from '@/components/dashboard';
import type {
  DashboardStats,
  WeeklyProgress,
} from '@/types/dashboard';

// ============================================
// Helpers
// ============================================

function formatVietnameseDate(): string {
  const now = new Date();
  const dayNames = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ];
  const monthNames = [
    'tháng 1',
    'tháng 2',
    'tháng 3',
    'tháng 4',
    'tháng 5',
    'tháng 6',
    'tháng 7',
    'tháng 8',
    'tháng 9',
    'tháng 10',
    'tháng 11',
    'tháng 12',
  ];
  return `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}`;
}

function toLocalDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getEmptyStats(): DashboardStats {
  return {
    streak: 0,
    totalWordsLearned: 0,
    totalWords: 0,
    accuracy: 0,
    totalMinutes: 0,
    topicsCompleted: 0,
    totalTopics: 12,
    wordsToReview: 0,
    gamesPlayed: 0,
    startedAt: toLocalDateStr(new Date()),
    grammarCompleted: 0,
    grammarTotal: 0,
  };
}

function getEmptyWeeklyProgress(): WeeklyProgress[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      day: dayNames[date.getDay()],
      date: toLocalDateStr(date),
      wordsLearned: 0,
      gamesPlayed: 0,
      minutes: 0,
    };
  });
}

function getMotivation(streak: number): string {
  if (streak === 0) return 'Hãy bắt đầu học ngay hôm nay!';
  if (streak < 3) return 'Khởi đầu tốt, tiếp tục nhé!';
  if (streak < 7) return 'Tuyệt vời! Giữ chuỗi ngày nhé!';
  if (streak < 14) return 'Xuất sắc! Bạn đang rất giỏi!';
  if (streak < 30) return 'Siêu sao! Không gì cản được bạn!';
  return 'Huyền thoại! Bạn thật đáng ngưỡng mộ!';
}

// ============================================
// Dashboard Screen
// ============================================

export default function DashboardScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useFullDashboard();

  const stats = data?.stats ?? getEmptyStats();
  const weeklyProgress = data?.weeklyProgress ?? getEmptyWeeklyProgress();
  const topicProgress = data?.topicProgress ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const dateStr = useMemo(() => formatVietnameseDate(), []);
  const motivation = useMemo(() => getMotivation(stats.streak), [stats.streak]);
  const displayName = user?.name || 'bạn';

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    refetch();
  }, [queryClient, refetch]);

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
      >
        {/* ====== Header ====== */}
        <View className="px-4 pb-2 pt-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">
                Chào {displayName}! 👋
              </Text>
              <Text className="mt-1 text-sm text-gray-400">{dateStr}</Text>
            </View>
            {stats.streak > 0 && (
              <View className="flex-row items-center gap-1 rounded-xl bg-dark-card px-3 py-2">
                <Ionicons name="flame" size={18} color="#F97316" />
                <Text className="text-sm font-bold text-orange-400">
                  {stats.streak}
                </Text>
              </View>
            )}
          </View>

          {/* Motivation */}
          <View
            className="mt-3 flex-row items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
          >
            <Ionicons name="sparkles" size={16} color="#818CF8" />
            <Text className="flex-1 text-xs text-primary-300">
              {motivation}
            </Text>
          </View>
        </View>

        {/* ====== Stats Cards ====== */}
        <View className="mt-4">
          {isLoading ? <StatsCardsSkeleton /> : <StatsCards stats={stats} />}
        </View>

        {/* ====== Weekly Chart ====== */}
        <View className="mt-5">
          {isLoading ? (
            <WeeklyChartSkeleton />
          ) : (
            <WeeklyChart data={weeklyProgress} />
          )}
        </View>

        {/* ====== Quick Actions ====== */}
        <View className="mt-5">
          <QuickActions />
        </View>

        {/* ====== Recent Activity ====== */}
        <View className="mt-5">
          {isLoading ? (
            <RecentActivitySkeleton />
          ) : (
            <RecentActivity activities={recentActivity} />
          )}
        </View>

        {/* ====== Topic Progress ====== */}
        <View className="mb-8 mt-5">
          {isLoading ? (
            <TopicProgressSkeleton />
          ) : (
            <TopicProgress topics={topicProgress} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
