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
} from '@/components/dashboard';
import { TodayFocusCard } from '@/components/dashboard/TodayFocusCard';
import { WeeklyChallengesWidget } from '@/components/dashboard/WeeklyChallengesWidget';
import { LeaderboardWidget } from '@/components/dashboard/LeaderboardWidget';
import { FirstDayJourney } from '@/components/dashboard/FirstDayJourney';
import { StudyPlanWidget } from '@/components/dashboard/StudyPlanWidget';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { DailyBonusToast } from '@/components/dashboard/DailyBonusToast';
import { StreakWarningBanner } from '@/components/dashboard/StreakWarningBanner';
import { UpsellTrigger } from '@/components/subscription/UpsellTrigger';
import { ErrorPatternsWidget } from '@/components/dashboard/ErrorPatternsWidget';
import { QuickReviewWidget } from '@/components/dashboard/QuickReviewWidget';
import { HeroActionCard } from '@/components/dashboard/HeroActionCard';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useMilestoneCheck } from '@/hooks/useMilestones';
import { useAutoDailyBonus } from '@/hooks/useDailyBonus';
import { useAuthStore } from '@/stores/authStore';
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

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { data, isLoading } = useFullDashboard();
  useMilestoneCheck();
  const { bonus, dismiss } = useAutoDailyBonus(
    _hasHydrated && isAuthenticated && user?.onboardingCompleted !== false,
  );

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
            Hallo, {user?.name || 'Freund'}!
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {stats.streak > 0 ? (
              <>Du lernst seit <span className="text-orange-500 font-bold">{stats.streak} Tagen</span> in Folge
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 -mt-0.5"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
              </>
            ) : stats.totalWordsLearned > 0 ? (
              <>Du hast <span className="text-blue-500 font-bold">{stats.totalWordsLearned} Wörter</span> gelernt. Weiter so!</>
            ) : stats.gamesPlayed === 0 ? (
              'Heute ist ein toller Tag, um Deutsch zu lernen!'
            ) : (
              'Lerne weiter, um deinen Streak zu halten!'
            )}
          </p>
        </div>
        <div className="text-right text-[12px] hidden sm:block" style={{ color: 'var(--theme-text-muted)' }}>{todayLabel}</div>
      </div>

      {/* ── Streak Warning (only shows if streak ≥3 and no activity today) ── */}
      <StreakWarningBanner />

      {/* ── Hero: Smart "Do This Next" ── */}
      <HeroActionCard />

      {/* ── Today's Focus ── */}
      <TodayFocusCard />

      {/* ── Quick Review (inline SRS, only renders when cards are due) ── */}
      <QuickReviewWidget />

      {/* ── Quick Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StudyPlanWidget />
        <FirstDayJourney />
      </div>

      {/* ── Stats ── */}
      <StatsCards stats={dashboardData.stats} />

      {/* ── Row 1: Chart (2/3) + Actions+Challenges (1/3) ── */}
      <div className="grid gap-4 items-stretch" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)' }}>
        <div className="flex flex-col gap-4 min-w-0">
          <WeeklyChart data={dashboardData.weeklyProgress} />
          <ActivityHeatmap data={dashboardData.heatmap} />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <QuickActions wordsToReview={dashboardData.stats.wordsToReview} />
          <div className="flex-1 min-h-0">
            <WeeklyChallengesWidget />
          </div>
        </div>
      </div>

      {/* ── Premium upsell — full-width highlight (hidden for Premium/beta users) ── */}
      <UpsellTrigger
        variant="card"
        source="dashboard"
        title="Đề chuẩn Goethe & TELC đang chờ bạn"
        description="Thi thử 4 kỹ năng có tính giờ · AI chấm bài Writing & Speaking · Không giới hạn lượt luyện"
        ctaLabel="Nâng cấp Premium"
      />

      {/* ── Row 2: Leaderboard + Activity + Topics + Error Patterns ── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <LeaderboardWidget />
        <RecentActivityFeed data={dashboardData.recentActivity} initialCount={3} />
        <TopicProgressList data={dashboardData.topicProgress} limit={3} />
        <ErrorPatternsWidget />
      </div>

      {/* Milestone celebration modal */}
      <CelebrationModal />

      {/* Daily login bonus toast (auto-claimed on mount) */}
      <DailyBonusToast bonus={bonus} onDismiss={dismiss} />
    </div>
  );
}
