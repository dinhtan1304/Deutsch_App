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
import { WeeklyChallengesWidget } from '@/components/dashboard/WeeklyChallengesWidget';
import { LeaderboardWidget } from '@/components/dashboard/LeaderboardWidget';
import { useFullDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { IconZap, IconBookOpen, IconGamepad, IconLightbulb } from '@/components/ui/Icons';
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

function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden p-6 rounded-2xl mb-6"
      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
      {/* Decorative orbs */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white opacity-[0.06]" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white opacity-[0.04]" />
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <IconZap size={28} className="text-white" />
        </div>
        <div className="text-white flex-1">
          <h2 className="text-xl font-bold mb-1">Chào mừng bạn đến với Deutschmeister!</h2>
          <p className="text-white/80 text-[13px]">Bắt đầu hành trình học tiếng Đức của bạn ngay hôm nay</p>
        </div>
        <Link href="/topics"
          className="px-5 py-2 rounded-xl font-bold text-[13px] shrink-0 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: 'white', color: '#2563EB' }}>
          Bắt đầu học
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const { data, isLoading } = useFullDashboard();

  // Must be before any early returns (Rules of Hooks)
  const todayLabel = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }), []);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, router]);

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
  const isNewUser = stats.gamesPlayed === 0 && stats.totalWordsLearned === 0;

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
            ) : isNewUser ? (
              'Hôm nay là ngày tuyệt vời để bắt đầu học tiếng Đức!'
            ) : (
              'Hãy tiếp tục học để duy trì streak nhé!'
            )}
          </p>
        </div>
        <div className="text-right text-[12px] hidden sm:block" style={{ color: 'var(--theme-text-muted)' }}>{todayLabel}</div>
      </div>

      {isNewUser && <WelcomeBanner />}

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

      {/* ── Getting started (new users only) ── */}
      {isNewUser && (
        <div className="p-5 rounded-2xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(245,158,11,.08))' }}>
              <IconLightbulb size={13} style={{ color: '#F59E0B' }} />
            </span>
            Gợi ý để bắt đầu
          </h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { href: '/topics', icon: IconBookOpen, color: '#3B82F6', label: 'Học theo chủ đề', sub: '12 chủ đề A1 cơ bản', gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)' },
              { href: '/games/quick-quiz', icon: IconGamepad, color: '#10B981', label: 'Chơi Quick Quiz', sub: 'Luyện tập Der/Die/Das', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
              { href: '/words', icon: IconBookOpen, color: '#8B5CF6', label: 'Khám phá từ điển', sub: 'Tra cứu từ vựng', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
            ].map(item => {
              const Ic = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="group flex items-center gap-3 p-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: `${item.color}12`, border: `1px solid ${item.color}20` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: item.gradient }}>
                    <Ic size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-[13px]" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{item.sub}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
