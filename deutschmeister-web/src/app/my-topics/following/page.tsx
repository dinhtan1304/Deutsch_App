'use client';

import Link from 'next/link';
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
  const { data, isLoading } = useFollowingTopics();
  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        hideBackIcon
        title="Bộ chủ đề đang theo dõi"
        subtitle="Các bộ chủ đề công khai bạn đã follow"
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
          title="Chưa theo dõi bộ chủ đề nào"
          description="Khám phá các bộ chủ đề từ cộng đồng và follow tác giả yêu thích."
          action={{ label: 'Khám phá ngay', href: '/community/topics' }}
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
                            Không khả dụng
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
                        <span>{topic.wordCount} từ</span>
                        <span>|</span>
                        <span>{topic.followerCount} follower</span>
                        <span>|</span>
                        <span>{topic.studyCount} đang học</span>
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
