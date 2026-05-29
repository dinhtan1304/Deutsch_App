'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { useCommunityTopics } from '@/hooks/useCommunityTopics';
import { ACCENT } from '@/lib/tokens';
import type { QueryCommunityDto, UserTopicWithOwner } from '@/types/user-topic';

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.speaking,
};

const SORT_OPTIONS: Array<{ v: NonNullable<QueryCommunityDto['sort']>; labelKey: 'sortNewest' | 'sortPopular' | 'sortMostStudied' | 'sortTrending' }> = [
  { v: 'newest', labelKey: 'sortNewest' },
  { v: 'popular', labelKey: 'sortPopular' },
  { v: 'most_studied', labelKey: 'sortMostStudied' },
  { v: 'trending', labelKey: 'sortTrending' },
];

const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2'];

export default function CommunityTopicsPage() {
  const t = useTranslations('vocabulary.community');
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState<NonNullable<QueryCommunityDto['sort']>>('newest');
  const { data, isLoading } = useCommunityTopics({
    q: q || undefined,
    level,
    sort,
  });

  const items = data?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title={t('listTitle')}
        subtitle={t('listSubtitle')}
        accent="vocab"
        right={
          <Link
            href="/my-topics/new"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: `linear-gradient(135deg, ${ACCENT.vocab}, ${ACCENT.examWriting})`, color: 'white' }}
          >
            {t('createYours')}
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
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
          {LEVELS.map((item) => (
            <button
              key={item}
              onClick={() => setLevel(item)}
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: level === item ? `${ACCENT.vocab}18` : 'var(--theme-bg-card)',
                color: level === item ? ACCENT.vocab : 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
              }}
            >
              {item === 'all' ? t('filterAll') : item}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map((item) => (
            <button
              key={item.v}
              onClick={() => setSort(item.v)}
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: sort === item.v ? `${ACCENT.brand}18` : 'var(--theme-bg-card)',
                color: sort === item.v ? ACCENT.brand : 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
              }}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-44 animate-pulse opacity-60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={null}
          title={t('listEmptyTitle')}
          description={t('listEmptyBody')}
          action={{ label: t('createNow'), href: '/my-topics/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((topic) => (
            <CommunityTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityTopicCard({ topic }: { topic: UserTopicWithOwner }) {
  const t = useTranslations('vocabulary.community');
  const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;
  const ownerName = topic.owner.name || t('anonymous');
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <Link href={`/community/topics/${topic.slug}`} className="block">
      <Card
        variant="default"
        className="hover:-translate-y-1 transition-all duration-300 h-full"
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,.05)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
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
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white inline-block mb-1"
              style={{ backgroundColor: levelColor }}
            >
              {topic.level}
            </span>
            <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
              {topic.title}
            </h3>
          </div>
        </div>

        {topic.description && (
          <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>
            {topic.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {topic.owner.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={topic.owner.avatar}
              alt={ownerName}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: ACCENT.vocab }}
            >
              {ownerInitial}
            </div>
          )}
          <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
            {ownerName}
          </span>
        </div>

        <div
          className="flex items-center gap-3 text-[11px] font-bold pt-3"
          style={{ color: 'var(--theme-text-muted)', borderTop: '1px solid var(--theme-border)' }}
        >
          <span>{t('wordCount', { count: topic.wordCount })}</span>
          <span>|</span>
          <span>{t('followerCount', { count: topic.followerCount })}</span>
          <span>|</span>
          <span>{t('studyCount', { count: topic.studyCount })}</span>
        </div>
      </Card>
    </Link>
  );
}
