'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import {
  useCreateSet,
  useDeleteSet,
  useDeleteUserTopic,
  useMyTopic,
  useUpdateVisibility,
} from '@/hooks/useUserTopics';
import { ACCENT } from '@/lib/tokens';
import type { UserTopicSetWithCards, UserTopicVisibility } from '@/types/user-topic';
import { getApiErrorMessage } from '@/lib/api/client';

export default function MyTopicDetailPage() {
  const t = useTranslations('vocabulary.myTopicDetail');
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: topic, isLoading } = useMyTopic(id);
  const updateVisibility = useUpdateVisibility(id);
  const deleteTopic = useDeleteUserTopic();
  const createSet = useCreateSet(id);
  const deleteSet = useDeleteSet(id);

  const [newSetTitle, setNewSetTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !topic) {
    return (
      <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
        <Card className="h-32 animate-pulse opacity-60" />
      </div>
    );
  }

  const handleAddSet = async () => {
    if (!newSetTitle.trim()) return;
    try {
      await createSet.mutateAsync({ title: newSetTitle.trim() });
      setNewSetTitle('');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTopic.mutateAsync(id);
      router.push('/my-topics');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-360 mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        hideBackIcon
        title={topic.title}
        subtitle={topic.description ?? undefined}
        accent="vocab"
        right={
          topic.visibility !== 'PRIVATE' ? (
            <Link href={`/community/topics/${topic.slug}`} target="_blank">
              <Button variant="outline" size="md">{t('viewPublic')}</Button>
            </Link>
          ) : null
        }
      />

      <Card variant="default" className="mb-5" style={{ border: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
          {t('visibilityHeader')}
        </h3>
        <VisibilitySelector
          value={topic.visibility}
          onChange={async (value) => {
            try {
              await updateVisibility.mutateAsync(value);
            } catch (e) {
              setError(getApiErrorMessage(e));
            }
          }}
        />
      </Card>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          {t('setsHeader', { count: topic.sets.length })}
        </h2>
      </div>

      {topic.sets.length === 0 ? (
        <EmptyState
          icon={null}
          title={t('emptyTitle')}
          description={t('emptyBody')}
        />
      ) : (
        <div className="space-y-3 mb-5">
          {topic.sets.map((set) => (
            <SetRow
              key={set.id}
              topicId={id}
              set={set}
              onDelete={async () => {
                if (!confirm(t('deleteSetConfirm', { title: set.title }))) return;
                try {
                  await deleteSet.mutateAsync(set.id);
                } catch (e) {
                  setError(getApiErrorMessage(e));
                }
              }}
            />
          ))}
        </div>
      )}

      <Card variant="default" style={{ border: '1px dashed var(--theme-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSetTitle}
            onChange={(e) => setNewSetTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSet();
            }}
            placeholder={t('newSetPlaceholder')}
            maxLength={120}
            className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          <Button
            variant="game"
            accent="vocab"
            isLoading={createSet.isPending}
            disabled={!newSetTitle.trim()}
            onClick={handleAddSet}
          >
            {t('addSet')}
          </Button>
        </div>
      </Card>

      {error && (
        <div
          className="mt-4 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
        >
          {error}
        </div>
      )}

      <div className="mt-10 pt-5" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: ACCENT.speaking }}>
          {t('dangerZone')}
        </h3>
        {!showDeleteConfirm ? (
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
            {t('deleteTopic')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="danger"
              isLoading={deleteTopic.isPending}
              onClick={handleDelete}
            >
              {t('confirmDeleteForever')}
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              {t('cancel')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function VisibilitySelector({
  value,
  onChange,
}: {
  value: UserTopicVisibility;
  onChange: (value: UserTopicVisibility) => void;
}) {
  const t = useTranslations('vocabulary.myTopicDetail');
  const options: Array<{
    value: UserTopicVisibility;
    label: string;
    desc: string;
  }> = [
    { value: 'PRIVATE', label: t('visPrivate'), desc: t('visPrivateDesc') },
    { value: 'UNLISTED', label: t('visUnlisted'), desc: t('visUnlistedDesc') },
    { value: 'PUBLIC', label: t('visPublic'), desc: t('visPublicDesc') },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => {
              if (active) return;
              if (option.value === 'PUBLIC') {
                if (!confirm(t('publicConfirm'))) return;
              }
              onChange(option.value);
            }}
            className="text-left p-3 rounded-xl transition-all"
            style={{
              backgroundColor: active ? `${ACCENT.vocab}12` : 'var(--theme-bg-secondary)',
              border: active ? `2px solid ${ACCENT.vocab}` : '1px solid var(--theme-border)',
            }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: active ? ACCENT.vocab : 'var(--theme-text-primary)' }}
            >
              {option.label}
            </span>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              {option.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function SetRow({
  topicId,
  set,
  onDelete,
}: {
  topicId: string;
  set: UserTopicSetWithCards;
  onDelete: () => void;
}) {
  const t = useTranslations('vocabulary.myTopicDetail');
  return (
    <Card
      variant="default"
      className="!p-4 hover:shadow-md transition-all"
      style={{ border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {set.title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {t('cardCount', { count: set.wordCount })}
            {set.description ? ` | ${set.description}` : ''}
          </p>
        </div>
        <Link href={`/my-topics/${topicId}/sets/${set.id}`}>
          <Button variant="secondary" size="sm">{t('open')}</Button>
        </Link>
        <button
          onClick={onDelete}
          className="text-xs font-bold px-2 py-1 rounded-md"
          style={{ color: ACCENT.speaking }}
          aria-label={t('deleteSetAria')}
        >
          {t('delete')}
        </button>
      </div>
    </Card>
  );
}
