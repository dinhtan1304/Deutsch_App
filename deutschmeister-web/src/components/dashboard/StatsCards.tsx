'use client';

import { useTranslations, useFormatter } from 'next-intl';
import type { DashboardStats } from '@/types/dashboard';
import {
  IconFlame, IconBookOpen, IconTarget,
  IconClock, IconLayers, IconBrain, IconGraduationCap,
} from '@/components/ui/Icons';
import { SurfaceCard } from '@/components/ui';
import { ACCENT, GRADIENT, type AccentKey } from '@/lib/tokens';

interface StatsCardsProps {
  stats: DashboardStats;
}

// Stable id per card — used for grid-span logic and label lookup. Decouples
// the rendered label (locale-dependent) from the structural identity.
type CardId = 'streak' | 'wordsLearned' | 'accuracy' | 'studyTime' | 'topicsDone' | 'grammar' | 'needsReview';

interface StatCardConfig {
  id: CardId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  getValue: (s: DashboardStats) => string | number;
  accent: AccentKey;
}

// Order is intentional (matches the previous 7-card layout). Labels resolved
// per-locale in StatsCards via useTranslations('dashboard.stats').
const cardConfigs: StatCardConfig[] = [
  {
    id: 'streak',
    icon: IconFlame,
    getValue: s => s.streak,
    accent: 'games',
  },
  {
    id: 'wordsLearned',
    icon: IconBookOpen,
    getValue: s => s.totalWordsLearned,
    accent: 'srs',
  },
  {
    id: 'accuracy',
    icon: IconTarget,
    getValue: s => `${s.accuracy}%`,
    accent: 'emerald',
  },
  {
    id: 'studyTime',
    icon: IconClock,
    getValue: s => {
      if (s.totalMinutes < 60) return `${s.totalMinutes}m`;
      const h = Math.floor(s.totalMinutes / 60);
      const m = s.totalMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    },
    accent: 'vocab',
  },
  {
    id: 'topicsDone',
    icon: IconLayers,
    getValue: s => s.topicsCompleted,
    accent: 'listening',
  },
  {
    id: 'grammar',
    icon: IconGraduationCap,
    getValue: s => s.grammarCompleted ?? 0,
    accent: 'xp',
  },
  {
    id: 'needsReview',
    icon: IconBrain,
    getValue: s => s.wordsToReview,
    accent: 'cyan',
  },
];

const statGradient: Partial<Record<AccentKey, string>> = {
  brand: GRADIENT.brand,
  games: GRADIENT.xp,
  srs: GRADIENT.action,
  emerald: GRADIENT.emerald,
  vocab: GRADIENT.vocab,
  listening: GRADIENT.listening,
  xp: GRADIENT.xp,
  cyan: GRADIENT.dictation,
};

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('dashboard.stats');
  const formatter = useFormatter();

  // Resolve per-card label + sub-label from id. Kept in one place so the
  // config above stays focused on data shape, not copy.
  const labelFor = (id: CardId): string => {
    switch (id) {
      case 'streak': return t('streak');
      case 'wordsLearned': return t('wordsLearned');
      case 'accuracy': return t('accuracy');
      case 'studyTime': return t('studyTime');
      case 'topicsDone': return t('topicsDone');
      case 'grammar': return t('grammar');
      case 'needsReview': return t('needsReview');
    }
  };
  const subFor = (id: CardId): string => {
    switch (id) {
      case 'streak': return stats.streak > 0 ? t('streakActive') : t('streakStart');
      case 'wordsLearned': return t('wordsLearnedUnit', { total: stats.totalWords });
      case 'accuracy': return t('accuracyGames', { count: stats.gamesPlayed });
      case 'studyTime': {
        const parts = stats.startedAt.split('-').map(Number);
        const date = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
        return t('studyTimeSince', { date: formatter.dateTime(date, { dateStyle: 'medium' }) });
      }
      case 'topicsDone': return t('topicsDoneUnit', { total: stats.totalTopics });
      case 'grammar': return t('grammarUnit', { total: stats.grammarTotal ?? 0 });
      case 'needsReview': return stats.wordsToReview > 0 ? t('needsReviewActive') : t('needsReviewEmpty');
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cardConfigs.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const sub = subFor(card.id);
        const label = labelFor(card.id);
        const isStreakCard = card.id === 'streak';
        const isReviewCard = card.id === 'needsReview';

        // Balance the 7-item grid:
        // md & xl (4 cols): Streak takes 2 cols, others 1 col (2+1+1 + 1+1+1+1 = 8 slots = 2 rows)
        // sm & lg (3 cols): Review takes 3 cols, others 1 col (1+1+1 + 1+1+1 + 3 = 9 slots = 3 rows)
        // mobile (2 cols): Review takes 2 cols
        const colSpanClass = isStreakCard
          ? 'col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2'
          : isReviewCard
            ? 'col-span-2 sm:col-span-3 md:col-span-1 lg:col-span-3 xl:col-span-1'
            : 'col-span-1';

        return (
          <SurfaceCard
            key={card.id}
            variant="featured"
            accent={card.accent}
            className={`relative overflow-hidden cursor-default ${colSpanClass}`}
          >
            {/* Streak freeze badge — only on streak card */}
            {isStreakCard && stats.streakFreezesAvailable > 0 && (
              <div
                className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black z-10 shadow-sm"
                style={{
                  background: 'rgba(59,130,246,.15)',
                  color: ACCENT.srs,
                  border: '1px solid rgba(59,130,246,.3)',
                  backdropFilter: 'blur(4px)'
                }}
                title={t('streakFreezeTitle', { count: stats.streakFreezesAvailable })}
              >
                ❄️ {stats.streakFreezesAvailable}
              </div>
            )}

            {/* Decorative orb */}
            <div
              className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.05]"
              style={{ backgroundColor: ACCENT[card.accent] }}
            />

            {/* Icon container with gradient */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
              style={{ background: statGradient[card.accent] ?? GRADIENT.brand }}
            >
              <Icon size={20} className="text-white" />
            </div>

            {/* Value */}
            <div className="text-2xl font-extrabold tracking-tight mb-0.5" style={{ color: ACCENT[card.accent] }}>
              {value}
            </div>

            {/* Label */}
            <div className="text-body font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              {label}
            </div>

            {/* Sub value */}
            <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {sub}
            </div>
          </SurfaceCard>
        );
      })}
    </div>
  );
}
