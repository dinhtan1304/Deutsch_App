'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePhonemeDrills, usePhonemeDrillStats } from '@/hooks/usePronunciationScoring';
import { STATUS } from '@/lib/tokens';

const DIFFICULTY_KEYS = {
  high:   { text: STATUS.danger,  key: 'high' as const },
  medium: { text: STATUS.warning, key: 'medium' as const },
  low:    { text: STATUS.success, key: 'low' as const },
};

function getScoreColor(score: number) {
  if (score >= 80) return STATUS.success;
  if (score >= 60) return STATUS.warning;
  return STATUS.danger;
}

export default function PhonemeDrillsPage() {
  const t = useTranslations('practice.pronunciation.drills');
  const { data: drills, isLoading } = usePhonemeDrills();
  const { data: stats } = usePhonemeDrillStats();

  const statsMap = new Map(stats?.map(s => [s.phoneme, s]) ?? []);

  return (
    <div className="max-w-360 mx-auto px-4 py-6">
      {/* Header — v2 eyebrow */}
      <header className="mb-6">
        <Link
          href="/practice-test/pronunciation"
          className="text-caption mb-1.5 inline-flex items-center gap-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {t('back')}
        </Link>
        <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
          {t('title')}
        </h1>
        <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('subtitle')}
        </p>
      </header>

      {/* Drill grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drills?.map(drill => {
            const stat = statsMap.get(drill.phoneme);
            const diff = DIFFICULTY_KEYS[drill.difficultyForVi] ?? DIFFICULTY_KEYS.medium;
            return (
              <Link
                key={drill.phoneme}
                href={`/practice-test/pronunciation/drills/${drill.phoneme}`}
                className="rounded-[13px] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm block"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
              >
                {/* Top: phoneme label + difficulty */}
                <div className="flex items-start justify-between mb-3">
                  <div className="mono text-3xl font-bold" style={{ color: 'var(--accent)', letterSpacing: '-.03em' }}>
                    {drill.label}
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-caption font-bold"
                    style={{ backgroundColor: `color-mix(in srgb, ${diff.text} 14%, transparent)`, color: diff.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: diff.text }} />
                    {t(`difficulty.${diff.key}` as 'difficulty.high')}
                  </span>
                </div>

                {/* IPA + description */}
                <div className="mono text-xs mb-1" style={{ color: 'var(--accent)' }}>
                  {drill.ipa}
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--theme-text-muted)' }}>
                  {drill.description}
                </p>

                {/* Stats or CTA */}
                {stat ? (
                  <div className="flex items-center gap-3 text-caption">
                    <span style={{ color: 'var(--theme-text-muted)' }}>
                      {t('attemptsLabel', { count: stat.count })}
                    </span>
                    <span style={{ color: getScoreColor(stat.bestScore) }}>
                      {t('bestScore', { score: stat.bestScore })}
                    </span>
                    <span style={{ color: getScoreColor(stat.avgScore) }}>
                      {t('averageScore', { score: stat.avgScore })}
                    </span>
                  </div>
                ) : (
                  <div className="text-caption font-medium" style={{ color: 'var(--accent)' }}>
                    {t('notPracticed')}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
