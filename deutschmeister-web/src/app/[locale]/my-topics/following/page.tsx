'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { useFollowingTopics } from '@/hooks/useCommunityTopics';
import { ACCENT } from '@/lib/tokens';

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.speaking,
};

export default function FollowingTopicsPage() {
  const t = useTranslations('vocabulary.myTopicsFollowing');
  const { data, isLoading } = useFollowingTopics();
  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        hideBackIcon
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        accent="vocab"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-24 animate-pulse opacity-60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={null}
          title={t('emptyTitle')}
          description={t('emptyBody')}
          action={{ label: t('explore'), href: '/community/topics' }}
        />
      ) : (
        <div className="space-y-3">
          {items.map((topic) => {
            const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;
            return (
              <Link
                key={topic.id}
                href={topic.isAccessible ? `/community/topics/${topic.slug}` : '#'}
                className={topic.isAccessible ? '' : 'pointer-events-none opacity-50'}
              >
                <Card
                  variant="default"
                  className="!p-4 hover:shadow-md transition-all"
                  style={{ border: '1px solid var(--theme-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                      style={{
                        background: topic.coverColor ? `${topic.coverColor}22` : `${levelColor}18`,
                        color: topic.coverColor || levelColor,
                      }}
                    >
                      {topic.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: levelColor }}
                        >
                          {topic.level}
                        </span>
                        {!topic.isAccessible && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
                          >
                            {t('unavailable')}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                        {topic.title}
                      </h3>
                      <div
                        className="flex items-center gap-2 mt-1 text-[11px]"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        <span>{t('wordCount', { count: topic.wordCount })}</span>
                        <span>|</span>
                        <span>{t('followerCount', { count: topic.followerCount })}</span>
                        <span>|</span>
                        <span>{t('studyCount', { count: topic.studyCount })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
