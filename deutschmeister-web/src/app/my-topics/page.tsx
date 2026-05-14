'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import { useMyTopics } from '@/hooks/useUserTopics';
import { ACCENT } from '@/lib/tokens';
import type { UserTopic, UserTopicVisibility } from '@/types/user-topic';

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.speaking,
};

const VISIBILITY_LABEL: Record<UserTopicVisibility, { label: string; color: string }> = {
  PRIVATE: { label: 'Riêng tư', color: ACCENT.gray },
  UNLISTED: { label: 'Có link', color: ACCENT.cyan },
  PUBLIC: { label: 'Công khai', color: ACCENT.reading },
};

export default function MyTopicsPage() {
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState<'all' | UserTopicVisibility>('all');
  const { data, isLoading } = useMyTopics({ q: q || undefined, visibility, sort: 'updated' });

  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Bộ chủ đề của tôi"
        subtitle="Tạo và quản lý bộ thẻ từ vựng để học một mình hoặc chia sẻ với cộng đồng"
        accent="vocab"
        right={
          <Link href="/my-topics/new">
            <Button variant="game" accent="vocab" size="lg">Tạo bộ chủ đề</Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên..."
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
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                backgroundColor:
                  visibility === v ? 'var(--theme-bg-secondary)' : 'transparent',
                color:
                  visibility === v
                    ? 'var(--theme-text-primary)'
                    : 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
              }}
            >
              {v === 'all' ? 'Tất cả' : VISIBILITY_LABEL[v].label}
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
          title="Chưa có bộ chủ đề nào"
          description="Bắt đầu bằng cách tạo bộ chủ đề đầu tiên, rồi gom các bộ từ vựng thành chủ đề riêng của bạn."
          action={{ label: 'Tạo bộ chủ đề đầu tiên', href: '/my-topics/new' }}
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
  const vis = VISIBILITY_LABEL[topic.visibility];
  const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;

  return (
    <Link href={`/my-topics/${topic.id}`} className="block">
      <Card
        variant="default"
        className="hover:-translate-y-0.5 transition-all duration-300"
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,.05)',
          border: '1px solid var(--theme-border)',
        }}
      >
        <div className="flex items-start gap-4">
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
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: levelColor }}
              >
                {topic.level}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${vis.color}18`, color: vis.color }}
              >
                {vis.label}
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
              <span>{topic.setCount} bộ thẻ</span>
              <span>|</span>
              <span>{topic.wordCount} từ</span>
              {topic.visibility !== 'PRIVATE' && (
                <>
                  <span>|</span>
                  <span>{topic.followerCount} follower</span>
                  <span>|</span>
                  <span>{topic.studyCount} đang học</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
