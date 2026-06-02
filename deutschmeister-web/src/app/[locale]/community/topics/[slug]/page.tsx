'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('vocabulary.community');
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
      <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
        <Card className="h-40 animate-pulse opacity-60" />
      </div>
    );
  }

  const ownerName = topic.owner.name || t('anonymous');
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
    <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
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
          {t('unlistedNotice')}
        </div>
      )}

      <Card variant="default" className="mb-5" style={{ border: '1px solid var(--theme-border)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
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
                className="text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: levelColor }}
              >
                {topic.level}
              </span>
              {topic.visibility === 'PUBLIC' && (
                <span
                  className="text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${ACCENT.reading}18`, color: ACCENT.reading }}
                >
                  {t('public')}
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
                {t('createdThis')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label={t('statSets')} value={topic.setCount} color={ACCENT.vocab} />
              <Stat label={t('statCards')} value={topic.wordCount} color={ACCENT.srs} />
              <Stat label={t('statFollowers')} value={topic.followerCount} color={ACCENT.xp} />
              <Stat label={t('statStudying')} value={topic.studyCount} color={ACCENT.reading} />
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
            {t('studyNow')}
          </Button>
          <Button
            variant={topic.isFollowing ? 'secondary' : 'outline'}
            size="lg"
            isLoading={followMut.isPending || unfollowMut.isPending}
            onClick={handleFollow}
          >
            {topic.isFollowing ? t('following') : t('follow')}
          </Button>
          <Button variant="outline" size="lg" onClick={() => setShowForkDialog(true)}>
            {t('copyToMine')}
          </Button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors hover:bg-(--theme-bg-secondary)"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--theme-text-secondary)',
              border: '1px solid var(--theme-border)',
            }}
          >
            {t('copyLink')}
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
        {t('cardSets')}
      </h2>

      {topic.sets.length === 0 ? (
        <EmptyState icon={null} title={t('detailEmptyTitle')} description={t('detailEmptyBody')} />
      ) : (
        <div className="space-y-3">
          {topic.sets.map((set) => (
            <CommunitySetRow key={set.id} slug={slug} set={set} />
          ))}
        </div>
      )}

      {showForkDialog && (
        <ForkDialog
          defaultTitle={t('forkSuffix', { title: topic.title })}
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
      <div className="text-2xl font-bold mono" style={{ color }}>
        {value.toLocaleString('vi-VN')}
      </div>
      <div
        className="text-caption font-semibold uppercase tracking-wide"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {label}
      </div>
    </div>
  );
}

function CommunitySetRow({ slug, set }: { slug: string; set: UserTopicSetWithCards }) {
  const t = useTranslations('vocabulary.community');
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
            {t('cardCount', { count: set.wordCount })}
            {set.cards.length > 0 && ' | ' + set.cards.slice(0, 5).map((card) => card.word).join(', ')}
            {set.cards.length === 5 && set.wordCount > 5 ? '...' : ''}
          </p>
        </div>
        <Link href={`/community/topics/${slug}/study/${set.id}`}>
          <Button variant="game" accent="vocab" size="sm">{t('studyThis')}</Button>
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
  const t = useTranslations('vocabulary.community');
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
          {t('forkTitle')}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
          {t('forkDesc')}
        </p>

        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {t('forkNameLabel')}
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
          {t('forkFollowSource')}
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="game"
            accent="vocab"
            isLoading={isLoading}
            onClick={() => onConfirm({ title: title.trim() || undefined, followSource })}
          >
            {t('copy')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
