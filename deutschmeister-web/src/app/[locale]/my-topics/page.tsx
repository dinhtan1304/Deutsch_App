'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { useMyTopics } from '@/hooks/useUserTopics';
import { CapacityBanner } from '@/components/subscription/CapacityBanner';
import { getTopicCapacity } from '@/lib/api/user-topics';
import { useAuthStore } from '@/stores/authStore';
import { ACCENT } from '@/lib/tokens';
import type { UserTopic, UserTopicVisibility } from '@/types/user-topic';

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.speaking,
};

const VISIBILITY_COLOR: Record<UserTopicVisibility, string> = {
  PRIVATE: ACCENT.gray,
  UNLISTED: ACCENT.cyan,
  PUBLIC: ACCENT.reading,
};

const VISIBILITY_LABEL_KEY: Record<UserTopicVisibility, 'visPrivate' | 'visUnlisted' | 'visPublic'> = {
  PRIVATE: 'visPrivate',
  UNLISTED: 'visUnlisted',
  PUBLIC: 'visPublic',
};

export default function MyTopicsPage() {
  const t = useTranslations('vocabulary.myTopics');
  const { isAuthenticated } = useAuthStore();
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState<'all' | UserTopicVisibility>('all');
  const { data, isLoading } = useMyTopics({ q: q || undefined, visibility, sort: 'updated' });
  const { data: capacity } = useQuery({
    queryKey: ['my-topics-capacity'],
    queryFn: () => getTopicCapacity(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const items = data?.items ?? [];

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        accent="vocab"
        right={
          <Link href="/my-topics/new">
            <Button variant="game" accent="vocab" size="lg">{t('createTopic')}</Button>
          </Link>
        }
      />

      {capacity && !capacity.isPaid && (
        <CapacityBanner
          used={capacity.used}
          limit={capacity.limit}
          isPaid={capacity.isPaid}
          label={t('capacityLabel')}
          featureContext="my-topics-capacity"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'PRIVATE', 'UNLISTED', 'PUBLIC'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className="px-2.5 py-1 rounded-[7px] text-caption font-semibold uppercase tracking-wide transition-colors"
              style={visibility === v
                ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
                : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}
            >
              {v === 'all' ? t('filterAll') : t(VISIBILITY_LABEL_KEY[v])}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} variant="default" className="h-32 animate-pulse opacity-60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={null}
          title={t('emptyTitle')}
          description={t('emptyBody')}
          action={{ label: t('createFirst'), href: '/my-topics/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((topic) => (
            <MyTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyTopicCard({ topic }: { topic: UserTopic }) {
  const t = useTranslations('vocabulary.myTopics');
  const visColor = VISIBILITY_COLOR[topic.visibility];
  const visLabel = t(VISIBILITY_LABEL_KEY[topic.visibility]);
  const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;

  return (
    <Link href={`/my-topics/${topic.id}`} className="block">
      <Card
        variant="default"
        className="hover:-translate-y-0.5 transition-transform duration-200"
        style={{ border: '1px solid var(--theme-border)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: topic.coverColor
                ? `${topic.coverColor}22`
                : `${levelColor}18`,
              color: topic.coverColor || levelColor,
            }}
          >
            {topic.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: levelColor }}
              >
                {topic.level}
              </span>
              <span
                className="text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${visColor}18`, color: visColor }}
              >
                {visLabel}
              </span>
            </div>
            <h3
              className="text-base font-bold truncate"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {topic.title}
            </h3>
            {topic.description && (
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                {topic.description}
              </p>
            )}
            <div
              className="flex items-center gap-3 mt-2 text-[11px] font-medium"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <span>{t('setCount', { count: topic.setCount })}</span>
              <span>|</span>
              <span>{t('wordCount', { count: topic.wordCount })}</span>
              {topic.visibility !== 'PRIVATE' && (
                <>
                  <span>|</span>
                  <span>{t('followerCount', { count: topic.followerCount })}</span>
                  <span>|</span>
                  <span>{t('studyCount', { count: topic.studyCount })}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
