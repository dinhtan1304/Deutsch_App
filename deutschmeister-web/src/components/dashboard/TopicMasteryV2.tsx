'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { IconArrowRight } from '@/components/ui/Icons';
import { pickField } from '@/i18n/pickLocale';
import type { TopicProgress } from '@/types/dashboard';

interface Props {
  data: TopicProgress[];
  limit?: number;
}

/** v2 topic-mastery grid: colored dot + name + percent + thin progress bar. */
export function TopicMasteryV2({ data, limit = 6 }: Props) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const topics = data.slice(0, limit);

  return (
    <section className="rounded-2xl p-5" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lead" style={{ color: 'var(--theme-text-primary)' }}>{t('topicProgress.title')}</h3>
        <Link
          href="/topics"
          className="inline-flex items-center gap-1.5 text-caption font-medium px-2.5 py-1.5 rounded-lg"
          style={{ color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}
        >
          {t('topicProgress.viewAll')}
          <IconArrowRight size={12} />
        </Link>
      </div>

      {topics.length === 0 ? (
        <p className="text-body py-6 text-center" style={{ color: 'var(--theme-text-muted)' }}>{t('topicProgress.emptyTitle')}</p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {topics.map((tp) => {
            const name = pickField(tp, 'name', locale) || tp.nameVi;
            const pct = tp.percent ?? Math.round((tp.wordsLearned / Math.max(1, tp.totalWords)) * 100);
            return (
              <Link
                key={tp.id}
                href={`/topics/${tp.slug}`}
                className="block rounded-xl p-3.5 transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tp.color || 'var(--accent)' }} />
                  <span className="text-body font-semibold truncate" style={{ color: 'var(--theme-text-primary)' }}>{name}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="mono font-bold" style={{ fontSize: 18, color: 'var(--theme-text-primary)' }}>{pct}%</span>
                  <span className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                    · {t('topicProgress.wordsCount', { learned: tp.wordsLearned, total: tp.totalWords })}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-tertiary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tp.color || 'var(--accent)' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
