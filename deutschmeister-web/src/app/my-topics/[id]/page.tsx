'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        title={topic.title}
        subtitle={topic.description ?? undefined}
        accent="vocab"
        right={
          topic.visibility !== 'PRIVATE' ? (
            <Link href={`/community/topics/${topic.slug}`} target="_blank">
              <Button variant="outline" size="md">Xem trang công khai →</Button>
            </Link>
          ) : null
        }
      />

      {/* Visibility selector */}
      <Card variant="default" className="mb-5" style={{ border: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
          Mức hiển thị
        </h3>
        <VisibilitySelector
          value={topic.visibility}
          onChange={async (v) => {
            try {
              await updateVisibility.mutateAsync(v);
            } catch (e) {
              setError(getApiErrorMessage(e));
            }
          }}
        />
      </Card>

      {/* Sets section */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>
          Bộ thẻ ({topic.sets.length})
        </h2>
      </div>

      {topic.sets.length === 0 ? (
        <EmptyState
          icon="📁"
          title="Chưa có bộ thẻ nào"
          description="Tạo bộ thẻ đầu tiên để bắt đầu thêm từ vựng."
        />
      ) : (
        <div className="space-y-3 mb-5">
          {topic.sets.map((set) => (
            <SetRow
              key={set.id}
              topicId={id}
              set={set}
              onDelete={async () => {
                if (!confirm(`Xoá bộ thẻ "${set.title}"?`)) return;
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

      {/* Add new set */}
      <Card variant="default" style={{ border: '1px dashed var(--theme-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSetTitle}
            onChange={(e) => setNewSetTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSet();
            }}
            placeholder="Tên bộ thẻ mới..."
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
            + Thêm bộ thẻ
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

      {/* Danger zone */}
      <div className="mt-10 pt-5" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: ACCENT.speaking }}>
          Vùng nguy hiểm
        </h3>
        {!showDeleteConfirm ? (
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
            Xoá bộ chủ đề
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="danger"
              isLoading={deleteTopic.isPending}
              onClick={handleDelete}
            >
              Xác nhận xoá vĩnh viễn
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Huỷ
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
  onChange: (v: UserTopicVisibility) => void;
}) {
  const options: Array<{
    value: UserTopicVisibility;
    label: string;
    desc: string;
    icon: string;
  }> = [
    { value: 'PRIVATE', label: 'Riêng tư', desc: 'Chỉ bạn xem được', icon: '🔒' },
    { value: 'UNLISTED', label: 'Có link', desc: 'Ai có link đều xem được. Không hiển thị trong khám phá.', icon: '🔗' },
    { value: 'PUBLIC', label: 'Công khai', desc: 'Hiển thị trong trang Khám phá cộng đồng.', icon: '🌍' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => {
              if (active) return;
              if (o.value === 'PUBLIC') {
                if (!confirm('Bộ chủ đề sẽ xuất hiện công khai. Tiếp tục?')) return;
              }
              onChange(o.value);
            }}
            className="text-left p-3 rounded-xl transition-all"
            style={{
              backgroundColor: active ? `${ACCENT.vocab}12` : 'var(--theme-bg-secondary)',
              border: active ? `2px solid ${ACCENT.vocab}` : '1px solid var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{o.icon}</span>
              <span
                className="text-sm font-bold"
                style={{ color: active ? ACCENT.vocab : 'var(--theme-text-primary)' }}
              >
                {o.label}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {o.desc}
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
  return (
    <Card
      variant="default"
      className="!p-4 hover:shadow-md transition-all"
      style={{ border: '1px solid var(--theme-border)' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${ACCENT.vocab}18` }}
        >
          📁
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
            {set.title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            {set.wordCount} thẻ
            {set.description ? ` · ${set.description}` : ''}
          </p>
        </div>
        <Link href={`/my-topics/${topicId}/sets/${set.id}`}>
          <Button variant="secondary" size="sm">Mở</Button>
        </Link>
        <button
          onClick={onDelete}
          className="text-xs font-bold px-2 py-1 rounded-md"
          style={{ color: ACCENT.speaking }}
          aria-label="Xoá set"
        >
          ✕
        </button>
      </div>
    </Card>
  );
}
