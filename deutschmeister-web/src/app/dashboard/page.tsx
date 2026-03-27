'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  StatsCards,
  ActivityHeatmap,
  WeeklyChart,
  TopicProgressList,
  RecentActivityFeed,
  QuickActions,
  DailyPath,
} from '@/components/dashboard';
import { WeeklyChallengesWidget } from '@/components/dashboard/WeeklyChallengesWidget';
import { LeaderboardWidget } from '@/components/dashboard/LeaderboardWidget';
import { FirstDayJourney } from '@/components/dashboard/FirstDayJourney';
import { StudyPlanWidget } from '@/components/dashboard/StudyPlanWidget';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useMilestoneCheck } from '@/hooks/useMilestones';
import { useAuthStore } from '@/stores/authStore';
import type {
  FullDashboard,
  DashboardStats,
  ActivityHeatmap as HeatmapData,
  WeeklyProgress,
} from '@/types/dashboard';

const toLocalDateStr = (date: Date): string => date.toISOString().slice(0, 10);

const getEmptyStats = (): DashboardStats => ({
  streak: 0, totalWordsLearned: 0, totalWords: 0, accuracy: 0,
  totalMinutes: 0, topicsCompleted: 0, totalTopics: 12, wordsToReview: 0,
  gamesPlayed: 0, startedAt: toLocalDateStr(new Date()), grammarCompleted: 0, grammarTotal: 0,
});

const getEmptyHeatmap = (): HeatmapData => {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({ date: toLocalDateStr(date), count: 0, level: 0 });
  }
  return { data, totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };
};

const getEmptyWeeklyProgress = (): WeeklyProgress[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return { day: dayNames[date.getDay()], date: toLocalDateStr(date), wordsLearned: 0, gamesPlayed: 0, minutes: 0 };
  });
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { data, isLoading } = useFullDashboard();
  useMilestoneCheck();

  // Must be before any early returns (Rules of Hooks)
  const todayLabel = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }), []);

  // Redirect unauthenticated users to landing page, or to onboarding if not completed
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/');
    } else if (user?.onboardingCompleted === false) {
      router.replace('/onboarding');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (authLoading || isLoading || !_hasHydrated) return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <DashboardSkeleton />
    </div>
  );

  if (!isAuthenticated) return null;

  const dashboardData: FullDashboard = {
    stats: data?.stats ?? getEmptyStats(),
    heatmap: data?.heatmap ?? getEmptyHeatmap(),
    weeklyProgress: data?.weeklyProgress ?? getEmptyWeeklyProgress(),
    topicProgress: data?.topicProgress ?? [],
    recentActivity: data?.recentActivity ?? [],
  };

  const { stats } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Chào {user?.name || 'bạn'}! 👋
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {stats.streak > 0 ? (
              <>Bạn đã học <span className="text-orange-500 font-bold">{stats.streak} ngày</span> liên tiếp 🔥</>
            ) : stats.totalWordsLearned > 0 ? (
              <>Đã học <span className="text-blue-500 font-bold">{stats.totalWordsLearned} từ</span>. Tiếp tục nhé!</>
            ) : stats.gamesPlayed === 0 ? (
              'Hôm nay là ngày tuyệt vời để bắt đầu học tiếng Đức!'
            ) : (
              'Hãy tiếp tục học để duy trì streak nhé!'
            )}
          </p>
        </div>
        <div className="text-right text-[12px] hidden sm:block" style={{ color: 'var(--theme-text-muted)' }}>{todayLabel}</div>
      </div>

      {/* ── First Day Journey (new users) ── */}
      <FirstDayJourney />

      {/* ── Study Plan Widget ── */}
      <StudyPlanWidget />

      {/* ── Daily Learning Path ── */}
      <DailyPath />

      {/* ── Stats ── */}
      <StatsCards stats={dashboardData.stats} />

      {/* ── Row 1: Chart (2/3) + Actions+Challenges (1/3) ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)' }}>
        <div className="space-y-4 min-w-0">
          <WeeklyChart data={dashboardData.weeklyProgress} />
          <ActivityHeatmap data={dashboardData.heatmap} />
        </div>
        <div className="space-y-4 min-w-0">
          <QuickActions wordsToReview={dashboardData.stats.wordsToReview} />
          <WeeklyChallengesWidget />
        </div>
      </div>

      {/* ── Row 2: Leaderboard + Activity + Topics (3 equal cols) ── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <LeaderboardWidget />
        <RecentActivityFeed data={dashboardData.recentActivity} initialCount={3} />
        <TopicProgressList data={dashboardData.topicProgress} limit={3} />
      </div>

      {/* Milestone celebration modal */}
      <CelebrationModal />
    </div>
  );
}
