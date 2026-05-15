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
import {
  useActivityHeatmap,
  useDashboardOverview,
  useRecentActivity,
} from '@/hooks/useDashboard';
import { useXp } from '@/hooks/useXp';
import { useMilestoneCheck } from '@/hooks/useMilestones';
import { useAutoDailyBonus } from '@/hooks/useDailyBonus';
import { useAuthStore } from '@/stores/authStore';
import { AppPageShell, AuthGate, SectionHeader, StaggerList, SurfaceCard } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';
import {
  IconBook,
  IconBrain,
  IconClock,
  IconGamepad,
  IconRefresh,
  IconTarget,
} from '@/components/ui/Icons';
import Link from 'next/link';
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
    return { day: dayNames[date.getDay()]!, date: toLocalDateStr(date), wordsLearned: 0, gamesPlayed: 0, minutes: 0 };
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

function MiniAction({
  href,
  icon,
  title,
  subtitle,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <Link href={href} className="block">
      <SurfaceCard variant="interactive" className="h-full">
        <div className="flex h-full items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)' }}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {title}
            </h3>
            <p className="mt-0.5 text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {subtitle}
            </p>
            <span className="mt-3 inline-flex text-caption font-bold" style={{ color: 'var(--color-accent-brand)' }}>
              {cta} →
            </span>
          </div>
        </div>
      </SurfaceCard>
    </Link>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated, bootstrap } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [deferWidgets, setDeferWidgets] = useState(true);
  const dashboardEnabled = _hasHydrated && isAuthenticated;
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(dashboardEnabled);
  const { data: heatmap } = useActivityHeatmap(dashboardEnabled && activeTab === 'detailed');
  const { data: recentActivity } = useRecentActivity(dashboardEnabled && activeTab === 'detailed');
  const { data: xpQuery } = useXp(dashboardEnabled && !bootstrap?.xp);
  const xpInfo = bootstrap?.xp ?? xpQuery;
  useMilestoneCheck(dashboardEnabled && !!overview);
  const { bonus, dismiss } = useAutoDailyBonus(
    dashboardEnabled && !!overview && user?.onboardingCompleted !== false,
  );

  const todayLabel = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }), []);

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

  const isOverviewLoading = overviewLoading;

  if (authLoading || isOverviewLoading || !_hasHydrated) return (
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
    stats: overview?.stats ?? getEmptyStats(),
    heatmap: heatmap ?? getEmptyHeatmap(),
    weeklyProgress: overview?.weeklyProgress ?? getEmptyWeeklyProgress(),
    topicProgress: overview?.topicProgress ?? [],
    recentActivity: recentActivity ?? [],
  };

  const { stats } = dashboardData;

  return (
    <AppPageShell
      title={`Hallo, ${user?.name || 'Freund'}!`}
      subtitle={todayLabel}
      icon={<IconTarget size={22} />}
      right={(
        <div className="flex flex-wrap items-center gap-2">
          {stats.streak > 0 && <StatusPill type="streak" value={stats.streak} label="ngày" size="sm" />}
          {xpInfo && <StatusPill type="xp" value={xpInfo.xp.toLocaleString('vi-VN')} label="XP" size="sm" />}
          {xpInfo && <StatusPill type="level" value={`Lv.${xpInfo.level}`} label={xpInfo.nameVi} size="sm" />}
        </div>
      )}
    >
      <div className="space-y-6 lg:space-y-8">

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
            <SectionHeader
              title="Hôm nay nên làm gì?"
              subtitle="Một hành động chính để giữ đà học, các mục phụ nằm ngay bên dưới."
              icon={<IconBrain size={18} />}
              accent="srs"
            />
            <DashboardHero
              nextAction={overview?.nextAction}
              dailyPath={overview?.dailyPath}
              isLoading={overviewLoading}
            />

            <StaggerList className="grid gap-3 md:grid-cols-3">
              <MiniAction
                href={stats.wordsToReview > 0 ? '/review' : '/word-bank'}
                icon={<IconRefresh size={18} />}
                title={stats.wordsToReview > 0 ? `${stats.wordsToReview} từ cần ôn` : 'Sổ tay từ vựng'}
                subtitle={stats.wordsToReview > 0 ? 'Ôn nhanh để không mất nhịp SRS.' : 'Thêm từ mới hoặc xem lại từ đã lưu.'}
                cta={stats.wordsToReview > 0 ? 'Ôn ngay' : 'Mở sổ tay'}
              />
              <MiniAction
                href="/study-plan"
                icon={<IconClock size={18} />}
                title="Kế hoạch học"
                subtitle="Theo dõi lộ trình Goethe/TELC và việc cần làm trong tuần."
                cta="Xem kế hoạch"
              />
              <MiniAction
                href="/games"
                icon={<IconGamepad size={18} />}
                title="Luyện từ nhanh"
                subtitle="Chơi một phiên ngắn nếu bạn chỉ có vài phút."
                cta="Chơi 5 phút"
              />
            </StaggerList>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeeklyChart data={dashboardData.weeklyProgress} />
              <TopicProgressList data={dashboardData.topicProgress} limit={5} />
            </div>
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {deferWidgets ? (
              <div className="h-72 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ) : (
              <>
                <QuickReviewWidget />
                <StudyPlanWidget />
                <WeeklyChallengesWidget />
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <SectionHeader
              title="Tổng quan học tập"
              subtitle="Số liệu chi tiết, lịch sử hoạt động và tiến độ theo tuần."
              icon={<IconBook size={18} />}
              accent="vocab"
            />
            <StatsCards stats={dashboardData.stats} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WeeklyChart data={dashboardData.weeklyProgress} />
              <TopicProgressList data={dashboardData.topicProgress} limit={6} />
            </div>
            <ActivityHeatmap data={dashboardData.heatmap} />
            <RecentActivityFeed
              data={dashboardData.recentActivity}
              initialCount={10}
            />
          </div>

          {/* Sidebar (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {deferWidgets ? (
              <div className="h-72 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ) : (
              <>
                <QuickReviewWidget />
                <StudyPlanWidget />
                <WeeklyChallengesWidget />
              </>
            )}
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
    </AppPageShell>
  );
}
