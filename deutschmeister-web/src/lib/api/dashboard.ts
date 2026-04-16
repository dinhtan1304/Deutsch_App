import { apiGet } from './client';
import type {
  FullDashboard,
  DashboardStats,
  ActivityHeatmap,
  WeeklyProgress,
  TopicProgress,
  RecentActivity,
  PublicStats,
} from '@/types/dashboard';

const BASE_URL = '/dashboard';

/**
 * Lấy toàn bộ dữ liệu dashboard
 */
export async function getFullDashboard(): Promise<FullDashboard> {
  return apiGet<FullDashboard>(BASE_URL);
}

/**
 * Lấy thống kê tổng quan
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>(`${BASE_URL}/stats`);
}

/**
 * Lấy dữ liệu heatmap
 */
export async function getActivityHeatmap(): Promise<ActivityHeatmap> {
  return apiGet<ActivityHeatmap>(`${BASE_URL}/heatmap`);
}

/**
 * Lấy tiến độ 7 ngày qua
 */
export async function getWeeklyProgress(): Promise<WeeklyProgress[]> {
  return apiGet<WeeklyProgress[]>(`${BASE_URL}/weekly`);
}

/**
 * Lấy tiến độ theo topic
 */
export async function getTopicProgress(): Promise<TopicProgress[]> {
  return apiGet<TopicProgress[]>(`${BASE_URL}/topics`);
}

/**
 * Lấy hoạt động gần đây
 */
export async function getRecentActivity(): Promise<RecentActivity[]> {
  return apiGet<RecentActivity[]>(`${BASE_URL}/activity`);
}

/**
 * Lấy thống kê công khai (không cần login)
 */
export async function getPublicStats(): Promise<PublicStats> {
  return apiGet<PublicStats>(`${BASE_URL}/public-stats`);
}

/**
 * Lấy lộ trình học hàng ngày
 */
export const getDailyPath = () => apiGet<DailyPath>('/dashboard/daily-path');

export interface DailyTask {
  type: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

export interface DailyPath {
  tasks: DailyTask[];
  completedCount: number;
  totalCount: number;
  srsDueCount: number;
}

export interface NextAction {
  priority: 'srs_urgent' | 'srs_normal' | 'study_plan' | 'streak_risk' | 'weak_skill' | 'explore';
  title: string;
  subtitle: string;
  ctaText: string;
  href: string;
  icon: string;
  gradient: string;
  badge?: string;
}

export const getNextAction = () => apiGet<NextAction>('/dashboard/next-action');