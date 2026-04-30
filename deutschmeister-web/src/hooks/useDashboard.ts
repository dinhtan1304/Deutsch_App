import { useQuery } from '@tanstack/react-query';
import {
  getFullDashboard,
  getDashboardStats,
  getActivityHeatmap,
  getWeeklyProgress,
  getTopicProgress,
  getRecentActivity,
  getPublicStats,
  getDailyPath,
  getNextAction,
} from '@/lib/api/dashboard';

// ============================================
// Query Keys
// ============================================
export const dashboardKeys = {
  all: ['dashboard'] as const,
  full: () => [...dashboardKeys.all, 'full'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  heatmap: () => [...dashboardKeys.all, 'heatmap'] as const,
  weekly: () => [...dashboardKeys.all, 'weekly'] as const,
  topics: () => [...dashboardKeys.all, 'topics'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  public: () => [...dashboardKeys.all, 'public'] as const,
  dailyPath: () => [...dashboardKeys.all, 'daily-path'] as const,
  nextAction: () => [...dashboardKeys.all, 'next-action'] as const,
};

// ============================================
// Hooks
// ============================================

/**
 * Hook lấy toàn bộ dashboard data
 */
export function useFullDashboard() {
  return useQuery({
    queryKey: dashboardKeys.full(),
    queryFn: getFullDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook lấy stats — streak/totalWords are daily metrics, 10min staleTime is appropriate.
 * Header uses this just for streak display; mutations invalidate when needed.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook lấy heatmap
 */
export function useActivityHeatmap() {
  return useQuery({
    queryKey: dashboardKeys.heatmap(),
    queryFn: getActivityHeatmap,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook lấy weekly progress
 */
export function useWeeklyProgress() {
  return useQuery({
    queryKey: dashboardKeys.weekly(),
    queryFn: getWeeklyProgress,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook lấy topic progress
 */
export function useTopicProgress() {
  return useQuery({
    queryKey: dashboardKeys.topics(),
    queryFn: getTopicProgress,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook lấy recent activity
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: getRecentActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook lấy public stats
 */
export function usePublicStats() {
  return useQuery({
    queryKey: dashboardKeys.public(),
    queryFn: getPublicStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook lấy daily learning path
 */
export function useDailyPath() {
  return useQuery({
    queryKey: dashboardKeys.dailyPath(),
    queryFn: getDailyPath,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook lấy smart next-action recommendation for hero card
 */
export function useNextAction() {
  return useQuery({
    queryKey: dashboardKeys.nextAction(),
    queryFn: getNextAction,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}