'use client';

import { useTranslations, useFormatter } from 'next-intl';
import type { DashboardStats } from '@/types/dashboard';
import {
  IconFlame, IconBookOpen, IconTarget,
  IconClock, IconLayers, IconBrain, IconGraduationCap,
} from '@/components/ui/Icons';
import { ACCENT, type AccentKey } from '@/lib/tokens';

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cardConfigs.map((card) => {
        const Icon = card.icon;
        const value = card.getValue(stats);
        const sub = subFor(card.id);
        const label = labelFor(card.id);
        const color = ACCENT[card.accent];
        const isStreakCard = card.id === 'streak';

        return (
          <div
            key={card.id}
            className="rounded-2xl p-4"
            style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}
          >
            <div className="flex items-center justify-between mb-2.5">
              {/* Accent-tinted icon tile */}
              <span
                className="w-9 h-9 rounded-md inline-flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
              >
                <Icon size={18} />
              </span>

              {/* Streak freeze badge — only on streak card */}
              {isStreakCard && stats.streakFreezesAvailable > 0 && (
                <span
                  className="text-caption font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                  title={t('streakFreezeTitle', { count: stats.streakFreezesAvailable })}
                >
                  ❄️ {stats.streakFreezesAvailable}
                </span>
              )}
            </div>

            {/* Value */}
            <div className="mono font-bold" style={{ fontSize: 24, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {value}
            </div>

            {/* Label */}
            <div className="text-body font-medium mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
              {label}
            </div>

            {/* Sub value */}
            <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
