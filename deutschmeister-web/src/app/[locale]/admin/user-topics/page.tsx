'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@/components/ui';
import {
  adminDeleteTopic,
  hideTopic,
  listAdminTopics,
  recountTopics,
  toggleFeature,
  unhideTopic,
  type AdminQueryDto,
} from '@/lib/api/admin-user-topics';
import { ACCENT } from '@/lib/tokens';
import { getApiErrorMessage } from '@/lib/api/client';

export default function AdminUserTopicsPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState<AdminQueryDto>({
    visibility: 'all',
    hiddenStatus: 'all',
    page: 1,
    limit: 30,
  });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-topics', query],
    queryFn: () => listAdminTopics(query),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-user-topics'] });

  const hideMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => hideTopic(id, reason),
    onSuccess: invalidate,
  });
  const unhideMut = useMutation({
    mutationFn: (id: string) => unhideTopic(id),
    onSuccess: invalidate,
  });
  const featureMut = useMutation({
    mutationFn: (id: string) => toggleFeature(id),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteTopic(id),
    onSuccess: invalidate,
  });
  const recountMut = useMutation({
    mutationFn: () => recountTopics(),
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];

  const wrap = async <T,>(fn: () => Promise<T>) => {
    try {
      await fn();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Quản lý bộ chủ đề người dùng"
        subtitle="Ẩn/hiện, feature, xoá bộ chủ đề công khai"
        right={
          <Button
            variant="secondary"
            isLoading={recountMut.isPending}
            onClick={() => wrap(() => recountMut.mutateAsync())}
          >
            🔄 Recount counters
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          value={query.q ?? ''}
          onChange={(e) => setQuery({ ...query, q: e.target.value, page: 1 })}
          placeholder="Tìm theo tên..."
          className="flex-1 min-w-48 px-4 py-2 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
        <select
          value={query.visibility ?? 'all'}
          onChange={(e) =>
            setQuery({
              ...query,
              visibility: e.target.value as AdminQueryDto['visibility'],
              page: 1,
            })
          }
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <option value="all">Tất cả visibility</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="UNLISTED">UNLISTED</option>
          <option value="PUBLIC">PUBLIC</option>
        </select>
        <select
          value={query.hiddenStatus ?? 'all'}
          onChange={(e) =>
            setQuery({
              ...query,
              hiddenStatus: e.target.value as AdminQueryDto['hiddenStatus'],
              page: 1,
            })
          }
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <option value="all">Tất cả</option>
          <option value="visible">Đang hiện</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>

      {error && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="h-64 animate-pulse opacity-60" />
      ) : items.length === 0 ? (
        <EmptyState icon="📭" title="Không có bộ chủ đề nào" />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Card
              key={t.id}
              variant="default"
              className="!p-3"
              style={{
                border: t.isHiddenByAdmin
                  ? `2px solid ${ACCENT.speaking}`
                  : '1px solid var(--theme-border)',
                opacity: t.isHiddenByAdmin ? 0.85 : 1,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-2xl">{t.coverEmoji || '📚'}</div>
                <div className="flex-1 min-w-48">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          t.visibility === 'PUBLIC'
                            ? `${ACCENT.reading}18`
                            : t.visibility === 'UNLISTED'
                              ? `${ACCENT.cyan}18`
                              : 'var(--theme-bg-secondary)',
                        color:
                          t.visibility === 'PUBLIC'
                            ? ACCENT.reading
                            : t.visibility === 'UNLISTED'
                              ? ACCENT.cyan
                              : 'var(--theme-text-muted)',
                      }}
                    >
                      {t.visibility}
                    </span>
                    {t.isHiddenByAdmin && (
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
                      >
                        Đã ẩn
                      </span>
                    )}
                    {t.isFeatured && (
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${ACCENT.xp}18`, color: ACCENT.xp }}
                      >
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                    {t.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {t.owner.name || t.owner.email} · {t.wordCount} từ ·{' '}
                    {t.followerCount} follow · {t.studyCount} đang học
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/community/topics/${t.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      Xem
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={featureMut.isPending && featureMut.variables === t.id}
                    onClick={() => wrap(() => featureMut.mutateAsync(t.id))}
                  >
                    {t.isFeatured ? 'Bỏ feature' : 'Feature'}
                  </Button>
                  {t.isHiddenByAdmin ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={unhideMut.isPending && unhideMut.variables === t.id}
                      onClick={() => wrap(() => unhideMut.mutateAsync(t.id))}
                    >
                      Bỏ ẩn
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={hideMut.isPending && hideMut.variables?.id === t.id}
                      onClick={() => {
                        const reason = prompt('Lý do ẩn?') ?? undefined;
                        if (reason !== null) {
                          wrap(() => hideMut.mutateAsync({ id: t.id, reason }));
                        }
                      }}
                    >
                      Ẩn
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deleteMut.isPending && deleteMut.variables === t.id}
                    onClick={() => {
                      if (confirm(`Xoá vĩnh viễn bộ chủ đề "${t.title}"?`)) {
                        wrap(() => deleteMut.mutateAsync(t.id));
                      }
                    }}
                  >
                    Xoá
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
