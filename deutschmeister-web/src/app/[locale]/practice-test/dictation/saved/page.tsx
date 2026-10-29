'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, GridSkeleton, PageHeader, useToast } from '@/components/ui';
import { useSavedSentences, useDeleteSavedSentence } from '@/hooks/useDictation';
import { usePronunciation } from '@/hooks/usePronunciation';
import { ACCENT } from '@/lib/tokens';

function formatTimestamp(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

const svgProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export default function SavedSentencesPage() {
  const t = useTranslations('practice.dictation.saved');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSavedSentences({ page, limit: 20 });
  const { mutate: deleteSaved, isPending: isDeleting } = useDeleteSavedSentence();
  const { speak } = usePronunciation();

  return (
    <div className="mx-auto max-w-240 space-y-6 py-6">
      <PageHeader
        backHref="/practice-test/dictation"
        title={t('title')}
        subtitle={t('subtitle')}
        accent="listening"
      />

      {isLoading ? (
        <GridSkeleton cols={1} count={4} />
      ) : !data?.items.length ? (
        <Card variant="bordered" className="flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('empty')}</p>
          <Link href="/practice-test/dictation/library?mode=watch"
            className="inline-flex h-10 items-center rounded-md px-4 text-caption font-semibold text-white"
            style={{ background: ACCENT.listening }}>
            {t('emptyCta')}
          </Link>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map(item => (
              <Card key={item.id} variant="bordered" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-lead font-semibold leading-snug" style={{ color: 'var(--theme-text-primary)' }}>{item.textDe}</p>
                    {item.textVi && (
                      <p className="mt-1 text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{item.textVi}</p>
                    )}
                    <Link
                      href={`/practice-test/dictation/watch/${item.videoId}?t=${Math.floor(item.startMs / 1000)}`}
                      className="mt-2 inline-flex max-w-full items-center gap-1.5 text-caption font-semibold hover:underline"
                      style={{ color: ACCENT.listening }}
                      title={t('openVideo')}
                    >
                      <span className="mono shrink-0">{formatTimestamp(item.startMs)}</span>
                      <span className="truncate">· {item.video.title}</span>
                    </Link>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => speak(item.textDe)} aria-label={t('listen')} title={t('listen')}
                      className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-(--theme-bg-secondary)"
                      style={{ color: ACCENT.listening }}>
                      <svg {...svgProps}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                    </button>
                    <button type="button" disabled={isDeleting} aria-label={t('delete')} title={t('delete')}
                      onClick={() => deleteSaved(item.id, { onError: (err: Error) => toast.show({ title: err.message, kind: 'danger' }) })}
                      className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-(--theme-bg-secondary) disabled:opacity-40"
                      style={{ color: 'var(--theme-text-muted)' }}>
                      <svg {...svgProps}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="h-10 w-10 rounded-md border disabled:opacity-30"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>‹</button>
              <span className="mono text-body font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {t('page', { page, total: data.totalPages })}
              </span>
              <button type="button" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="h-10 w-10 rounded-md border disabled:opacity-30"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
