'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMockExamHistory } from '@/hooks/useMockExam';
import { MockExamHistoryItem } from '@/lib/api/mockExam';
import { PracticePageShell, GridSkeleton } from '@/components/ui';
import { IconTrophy, IconPlus, IconChevronLeft, IconChevronRight } from '@/components/ui/Icons';

const STATUS_META: Record<string, { labelKey: 'statusInProgress' | 'statusCompleted' | 'statusAbandoned'; color: string }> = {
  IN_PROGRESS: { labelKey: 'statusInProgress', color: 'var(--warn)' },
  COMPLETED: { labelKey: 'statusCompleted', color: 'var(--success)' },
  ABANDONED: { labelKey: 'statusAbandoned', color: 'var(--theme-text-muted)' },
};

function HistoryCard({ item }: { item: MockExamHistoryItem }) {
  const t = useTranslations('practice.mockExam.list');
  const tCommon = useTranslations('practice.examCommon');
  const formatter = useFormatter();
  const meta = STATUS_META[item.status] ?? { labelKey: 'statusInProgress' as const, color: 'var(--warn)' };
  const passed = item.result?.overall === 'BESTANDEN';
  const accent = item.examType === 'GOETHE' ? 'var(--der)' : 'var(--violet)';
  const href = item.status === 'COMPLETED'
    ? `/practice-test/mock-exam/${item.id}/result`
    : `/practice-test/mock-exam/${item.id}`;
  const moduleCount = item.includeSpeaking ? 4 : 3;

  return (
    <Link href={href} className="block outline-none">
      <article className="word-card-v2 flex h-full flex-col gap-2.5 rounded-[13px] p-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: accent } as React.CSSProperties}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
            {tCommon('examLabel', { examType: item.examType, cefrLevel: item.cefrLevel })}
          </span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color, letterSpacing: '.04em' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: meta.color }} />
            {t(meta.labelKey)}
          </span>
        </div>

        {item.result && (
          <div className="flex items-center gap-2.5">
            <span className="mono text-h2 font-extrabold" style={{ color: passed ? 'var(--success)' : 'var(--danger)', letterSpacing: '-.02em' }}>
              {Math.round(item.result.overallPercent)}%
            </span>
            <span className="rounded-sm px-2 py-1 text-[10.5px] font-bold uppercase"
              style={{ background: `color-mix(in srgb, ${passed ? 'var(--success)' : 'var(--danger)'} 14%, transparent)`, color: passed ? 'var(--success)' : 'var(--danger)', letterSpacing: '.05em' }}>
              {passed ? t('passed') : t('failed')}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            {t('modulesLine', { count: moduleCount })} · {item.includeSpeaking ? t('withSpeaking') : t('withoutSpeaking')}
          </span>
          <span className="mono text-[11px] opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
            {formatter.dateTime(new Date(item.createdAt), { dateStyle: 'short' })}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function MockExamListPage() {
  const t = useTranslations('practice.mockExam.list');
  const tShared = useTranslations('practice.common');
  const [page, setPage] = useState(1);
  const { data: history, isLoading } = useMockExamHistory({ page, limit: 12 });

  return (
    <PracticePageShell
      backHref="/practice-test"
      title={t('title')}
      subtitle={t('subtitle')}
      accent="premium"
      className="pb-16"
      right={
        <Link href="/practice-test/mock-exam/new"
          className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
          <IconPlus size={18} /> {t('new')}
        </Link>
      }
    >
      {isLoading ? (
        <GridSkeleton cols={3} count={6} height="h-36" gap="gap-4" />
      ) : !history?.items.length ? (
        <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <IconTrophy size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h3>
          <p className="mx-auto mt-1 mb-6 max-w-xs text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('emptySubtitle')}</p>
          <Link href="/practice-test/mock-exam/new"
            className="inline-flex h-11 items-center gap-2 rounded-md px-6 text-body font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <IconPlus size={18} /> {t('new')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.items.map((item) => <HistoryCard key={item.id} item={item} />)}
        </div>
      )}

      {history && history.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            <IconChevronLeft size={16} /> {tShared('previous')}
          </button>
          <span className="mono rounded-[10px] px-4 py-2 text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
            {page} / {history.totalPages}
          </span>
          <button onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            {tShared('next')} <IconChevronRight size={16} />
          </button>
        </div>
      )}
    </PracticePageShell>
  );
}
