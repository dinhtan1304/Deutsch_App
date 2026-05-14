'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import {
  useCommunityTopic,
  useFollowTopic,
  useForkTopic,
  useUnfollowTopic,
} from '@/hooks/useCommunityTopics';
import { ACCENT } from '@/lib/tokens';
import type { ForkTopicDto, UserTopicSetWithCards } from '@/types/user-topic';
import { getApiErrorMessage } from '@/lib/api/client';

const LEVEL_COLOR: Record<string, string> = {
  A1: ACCENT.reading,
  A2: ACCENT.srs,
  B1: ACCENT.xp,
  B2: ACCENT.speaking,
};

export default function CommunityTopicDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { data: topic, isLoading } = useCommunityTopic(slug);
  const followMut = useFollowTopic();
  const unfollowMut = useUnfollowTopic();
  const forkMut = useForkTopic();

  const [showForkDialog, setShowForkDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !topic) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Card className="h-40 animate-pulse opacity-60" />
      </div>
    );
  }

  const ownerName = topic.owner.name || 'Ẩn danh';
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const levelColor = LEVEL_COLOR[topic.level] ?? ACCENT.vocab;

  const handleFollow = async () => {
    try {
      if (topic.isFollowing) {
        await unfollowMut.mutateAsync(topic.id);
      } else {
        await followMut.mutateAsync(topic.id);
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleStudy = () => {
    const firstSet = topic.sets[0];
    if (firstSet) {
      router.push(`/community/topics/${slug}/study/${firstSet.id}`);
    }
  };

  const handleFork = async (dto: ForkTopicDto) => {
    try {
      const newTopic = await forkMut.mutateAsync({ topicId: topic.id, dto });
      router.push(`/my-topics/${newTopic.id}`);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/community/topics"
        hideBackIcon
        title={topic.title}
        accent="vocab"
      />

      {topic.visibility === 'UNLISTED' && (
        <div
          className="mb-4 px-4 py-2 rounded-xl text-sm"
          style={{ backgroundColor: `${ACCENT.cyan}18`, color: ACCENT.cyan }}
        >
          Đây là link riêng tư. Chỉ người có link mới xem được.
        </div>
      )}

      <Card variant="default" className="mb-5" style={{ border: '1px solid var(--theme-border)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-base font-black shrink-0"
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: levelColor }}
              >
                {topic.level}
              </span>
              {topic.visibility === 'PUBLIC' && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${ACCENT.reading}18`, color: ACCENT.reading }}
                >
                  Công khai
                </span>
              )}
            </div>

            {topic.description && (
              <p className="text-sm mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
                {topic.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-3">
              {topic.owner.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={topic.owner.avatar} alt={ownerName} className="w-7 h-7 rounded-full" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: ACCENT.vocab }}
                >
                  {ownerInitial}
                </div>
              )}
              <span className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {ownerName}
              </span>
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                tạo bộ chủ đề này
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Bộ thẻ" value={topic.setCount} color={ACCENT.vocab} />
              <Stat label="Thẻ từ" value={topic.wordCount} color={ACCENT.srs} />
              <Stat label="Follower" value={topic.followerCount} color={ACCENT.xp} />
              <Stat label="Đang học" value={topic.studyCount} color={ACCENT.reading} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <Button
            variant="game"
            accent="vocab"
            size="lg"
            disabled={topic.sets.length === 0}
            onClick={handleStudy}
          >
            Học ngay
          </Button>
          <Button
            variant={topic.isFollowing ? 'secondary' : 'outline'}
            size="lg"
            isLoading={followMut.isPending || unfollowMut.isPending}
            onClick={handleFollow}
          >
            {topic.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShowForkDialog(true)}>
            Sao chép vào của tôi
          </Button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--theme-text-secondary)',
              border: '2px solid var(--theme-border)',
            }}
          >
            Sao chép link
          </button>
        </div>
      </Card>

      {error && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
        >
          {error}
        </div>
      )}

      <h2 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
        Các bộ thẻ
      </h2>

      {topic.sets.length === 0 ? (
        <EmptyState icon={null} title="Chưa có bộ thẻ" description="Tác giả chưa thêm bộ thẻ nào." />
      ) : (
        <div className="space-y-3">
          {topic.sets.map((set) => (
            <CommunitySetRow key={set.id} slug={slug} set={set} />
          ))}
        </div>
      )}

      {showForkDialog && (
        <ForkDialog
          defaultTitle={`${topic.title} (bản sao)`}
          isLoading={forkMut.isPending}
          onClose={() => setShowForkDialog(false)}
          onConfirm={handleFork}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black" style={{ color }}>
        {value.toLocaleString('vi-VN')}
      </div>
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {label}
      </div>
    </div>
  );
}

function CommunitySetRow({ slug, set }: { slug: string; set: UserTopicSetWithCards }) {
  return (
    <Card
      variant="default"
      className="!p-4"
      style={{ border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {set.title}
          </h3>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {set.wordCount} thẻ
            {set.cards.length > 0 && ' | ' + set.cards.slice(0, 5).map((card) => card.word).join(', ')}
            {set.cards.length === 5 && set.wordCount > 5 ? '...' : ''}
          </p>
        </div>
        <Link href={`/community/topics/${slug}/study/${set.id}`}>
          <Button variant="game" accent="vocab" size="sm">Học bộ này</Button>
        </Link>
      </div>
    </Card>
  );
}

function ForkDialog({
  defaultTitle,
  isLoading,
  onClose,
  onConfirm,
}: {
  defaultTitle: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (dto: ForkTopicDto) => Promise<void>;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [followSource, setFollowSource] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,.5)' }}
      onClick={onClose}
    >
      <Card
        variant="elevated"
        className="max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-h3 font-bold mb-3" style={{ color: 'var(--theme-text-primary)' }}>
          Sao chép vào kho của tôi
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          Tạo bản sao riêng tư. Bạn có thể chỉnh sửa, thêm hoặc xóa thẻ tự do.
        </p>

        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          Tên bản sao
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-4"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />

        <label className="flex items-center gap-2 mb-5 text-sm cursor-pointer" style={{ color: 'var(--theme-text-secondary)' }}>
          <input
            type="checkbox"
            checked={followSource}
            onChange={(e) => setFollowSource(e.target.checked)}
          />
          Theo dõi bộ chủ đề gốc
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="game"
            accent="vocab"
            isLoading={isLoading}
            onClick={() => onConfirm({ title: title.trim() || undefined, followSource })}
          >
            Sao chép
          </Button>
        </div>
      </Card>
    </div>
  );
}
