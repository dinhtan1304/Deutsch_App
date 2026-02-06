'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  StatsCards,
  ActivityHeatmap,
  WeeklyChart,
  TopicProgressList,
  RecentActivityFeed,
  QuickActions,
} from '@/components/dashboard';
import { useFullDashboard, usePublicStats } from '@/hooks/useDashboard';
import { useTopics } from '@/hooks/useTopics';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import type { FullDashboard, DashboardStats, ActivityHeatmap as HeatmapData, WeeklyProgress, TopicProgress } from '@/types/dashboard';

// ============================================
// Helper to get progress from localStorage
// ============================================
function getLocalTopicProgress(topicId: string, totalWords: number): { wordsLearned: number; percent: number } {
  try {
    const stored = localStorage.getItem(`topic-learned-${topicId}`);
    if (stored) {
      const learnedIds = JSON.parse(stored);
      const wordsLearned = Array.isArray(learnedIds) ? learnedIds.length : 0;
      const percent = totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0;
      return { wordsLearned, percent };
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  return { wordsLearned: 0, percent: 0 };
}

// ============================================
// Helper: timezone-safe date string
// ============================================
const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ============================================
// Default/Empty Data
// ============================================
const getEmptyStats = (): DashboardStats => ({
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
});

const getEmptyHeatmap = (): HeatmapData => {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: toLocalDateStr(date),
      count: 0,
      level: 0,
    });
  }
  return {
    data,
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  };
};

const getEmptyWeeklyProgress = (): WeeklyProgress[] => {
  const days: WeeklyProgress[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      day: dayNames[date.getDay()],
      date: toLocalDateStr(date),
      wordsLearned: 0,
      gamesPlayed: 0,
      minutes: 0,
    });
  }
  return days;
};

// ============================================
// Loading Skeleton
// ============================================
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
          />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
      </div>
    </div>
  );
}

// ============================================
// Guest Landing Page
// ============================================
function GuestLanding() {
  const { data: publicStats } = usePublicStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🇩🇪</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
          Deutschmeister
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
          Học tiếng Đức hiệu quả với phương pháp khoa học.
          <br />
          Der, Die, Das - không còn là vấn đề!
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/register" className="px-8 py-3 rounded-xl font-bold text-white bg-linear-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:scale-105 transition-all">
            Bắt đầu miễn phí
          </Link>
          <Link href="/auth/login" className="px-8 py-3 rounded-xl font-bold border-2 border-gray-300 hover:border-blue-500 transition-colors" style={{ color: 'var(--theme-text-primary)' }}>
            Đăng nhập
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="text-4xl font-bold text-blue-600 mb-2">{publicStats?.totalWords || 140}+</div>
          <div className="text-gray-500">Từ vựng</div>
        </div>
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <div className="text-4xl font-bold text-green-600 mb-2">{publicStats?.totalTopics || 12}</div>
          <div className="text-gray-500">Chủ đề A1</div>
        </div>
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
          <div className="text-4xl font-bold text-purple-600 mb-2">4+</div>
          <div className="text-gray-500">Mini Games</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: '🎮', title: 'Học qua Game', desc: 'Quiz, Flashcards, Timed Challenge' },
          { icon: '🧠', title: 'Spaced Repetition', desc: 'Thuật toán SM-2 giúp nhớ lâu' },
          { icon: '📚', title: '12 Chủ đề A1', desc: 'Theo chuẩn Goethe-Zertifikat' },
          { icon: '🇻🇳', title: 'Song ngữ Việt-Đức', desc: 'Giải thích dễ hiểu' },
        ].map((feature, i) => (
          <div key={i} className="p-6 rounded-2xl border text-center" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--theme-text-primary)' }}>{feature.title}</h3>
            <p className="text-sm text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Welcome Banner for New Users
// ============================================
function WelcomeBanner() {
  return (
    <div className="p-6 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}>
      <div className="flex items-center gap-4">
        <div className="text-5xl">🎉</div>
        <div className="text-white flex-1">
          <h2 className="text-xl font-bold mb-1">Chào mừng bạn đến với Deutschmeister!</h2>
          <p className="text-white/80">Bắt đầu hành trình học tiếng Đức của bạn ngay hôm nay</p>
        </div>
        <Link href="/topics" className="px-6 py-2 rounded-xl bg-white text-blue-600 font-bold hover:bg-gray-100 transition-colors">
          Bắt đầu học
        </Link>
      </div>
    </div>
  );
}

// ============================================
// Authenticated Dashboard
// ============================================
function AuthenticatedDashboard() {
  const { data, isLoading, error } = useFullDashboard();
  const { data: topicsData } = useTopics({ level: 'A1', isActive: true });
  const { user } = useAuthStore();
  
  const [localTopicProgress, setLocalTopicProgress] = useState<TopicProgress[]>([]);
  const [localStats, setLocalStats] = useState<{ wordsLearned: number; topicsCompleted: number }>({ wordsLearned: 0, topicsCompleted: 0 });

  // Load progress from localStorage when topics are available
  useEffect(() => {
    if (topicsData?.data) {
      let totalLearned = 0;
      let completed = 0;
      
      const progressList: TopicProgress[] = topicsData.data.map((topic) => {
        const { wordsLearned, percent } = getLocalTopicProgress(topic.id, topic.wordCount);
        totalLearned += wordsLearned;
        if (percent >= 100) completed++;
        
        return {
          id: topic.id,
          slug: topic.slug,
          nameDe: topic.nameDe,
          nameVi: topic.nameVi,
          icon: topic.icon || '📚',
          color: topic.color || '#3B82F6',
          wordsLearned,
          totalWords: topic.wordCount,
          percent,
        };
      });
      
      setLocalTopicProgress(progressList);
      setLocalStats({ wordsLearned: totalLearned, topicsCompleted: completed });
    }
  }, [topicsData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Merge server data with localStorage data
  const serverStats = data?.stats || getEmptyStats();
  const mergedStats: DashboardStats = {
    ...serverStats,
    // Use localStorage data if server shows 0
    totalWordsLearned: serverStats.totalWordsLearned > 0 ? serverStats.totalWordsLearned : localStats.wordsLearned,
    topicsCompleted: serverStats.topicsCompleted > 0 ? serverStats.topicsCompleted : localStats.topicsCompleted,
    totalWords: serverStats.totalWords || topicsData?.data.reduce((sum, t) => sum + t.wordCount, 0) || 0,
    totalTopics: serverStats.totalTopics || topicsData?.data.length || 12,
  };

  // Use localStorage topic progress if server returns empty
  const topicProgress = (data?.topicProgress && data.topicProgress.some(t => t.wordsLearned > 0))
    ? data.topicProgress
    : localTopicProgress;

  const dashboardData: FullDashboard = {
    stats: mergedStats,
    heatmap: data?.heatmap || getEmptyHeatmap(),
    weeklyProgress: data?.weeklyProgress || getEmptyWeeklyProgress(),
    topicProgress,
    recentActivity: data?.recentActivity || [],
  };

  const isNewUser = dashboardData.stats.gamesPlayed === 0 && 
                    dashboardData.stats.totalWordsLearned === 0 &&
                    localStats.wordsLearned === 0;

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Chào {user?.name || 'bạn'}! 👋
          </h1>
          <p className="text-gray-500">
            {dashboardData.stats.streak > 0 ? (
              <>Tuyệt vời! Bạn đã học <span className="text-orange-500 font-bold">{dashboardData.stats.streak} ngày</span> liên tiếp 🔥</>
            ) : localStats.wordsLearned > 0 ? (
              <>Bạn đã học <span className="text-blue-500 font-bold">{localStats.wordsLearned} từ</span>. Tiếp tục nhé!</>
            ) : isNewUser ? (
              'Hôm nay là ngày tuyệt vời để bắt đầu học tiếng Đức!'
            ) : (
              'Hãy tiếp tục học để duy trì streak nhé!'
            )}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Welcome banner for new users */}
      {isNewUser && <WelcomeBanner />}

      {/* Stats Cards */}
      <StatsCards stats={dashboardData.stats} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyChart data={dashboardData.weeklyProgress} />
          <ActivityHeatmap data={dashboardData.heatmap} />
        </div>
        <div className="space-y-6">
          <QuickActions wordsToReview={dashboardData.stats.wordsToReview} />
          <RecentActivityFeed data={dashboardData.recentActivity} />
        </div>
      </div>

      {/* Topic Progress */}
      <TopicProgressList data={dashboardData.topicProgress} />

      {/* Getting Started Tips for New Users */}
      {isNewUser && (
        <div className="p-6 rounded-2xl border" style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-text-primary)' }}>
            💡 Gợi ý để bắt đầu
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/topics" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <div className="text-2xl mb-2">📚</div>
              <div className="font-medium text-blue-600">Học theo chủ đề</div>
              <div className="text-sm text-gray-500">12 chủ đề A1 cơ bản</div>
            </Link>
            <Link href="/games/quick-quiz" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <div className="text-2xl mb-2">🎮</div>
              <div className="font-medium text-green-600">Chơi Quick Quiz</div>
              <div className="text-sm text-gray-500">Luyện tập Der/Die/Das</div>
            </Link>
            <Link href="/dictionary" className="p-4 rounded-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <div className="text-2xl mb-2">📖</div>
              <div className="font-medium text-purple-600">Khám phá từ điển</div>
              <div className="text-sm text-gray-500">Tra cứu từ vựng</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Home Page
// ============================================
export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {authLoading ? (
          <DashboardSkeleton />
        ) : isAuthenticated ? (
          <AuthenticatedDashboard />
        ) : (
          <GuestLanding />
        )}
      </div>
    </MainLayout>
  );
}