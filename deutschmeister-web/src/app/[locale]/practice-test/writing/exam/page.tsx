'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useExamWritingHistory, useExamWritingStats, useDeleteExamWriting } from '@/hooks/useExamWriting';
import { ExamWritingHistoryItem } from '@/lib/api/examWriting';
import { PracticePageShell, GridSkeleton } from '@/components/ui';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconPenLine({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L18 5Z" /><path d="M14 2v4a1 1 0 0 0 1 1h4" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M8 18h5" /></svg>;
}
function IconPlus({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLayers({ size = 11, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m10 3 7 4-7 4-7-4 7-4Zm-7 7 7 4 7-4M3 13l7 4 7-4" /></svg>;
}

function scoreColor(s: number) {
  if (s >= 80) return 'var(--success)';
  if (s >= 50) return 'var(--warn)';
  return 'var(--danger)';
}

const STATUS_META: Record<string, { color: string; labelKey: 'statusDraft' | 'statusGrading' | 'statusGraded' | 'statusError' }> = {
  DRAFT:   { color: 'var(--warn)',    labelKey: 'statusDraft' },
  GRADING: { color: 'var(--warn)',    labelKey: 'statusGrading' },
  GRADED:  { color: 'var(--success)', labelKey: 'statusGraded' },
  ERROR:   { color: 'var(--danger)',  labelKey: 'statusError' },
};

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      </div>
      <span className="mono text-[18px] font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value}</span>
    </div>
  );
}

function ExamBadge({ examType, cefrLevel }: { examType: string; cefrLevel: string }) {
  const tCommon = useTranslations('practice.examCommon');
  const color = examType === 'GOETHE' ? 'var(--der)' : 'var(--violet)';
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
      {tCommon('examLabel', { examType, cefrLevel })}
    </span>
  );
}

function HistoryCard({ item, onDelete }: { item: ExamWritingHistoryItem; onDelete: () => void }) {
  const t = useTranslations('practice.examWriting.list');
  const tCommon = useTranslations('practice.examCommon');
  const formatter = useFormatter();
  const isGraded = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const meta = STATUS_META[item.status] ?? STATUS_META['DRAFT']!;
  const accent = item.examType === 'GOETHE' ? 'var(--der)' : 'var(--violet)';
  const href = (isGraded || isGrading) ? `/practice-test/writing/exam/${item.id}/result` : `/practice-test/writing/exam/${item.id}`;

  return (
    <Link href={href} className="block outline-none">
      <article className="word-card-v2 flex h-full flex-col gap-2.5 rounded-[13px] p-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: accent } as React.CSSProperties}>
        <div className="flex flex-wrap items-center gap-1.5">
          <ExamBadge examType={item.examType} cefrLevel={item.cefrLevel} />
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color, letterSpacing: '.04em' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: meta.color }} />{tCommon(meta.labelKey)}
          </span>
        </div>
        <h3 className="text-body font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{t('cardLine')}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="inline-flex items-center gap-1"><IconLayers size={11} />{item.cefrLevel}</span>
            <span className="mono opacity-70">{formatter.dateTime(new Date(item.createdAt), { dateStyle: 'short' })}</span>
          </div>
          <div className="flex items-center gap-2">
            {isGraded && item.totalScore != null && (
              <span className="mono text-[15px] font-bold" style={{ color: scoreColor(item.totalScore) }}>{Math.round(item.totalScore)}%</span>
            )}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500"
              style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function ExamWritingListPage() {
  const t = useTranslations('practice.examWriting.list');
  const tCommon = useTranslations('practice.examCommon');
  const tShared = useTranslations('practice.common');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useExamWritingHistory({ page, limit: 12, status: filterStatus || undefined, cefrLevel: filterLevel || undefined });
  const { data: stats } = useExamWritingStats();
  const deleteMut = useDeleteExamWriting();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMut.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const statusFilters = [
    { id: '', label: tCommon('filterAllStatuses'), color: 'var(--accent)' },
    { id: 'DRAFT', label: tCommon('filterDraft'), color: 'var(--warn)' },
    { id: 'GRADED', label: tCommon('filterGraded'), color: 'var(--success)' },
    { id: 'ERROR', label: tCommon('statusError'), color: 'var(--danger)' },
  ];

  return (
    <PracticePageShell
      backHref="/practice-test/writing"
      title={t('title')}
      subtitle={t('subtitle')}
      accent="writing"
      className="pb-16"
      right={
        <Link href="/practice-test/writing/exam/new"
          className="inline-flex h-11 items-center gap-2 rounded-md px-5 text-caption font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
          <IconPlus size={18} /> {tCommon('newSession')}
        </Link>
      }
    >
      {stats && stats.total > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <MiniStat label={tCommon('stats.total')} value={stats.total} color="var(--accent)" />
          <MiniStat label={tCommon('stats.averageScore')} value={stats.graded > 0 ? `${Math.round(stats.avgScore)}%` : '—'} color="var(--warn)" />
          <MiniStat label={tCommon('stats.bestScore')} value={stats.graded > 0 ? `${Math.round(stats.bestScore)}%` : '—'} color="var(--success)" />
        </div>
      )}

      {confirmDeleteId && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
          style={{ border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 6%, transparent)' }}>
          <div>
            <h4 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tShared('confirmDelete')}</h4>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tShared('cannotUndo')}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-[10px] px-4 py-2 text-caption font-bold" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{tShared('cancel')}</button>
            <button onClick={confirmDelete} className="rounded-[10px] px-4 py-2 text-caption font-bold text-white" style={{ background: 'var(--danger)' }}>{tShared('deletePermanently')}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'A1', 'A2', 'B1', 'B2'].map(lvl => {
            const on = filterLevel === lvl;
            return (
              <button key={lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="mono rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors"
                style={on
                  ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
                  : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                {lvl || tShared('allLevels')}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map(s => {
            const on = filterStatus === s.id;
            return (
              <button key={s.id} onClick={() => { setFilterStatus(s.id); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors"
                style={on
                  ? { background: `color-mix(in srgb, ${s.color} 14%, transparent)`, color: s.color, border: `1px solid ${s.color}` }
                  : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
                {s.id && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />}
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton cols={3} count={6} height="h-32" gap="gap-4" />
      ) : !history?.items.length ? (
        <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <IconPenLine size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('emptyTitle')}</h3>
          <p className="mx-auto mt-1 mb-6 max-w-xs text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('emptySubtitle')}</p>
          <Link href="/practice-test/writing/exam/new"
            className="inline-flex items-center gap-2 rounded-md px-6 h-11 text-body font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <IconPlus size={18} /> {tCommon('startNow')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.items.map((item: ExamWritingHistoryItem) => (
            <HistoryCard key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
          ))}
        </div>
      )}

      {history && history.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            <IconChevronLeft size={16} /> {tShared('previous')}
          </button>
          <span className="mono rounded-[10px] px-4 py-2 text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>{page} / {history.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            {tShared('next')} <IconChevronRight size={16} />
          </button>
        </div>
      )}
    </PracticePageShell>
  );
}
