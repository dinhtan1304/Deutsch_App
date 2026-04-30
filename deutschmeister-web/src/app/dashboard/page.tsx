'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  StatsCards,
  WeeklyChart,
  TopicProgressList,
  ActivityHeatmap,
  RecentActivityFeed,
} from '@/components/dashboard';
import { WeeklyChallengesWidget } from '@/components/dashboard/WeeklyChallengesWidget';
import { StudyPlanWidget } from '@/components/dashboard/StudyPlanWidget';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { DailyBonusToast } from '@/components/dashboard/DailyBonusToast';
import { StreakWarningBanner } from '@/components/dashboard/StreakWarningBanner';
import { UpsellTrigger } from '@/components/subscription/UpsellTrigger';
import { QuickReviewWidget } from '@/components/dashboard/QuickReviewWidget';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { StatusPill } from '@/components/ui/StatusPill';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useXp } from '@/hooks/useXp';
import { useMilestoneCheck } from '@/hooks/useMilestones';
import { useAutoDailyBonus } from '@/hooks/useDailyBonus';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';
import { IconBook } from '@/components/ui/Icons';
import type {
  FullDashboard,
  DashboardStats,
  ActivityHeatmap as HeatmapData,
  WeeklyProgress,
} from '@/types/dashboard';

const toLocalDateStr = (date: Date): string => date.toISOString().slice(0, 10);

const getEmptyStats = (): DashboardStats => ({
  streak: 0, streakFreezesAvailable: 0, totalWordsLearned: 0, totalWords: 0, accuracy: 0,
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

type DashboardTab = 'overview' | 'detailed';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { data, isLoading } = useFullDashboard();
  const { data: xpInfo } = useXp();
  useMilestoneCheck();
  const { bonus, dismiss } = useAutoDailyBonus(
    _hasHydrated && isAuthenticated && user?.onboardingCompleted !== false,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const todayLabel = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }), []);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (isAuthenticated && user?.onboardingCompleted === false) {
      router.replace('/onboarding');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (authLoading || isLoading || !_hasHydrated) return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <DashboardSkeleton />
    </div>
  );

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconBook size={28} className="text-white" />}
      gradient={GRADIENT.brand}
      title="Đăng nhập để xem trang chính"
      description="Theo dõi streak, XP và tiến trình học tập của bạn."
    />
  );

  const dashboardData: FullDashboard = {
    stats: data?.stats ?? getEmptyStats(),
    heatmap: data?.heatmap ?? getEmptyHeatmap(),
    weeklyProgress: data?.weeklyProgress ?? getEmptyWeeklyProgress(),
    topicProgress: data?.topicProgress ?? [],
    recentActivity: data?.recentActivity ?? [],
  };

  const { stats } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 lg:space-y-8">

      {/* ═══ Sticky Header Area ═══ */}
      <div
        className="sticky top-16 z-20 -mx-4 px-4 py-3"
        style={{
          backgroundColor: 'var(--theme-bg-body)',
          borderBottom: '1px solid var(--theme-border)',
          boxShadow: 'var(--shadow-soft, 0 2px 8px rgba(0,0,0,0.06))',
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-h2 font-bold leading-tight" style={{ color: 'var(--theme-text-primary)' }}>
              Hallo, {user?.name || 'Freund'}!
            </h1>
            <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.streak > 0 && (
              <StatusPill type="streak" value={stats.streak} label="ngày" />
            )}
            {xpInfo && (
              <StatusPill type="xp" value={xpInfo.xp.toLocaleString('vi-VN')} label="XP" />
            )}
            {xpInfo && (
              <StatusPill type="level" value={`Lv.${xpInfo.level}`} label={xpInfo.nameVi} />
            )}
          </div>
        </div>
      </div>

      <StreakWarningBanner />

      {/* ═══ Tab Switcher ═══ */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        role="tablist"
        aria-label="Chế độ xem dashboard"
      >
        {([
          { id: 'overview', label: 'Tổng quan' },
          { id: 'detailed', label: 'Chi tiết' },
        ] as { id: DashboardTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-1.5 rounded-lg text-body font-semibold transition-all duration-200"
            style={
              activeTab === tab.id
                ? {
                    backgroundColor: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }
                : { color: 'var(--theme-text-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Content ═══ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <DashboardHero />

            <div className="space-y-4">
              <h2 className="text-h4 font-bold px-1" style={{ color: 'var(--theme-text-primary)' }}>
                Tổng quan học tập
              </h2>
              <StatsCards stats={dashboardData.stats} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeeklyChart data={dashboardData.weeklyProgress} />
              <TopicProgressList data={dashboardData.topicProgress} limit={5} />
            </div>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <QuickReviewWidget />
            <StudyPlanWidget />
            <WeeklyChallengesWidget />
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <ActivityHeatmap data={dashboardData.heatmap} />
            <RecentActivityFeed
              data={dashboardData.recentActivity}
              initialCount={10}
            />
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <QuickReviewWidget />
            <StudyPlanWidget />
            <WeeklyChallengesWidget />
          </div>
        </div>
      )}

      {/* ═══ Premium Upsell — bottom of page, non-interruptive ═══ */}
      <UpsellTrigger
        variant="card"
        source="dashboard"
        title="Đề chuẩn Goethe & TELC đang chờ bạn"
        description="Thi thử 4 kỹ năng có tính giờ · AI chấm bài Writing & Speaking · Không giới hạn lượt luyện"
        ctaLabel="Nâng cấp Premium"
      />

      <CelebrationModal />
      <DailyBonusToast bonus={bonus} onDismiss={dismiss} />
    </div>
  );
}
