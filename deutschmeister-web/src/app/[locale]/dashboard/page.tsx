'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { WeeklyChallengesWidget } from '@/components/dashboard/WeeklyChallengesWidget';
import { StudyPlanWidget } from '@/components/dashboard/StudyPlanWidget';
import { QuickReviewWidget } from '@/components/dashboard/QuickReviewWidget';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { DailyBonusToast } from '@/components/dashboard/DailyBonusToast';
import { StreakWarningBanner } from '@/components/dashboard/StreakWarningBanner';
import { UpsellTrigger } from '@/components/subscription/UpsellTrigger';
import { ReferralInviteCard } from '@/components/referral/ReferralInviteCard';
import { DashboardGreetingV2 } from '@/components/dashboard/DashboardGreetingV2';
import { PrimarySessionV2 } from '@/components/dashboard/PrimarySessionV2';
import { ProgressChartV2 } from '@/components/dashboard/ProgressChartV2';
import { TopicMasteryV2 } from '@/components/dashboard/TopicMasteryV2';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import {
  useActivityHeatmap,
  useDashboardOverview,
  useRecentActivity,
} from '@/hooks/useDashboard';
import { useXp } from '@/hooks/useXp';
import { useMilestoneCheck } from '@/hooks/useMilestones';
import { useAutoDailyBonus } from '@/hooks/useDailyBonus';
import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';
import { IconBook } from '@/components/ui/Icons';
import type { DashboardStats, WeeklyProgress } from '@/types/dashboard';

const toLocalDateStr = (date: Date): string => date.toISOString().slice(0, 10);

const getEmptyStats = (): DashboardStats => ({
  streak: 0, streakFreezesAvailable: 0, totalWordsLearned: 0, totalWords: 0, accuracy: 0,
  totalMinutes: 0, topicsCompleted: 0, totalTopics: 12, wordsToReview: 0,
  gamesPlayed: 0, startedAt: toLocalDateStr(new Date()), grammarCompleted: 0, grammarTotal: 0,
});

const getEmptyWeeklyProgress = (): WeeklyProgress[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return { day: dayNames[date.getDay()]!, date: toLocalDateStr(date), wordsLearned: 0, gamesPlayed: 0, minutes: 0 };
  });
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="h-40 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="lg:col-span-4 h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated, bootstrap } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [deferWidgets, setDeferWidgets] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  const dashboardEnabled = _hasHydrated && isAuthenticated;
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(dashboardEnabled);
  const { data: heatmap } = useActivityHeatmap(dashboardEnabled);
  const { data: recentActivity } = useRecentActivity(dashboardEnabled && activeTab === 'detailed');
  const { data: xpQuery } = useXp(dashboardEnabled && !bootstrap?.xp);
  const xpInfo = bootstrap?.xp ?? xpQuery;
  useMilestoneCheck(dashboardEnabled && !!overview);
  const { bonus, dismiss } = useAutoDailyBonus(
    dashboardEnabled && !!overview && user?.onboardingCompleted !== false,
  );

  const formatter = useFormatter();
  const todayLabel = useMemo(
    () => formatter.dateTime(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    [formatter],
  );

  useEffect(() => {
    if (!_hasHydrated) return;
    if (isAuthenticated && user?.onboardingCompleted === false) {
      router.replace('/onboarding');
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!overview) return;
    const scheduleIdle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) => window.setTimeout(cb, 1200);
    const cancelIdle =
      typeof window !== 'undefined' && 'cancelIdleCallback' in window
        ? window.cancelIdleCallback
        : (id: number) => window.clearTimeout(id);
    const id = scheduleIdle(() => setDeferWidgets(false));
    return () => cancelIdle(id as number);
  }, [overview]);

  if (authLoading || overviewLoading || !_hasHydrated) {
    return (
      <div className="max-w-360 mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        icon={<IconBook size={28} className="text-white" />}
        gradient={GRADIENT.brand}
        title={t('authGate.title')}
        description={t('authGate.description')}
      />
    );
  }

  const stats = overview?.stats ?? getEmptyStats();
  const weeklyProgress = overview?.weeklyProgress ?? getEmptyWeeklyProgress();
  const topicProgress = overview?.topicProgress ?? [];

  return (
    <div className="max-w-360 mx-auto flex flex-col gap-6">
      <DashboardGreetingV2
        name={user?.name || 'Freund'}
        dateLabel={todayLabel}
        xpInfo={xpInfo}
        streak={stats.streak}
      />

      <StreakWarningBanner />

      {/* View toggle — overview vs detailed stats */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
        role="tablist"
        aria-label={t('viewMode.ariaLabel')}
      >
        {(['overview', 'detailed'] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-md text-body font-semibold transition-colors"
              style={active
                ? { background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }
                : { background: 'transparent', color: 'var(--theme-text-muted)', border: '1px solid transparent' }}
            >
              {t(`viewMode.${tab}` as 'viewMode.overview')}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'overview' ? (
            <PrimarySessionV2 nextAction={overview?.nextAction} dailyPath={overview?.dailyPath} />
          ) : (
            <StatsCards stats={stats} />
          )}
          <ProgressChartV2 data={weeklyProgress} streak={stats.streak} bestStreak={heatmap?.longestStreak} />
          <TopicMasteryV2 data={topicProgress} />
          {activeTab === 'detailed' && (
            <>
              {heatmap && <ActivityHeatmap data={heatmap} />}
              <RecentActivityFeed data={recentActivity ?? []} initialCount={8} />
            </>
          )}
        </div>

        {/* Right rail — sticky on desktop so the review/challenge cards stay in view */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20 self-start">
          {deferWidgets ? (
            <div className="h-72 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ) : (
            <>
              <QuickReviewWidget />
              <StudyPlanWidget />
              <WeeklyChallengesWidget />
              <ReferralInviteCard />
            </>
          )}
        </div>
      </div>

      <UpsellTrigger
        variant="card"
        source="dashboard"
        title={t('upsell.title')}
        description={t('upsell.description')}
        ctaLabel={t('upsell.ctaLabel')}
      />

      <CelebrationModal />
      <DailyBonusToast bonus={bonus} onDismiss={dismiss} />
    </div>
  );
}
