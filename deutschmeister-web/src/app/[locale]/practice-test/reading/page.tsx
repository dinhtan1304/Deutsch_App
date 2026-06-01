'use client';
// UI_REFRESH_FORCE_SYNC: 2026-06-01_v4 (redesign v2)

import { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { useReadingHistory, useReadingStats, useDeleteReading } from '@/hooks/useReading';
import { GRADIENT } from '@/lib/tokens';
import { GridSkeleton } from '@/components/ui';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconBookOpen({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
}
function IconSparkles({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m6 4 1.2 2.8L10 8l-2.8 1.2L6 12 4.8 9.2 2 8l2.8-1.2L6 4Zm9 7 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm-2-9 .8 1.7L15.5 5l-1.7.8L13 7.5l-.8-1.7L10.5 5l1.7-.8L13 2.5Z" /></svg>;
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
function IconClock({ size = 11, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M10 5v5l3 2M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" /></svg>;
}
function IconLayers({ size = 11, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m10 3 7 4-7 4-7-4 7-4Zm-7 7 7 4 7-4M3 13l7 4 7-4" /></svg>;
}
function IconArrowRight({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
}

// ─── Type metadata (real textType → color var + emoji) ──────────────────────
const TYPE_COLOR: Record<string, string> = {
  artikel: 'var(--der)',
  brief: 'var(--die)',
  anzeige: 'var(--warn)',
  kurznachricht: 'var(--violet)',
  dialog: 'var(--streak)',
};
const TYPE_ICON: Record<string, string> = {
  artikel: '📰', brief: '✉', anzeige: '📋', kurznachricht: '💬', dialog: '📖',
};
const KNOWN_TYPES = ['artikel', 'brief', 'anzeige', 'kurznachricht', 'dialog'];

function scoreColor(score: number | null) {
  if (score === null) return 'var(--theme-text-muted)';
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warn)';
  return 'var(--danger)';
}

// ─── MiniStat ───────────────────────────────────────────────────────────────
function MiniStat({ label, value, total, color }: { label: string; value: string | number; total?: number; color: string }) {
  return (
    <div className="flex min-w-22 flex-col gap-0.5 rounded-[10px] px-3.5 py-2" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="mono text-[18px] font-extrabold" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{value}</span>
        {total != null && <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>/ {total}</span>}
      </div>
    </div>
  );
}

// ─── Chip ───────────────────────────────────────────────────────────────────
function Chip({ label, on, onClick, dotColor, icon, mono }: { label: string; on: boolean; onClick: () => void; dotColor?: string; icon?: string; mono?: boolean }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors ${mono ? 'mono' : ''}`}
      style={on
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {icon && <span className="text-caption">{icon}</span>}
      {dotColor && !icon && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
      {label}
    </button>
  );
}
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export default function ReadingListPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const t = useTranslations('practice.reading.list');
  const tCommon = useTranslations('practice.common');
  const tHub = useTranslations('practice.common.hub');
  const formatter = useFormatter();

  const { data: history, isLoading } = useReadingHistory({
    page, limit: 12,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteReading();
  const { data: stats } = useReadingStats();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const formatDate = (dateStr: string) =>
    formatter.dateTime(new Date(dateStr), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const allItems = useMemo(() => history?.data ?? [], [history]);
  const items = useMemo(
    () => (filterType ? allItems.filter((i) => i.textType === filterType) : allItems),
    [allItems, filterType],
  );
  const inProgress = allItems.find((i) => i.status === 'DRAFT');

  const typeLabel = (type: string) =>
    KNOWN_TYPES.includes(type) ? t(`textTypes.${type}` as 'textTypes.artikel') : type;

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      {/* Back */}
      <Link href="/practice-test" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={15} /> {tHub('back')}
      </Link>

      {/* Header: eyebrow + title + subtitle + MiniStats */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
        </div>
        {stats && stats.totalSessions > 0 && (
          <div className="flex shrink-0 gap-2">
            <MiniStat label={tHub('statDone')} value={stats.totalSessions} color="var(--accent)" />
            <MiniStat label={tHub('statAvg')} value={stats.averageScore ? `${Math.round(stats.averageScore)}%` : '—'} color="var(--warn)" />
            <MiniStat label={tHub('statBest')} value={stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—'} color="var(--violet)" />
          </div>
        )}
      </header>

      {/* Hero: continue (if DRAFT) or generate */}
      {inProgress ? (
        <section className="v2-hero-warn mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center"
          style={{ border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)' }}>
          <div className="v2-icongrad-warn flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-white" style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
            <IconBookOpen size={24} style={{ color: 'white' }} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--warn)', letterSpacing: '.05em' }}>{tHub('heroContinueEyebrow')}</span>
            <h3 className="mt-0.5 truncate text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{inProgress.title || inProgress.topic}</h3>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{typeLabel(inProgress.textType)} · {inProgress.cefrLevel}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={`/practice-test/reading/${inProgress.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-4 text-caption font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--warn)', boxShadow: '0 4px 14px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
              {tHub('heroContinueCta')} <IconArrowRight size={14} />
            </Link>
            <Link href="/practice-test/reading/new" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-bold">
              {tHub('newCta')}
            </Link>
            <Link href="/practice-test/reading/exam" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-medium">
              {tHub('examCta')}
            </Link>
          </div>
        </section>
      ) : (
        <section className="v2-hero-accent mb-6 flex flex-col items-start gap-4 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center"
          style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
          <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-white" style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
            <IconSparkles size={24} style={{ color: 'white' }} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--accent)', letterSpacing: '.05em' }}>{tHub('heroNewEyebrow')}</span>
            <h3 className="mt-0.5 text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('heroNewTitle')}</h3>
            <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tHub('heroNewDesc')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/practice-test/reading/new" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-5 text-caption font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--accent)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)' }}>
              {tHub('newCta')} <IconArrowRight size={14} />
            </Link>
            <Link href="/practice-test/reading/exam" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-medium">
              {tHub('examCta')}
            </Link>
          </div>
        </section>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5" style={{ border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 6%, transparent)' }}>
          <div>
            <h4 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('confirmDeleteTitle')}</h4>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('confirmDeleteSubtitle')}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-[10px] px-4 py-2 text-caption font-bold" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{tCommon('cancel')}</button>
            <button onClick={confirmDelete} className="rounded-[10px] px-4 py-2 text-caption font-bold text-white" style={{ background: 'var(--danger)' }}>{tCommon('deletePermanently')}</button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <FilterGroup label={tHub('filterType')}>
          <Chip label={tCommon('all')} on={filterType === ''} onClick={() => setFilterType('')} />
          {KNOWN_TYPES.map((ty) => (
            <Chip key={ty} label={typeLabel(ty)} on={filterType === ty} onClick={() => setFilterType(ty)} dotColor={TYPE_COLOR[ty]} icon={TYPE_ICON[ty]} />
          ))}
        </FilterGroup>
        <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
        <FilterGroup label={tHub('filterLevel')}>
          <Chip label={tCommon('all')} on={filterLevel === ''} onClick={() => { setFilterLevel(''); setPage(1); }} />
          {['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => (
            <Chip key={lvl} label={lvl} mono on={filterLevel === lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }} />
          ))}
        </FilterGroup>
        <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
        <FilterGroup label={tHub('filterStatus')}>
          <Chip label={tCommon('all')} on={filterStatus === ''} onClick={() => { setFilterStatus(''); setPage(1); }} />
          <Chip label={tCommon('status.DRAFT')} on={filterStatus === 'DRAFT'} onClick={() => { setFilterStatus('DRAFT'); setPage(1); }} dotColor="var(--warn)" />
          <Chip label={tCommon('status.GRADED')} on={filterStatus === 'GRADED'} onClick={() => { setFilterStatus('GRADED'); setPage(1); }} dotColor="var(--success)" />
        </FilterGroup>
      </div>

      {!isLoading && allItems.length > 0 && (
        <p className="mb-3 text-caption" style={{ color: 'var(--theme-text-muted)' }}>
          {tHub('showing', { count: items.length, total: allItems.length })}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <GridSkeleton cols={3} count={6} height="h-44" gap="gap-4" />
      ) : !items.length ? (
        <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="mb-3 text-[32px]">📭</div>
          <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h3>
          <p className="mx-auto mt-1 mb-6 max-w-xs text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('emptySubtitle')}</p>
          <Link href="/practice-test/reading/new" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-body font-bold text-white" style={{ background: GRADIENT.reading }}>{t('emptyCta')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const tColor = TYPE_COLOR[item.textType] ?? 'var(--accent)';
            const isGraded = item.status === 'GRADED';
            const sColor = isGraded ? 'var(--success)' : 'var(--warn)';
            const statusLabel = tCommon(`status.${item.status}` as 'status.DRAFT');
            const targetHref = isGraded ? `/practice-test/reading/${item.id}/result` : `/practice-test/reading/${item.id}`;
            const stamp = item.submittedAt ?? item.createdAt;
            const minutes = item.submittedAt
              ? Math.round((new Date(item.submittedAt).getTime() - new Date(item.createdAt).getTime()) / 60000)
              : 0;
            const showTime = isGraded && minutes > 0 && minutes < 600;
            return (
              <Link key={item.id} href={targetHref} className="block outline-none">
                <article className="word-card-v2 flex h-full flex-col gap-2.5 rounded-[13px] p-4"
                  style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: tColor } as React.CSSProperties}>
                  {/* header */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${tColor} 16%, transparent)`, color: tColor }}>
                      <span className="text-caption">{TYPE_ICON[item.textType] ?? '📄'}</span>{typeLabel(item.textType)}
                    </span>
                    <span className="mono rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{item.cefrLevel}</span>
                    <span className="flex-1" />
                    <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${sColor} 16%, transparent)`, color: sColor, letterSpacing: '.04em' }}>
                      <span className="h-1 w-1 rounded-full" style={{ background: sColor }} />{statusLabel}
                    </span>
                  </div>
                  {/* title */}
                  <h3 className="text-body font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{item.title || item.topic}</h3>
                  {/* preview snippet */}
                  {item.passagePreview && (
                    <p className="rounded-[9px] px-3 py-2 text-caption leading-relaxed line-clamp-2"
                      style={{ background: 'var(--theme-bg-secondary)', borderLeft: `2px solid color-mix(in srgb, ${tColor} 55%, transparent)`, color: 'var(--theme-text-muted)' }}>
                      „{item.passagePreview}…”
                    </p>
                  )}
                  {/* score dots */}
                  {isGraded && item.totalQuestions > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: item.totalQuestions }).map((_, i) => (
                          <span key={i} className="h-3.5 w-3.5 rounded-xs" style={{ background: i < item.correctCount ? 'var(--success)' : 'var(--theme-bg-secondary)', border: i < item.correctCount ? '1px solid color-mix(in srgb, var(--success) 55%, transparent)' : '1px solid var(--theme-border)' }} />
                        ))}
                      </div>
                      <span className="mono text-caption font-bold" style={{ color: scoreColor(item.score) }}>{item.correctCount}/{item.totalQuestions} · {item.score != null ? Math.round(item.score) : 0}%</span>
                    </div>
                  )}
                  {/* footer */}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      <span className="inline-flex items-center gap-1"><IconLayers size={11} />{t('questionsCount', { count: item.totalQuestions })}</span>
                      {showTime && <span className="inline-flex items-center gap-1"><IconClock size={11} />{minutes} {tHub('minutesUnit')}</span>}
                      <span className="mono opacity-70">{formatDate(stamp)}</span>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(item.id); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500"
                      style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            <IconChevronLeft size={16} /> {tCommon('previous')}
          </button>
          <span className="mono rounded-[10px] px-4 py-2 text-caption font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>{page} / {history.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-caption font-bold transition-opacity disabled:opacity-30"
            style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            {tCommon('next')} <IconChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
