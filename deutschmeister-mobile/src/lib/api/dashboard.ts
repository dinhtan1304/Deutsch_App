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

export async function getFullDashboard(): Promise<FullDashboard> {
  return apiGet<FullDashboard>(BASE_URL);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>(`${BASE_URL}/stats`);
}

export async function getActivityHeatmap(): Promise<ActivityHeatmap> {
  return apiGet<ActivityHeatmap>(`${BASE_URL}/heatmap`);
}

export async function getWeeklyProgress(): Promise<WeeklyProgress[]> {
  return apiGet<WeeklyProgress[]>(`${BASE_URL}/weekly`);
}

export async function getTopicProgress(): Promise<TopicProgress[]> {
  return apiGet<TopicProgress[]>(`${BASE_URL}/topics`);
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  return apiGet<RecentActivity[]>(`${BASE_URL}/activity`);
}

export async function getPublicStats(): Promise<PublicStats> {
  return apiGet<PublicStats>(`${BASE_URL}/public-stats`);
}
