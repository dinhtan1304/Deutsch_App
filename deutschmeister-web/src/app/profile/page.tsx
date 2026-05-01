'use client';

import { useAuthStore } from '@/stores/authStore';
import { AuthGate } from '@/components/ui';
import { GRADIENT, ACCENT, STATUS } from '@/lib/tokens';
import { useUserStats } from '@/hooks/useUser';
import { useXp } from '@/hooks/useXp';
import type { ActivityHeatmap as HeatmapData } from '@/types/dashboard';
import { IconUser, IconGamepad, IconTarget, IconStar, IconBrain } from '@/components/ui/Icons';
import { SkillRadar } from '@/components/profile/SkillRadar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { ErrorPatternsWidget } from '@/components/dashboard/ErrorPatternsWidget';
import { useActivityHeatmap } from '@/hooks/useDashboard';
import { ProfileStatCard } from './_components/ProfileStatCard';
import { ProfileLearningRoadmap } from './_components/ProfileLearningRoadmap';
import { ProfileHeroCard } from './_components/ProfileHeroCard';
import { ProfileAnswerStats } from './_components/ProfileAnswerStats';
import { ProfileQuickActions } from './_components/ProfileQuickActions';

const toLocalDateStr = (date: Date): string => date.toISOString().slice(0, 10);

function getEmptyHeatmap(): HeatmapData {
  const data = [];
  const today = new Date();
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    data.push({ date: toLocalDateStr(d), count: 0, level: 0 });
  }
  return { data, totalActiveDays: 0, currentStreak: 0, longestStreak: 0 };
}

export default function ProfilePage() {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: stats, isLoading } = useUserStats(isAuthenticated);
  const { data: xpInfo } = useXp();
  const { data: heatmapData } = useActivityHeatmap();

  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--theme-border)', borderTopColor: ACCENT.srs }} />
      </div>
    );
  }

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconUser size={28} className="text-white" />}
      gradient={GRADIENT.action}
      title="Đăng nhập để xem hồ sơ"
      description="Theo dõi tiến trình và thống kê học tập của bạn."
    />
  );

  const correct = stats?.correctAnswers || 0;
  const wrong = stats?.wrongAnswers || 0;
  const total = stats?.totalAnswers || 0;
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const statCards = [
    { label: 'Trò chơi', value: stats?.gamesPlayed ?? 0, color: ACCENT.srs, icon: IconGamepad },
    { label: 'Chính xác', value: `${stats?.accuracy ?? 0}%`, color: STATUS.success, icon: IconTarget },
    { label: 'Yêu thích', value: stats?.favorites ?? 0, color: ACCENT.xp, icon: IconStar },
    { label: 'Đã học', value: stats?.wordsLearned ?? 0, color: ACCENT.vocab, icon: IconBrain },
  ];

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 min-h-screen"
      style={{ backgroundColor: 'var(--theme-bg-body)', color: 'var(--theme-text-primary)', backgroundImage: 'radial-gradient(circle at 50% -20%, var(--color-accent-brand)12, transparent 70%)' }}>

      <ProfileHeroCard user={user} xpInfo={xpInfo} isLoading={isLoading} points={correct} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <ProfileStatCard key={i} label={card.label} value={isLoading ? '—' : card.value} color={card.color} icon={card.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SkillRadar />
        <ErrorPatternsWidget />
      </div>

      <div className="mb-8">
        <ActivityHeatmap data={heatmapData ?? getEmptyHeatmap()} />
      </div>

      <ProfileLearningRoadmap />

      <div className="grid md:grid-cols-2 gap-4">
        <ProfileAnswerStats
          isLoading={isLoading}
          accuracyPct={accuracyPct}
          correctAnswers={correct}
          wrongAnswers={wrong}
          totalAnswers={total}
        />
        <ProfileQuickActions />
      </div>
    </div>
  );
}
