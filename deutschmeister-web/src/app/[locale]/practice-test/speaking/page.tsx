'use client';
// UI_REFRESH_FORCE_SYNC: 2026-06-01_v4 (redesign v2)

import { useState, useMemo } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFreeSpeakingHistory, useFreeSpeakingStats, useDeleteFreeSpeaking } from '@/hooks/useFreeSpeaking';
import { FreeSpeakingHistoryItem } from '@/lib/api/freeSpeaking';
import { GridSkeleton } from '@/components/ui';
import { GRADIENT } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
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
function IconArrowRight({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
}

// Topic labels are German exam categories — kept in German to match Goethe/TELC.
const TOPIC_LABELS: Record<string, string> = {
  sich_vorstellen: 'Sich vorstellen', alltag: 'Alltag & Freizeit', wohnen: 'Wohnen',
  arbeit: 'Arbeit & Beruf', familie: 'Familie & Freunde', reisen: 'Reisen',
  einkaufen: 'Einkaufen', gesundheit: 'Gesundheit & Sport', meinung: 'Meinungen',
};
const TOPIC_COLOR: Record<string, string> = {
  sich_vorstellen: 'var(--der)', alltag: 'var(--accent)', wohnen: 'var(--violet)',
  arbeit: 'var(--cyan)', familie: 'var(--die)', reisen: 'var(--success)',
  einkaufen: 'var(--warn)', gesundheit: 'var(--streak)', meinung: 'var(--der)',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'var(--theme-text-muted)', GRADING: 'var(--warn)', GRADED: 'var(--success)',
};

function scoreColor(s: number) {
  if (s >= 80) return 'var(--success)';
  if (s >= 50) return 'var(--warn)';
  return 'var(--danger)';
}
const topicLabel = (ty: string) => TOPIC_LABELS[ty] ?? ty.replace(/_/g, ' ');

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

function Chip({ label, on, onClick, dotColor, mono }: { label: string; on: boolean; onClick: () => void; dotColor?: string; mono?: boolean }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors ${mono ? 'mono' : ''}`}
      style={on
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />}
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

function HistoryCard({ item, onDelete }: { item: FreeSpeakingHistoryItem; onDelete: () => void }) {
  const t = useTranslations('practice.speaking.list');
  const tHub = useTranslations('practice.common.hub');
  const formatter = useFormatter();
  const isGraded = item.status === 'GRADED';
  const isGrading = item.status === 'GRADING';
  const score = item.totalScore ?? null;
  const tColor = TOPIC_COLOR[item.topicType] ?? 'var(--accent)';
  const sColor = STATUS_COLOR[item.status] ?? 'var(--theme-text-muted)';
  const href = (isGraded || isGrading) ? `/practice-test/speaking/${item.id}/result` : `/practice-test/speaking/${item.id}`;
  const statusLabel = isGraded ? t('statusGraded') : isGrading ? t('statusGrading') : t('statusDraft');

  return (
    <Link href={href} className="block outline-none">
      <article className="word-card-v2 flex h-full flex-col gap-2.5 rounded-[13px] p-4"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: tColor } as React.CSSProperties}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${tColor} 16%, transparent)`, color: tColor }}>
            <span className="text-caption">🎤</span>{topicLabel(item.topicType)}
          </span>
          <span className="mono rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>{item.cefrLevel}</span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${sColor} 16%, transparent)`, color: sColor, letterSpacing: '.04em' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: sColor }} />{statusLabel}
          </span>
        </div>
        <h3 className="text-body font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{item.prompt}</h3>
        {score !== null && (
          <div>
            <span className="mono inline-flex items-baseline gap-0.5 rounded-lg px-2.5 py-1 text-body font-extrabold" style={{ background: `color-mix(in srgb, ${scoreColor(score)} 14%, transparent)`, color: scoreColor(score) }}>
              {Math.round(score)}<span className="text-[11px]">%</span>
            </span>
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2.5 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span>{t('goetheTelcFormat')}</span>
            <span className="mono inline-flex items-center gap-1 opacity-70"><IconClock size={11} />{formatter.dateTime(new Date(item.createdAt), { day: '2-digit', month: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: tColor }}>{(isGraded || isGrading) ? tHub('view') : tHub('continue')}<IconArrowRight size={12} /></span>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500" style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function SpeakingListPage() {
  const t = useTranslations('practice.speaking.list');
  const tCommon = useTranslations('practice.common');
  const tHub = useTranslations('practice.common.hub');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: history, isLoading } = useFreeSpeakingHistory({
    page, limit: 12,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = useDeleteFreeSpeaking();
  const { data: stats } = useFreeSpeakingStats();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const allItems = useMemo(() => history?.items ?? [], [history]);
  const presentTopics = useMemo(() => Object.keys(TOPIC_LABELS).filter((ty) => allItems.some((i) => i.topicType === ty)), [allItems]);
  const items = useMemo(() => (filterTopic ? allItems.filter((i) => i.topicType === filterTopic) : allItems), [allItems, filterTopic]);
  const inProgress = allItems.find((i) => i.status === 'DRAFT');

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      <Link href="/practice-test" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={15} /> {tHub('back')}
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
        </div>
        {stats && stats.total > 0 && (
          <div className="flex shrink-0 gap-2">
            <MiniStat label={tHub('statDone')} value={stats.total} color="var(--accent)" />
            <MiniStat label={tHub('statAvg')} value={stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—'} color="var(--warn)" />
            <MiniStat label={tHub('statBest')} value={stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—'} color="var(--violet)" />
          </div>
        )}
      </header>

      {inProgress ? (
        <section className="v2-hero-warn mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl p-5 sm:flex-row sm:items-center"
          style={{ border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)' }}>
          <div className="v2-icongrad-warn flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] text-white" style={{ boxShadow: '0 8px 20px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
            <IconMic size={24} style={{ color: 'white' }} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--warn)', letterSpacing: '.05em' }}>{tHub('heroContinueEyebrow')}</span>
            <h3 className="mt-0.5 truncate text-h3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{inProgress.prompt}</h3>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{topicLabel(inProgress.topicType)} · {inProgress.cefrLevel}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={`/practice-test/speaking/${inProgress.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-4 text-caption font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--warn)', boxShadow: '0 4px 14px color-mix(in srgb, var(--warn) 40%, transparent)' }}>
              {tHub('heroContinueCta')} <IconArrowRight size={14} />
            </Link>
            <Link href="/practice-test/speaking/new" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-bold">
              {tHub('newCta')}
            </Link>
            <Link href="/practice-test/speaking/exam" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-medium">
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
            <Link href="/practice-test/speaking/new" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-5 text-caption font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--accent)', boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 45%, transparent)' }}>
              {tHub('newCta')} <IconArrowRight size={14} />
            </Link>
            <Link href="/practice-test/speaking/exam" className="v2-btn-soft inline-flex h-10 items-center rounded-[10px] px-4 text-caption font-medium">
              {tHub('examCta')}
            </Link>
          </div>
        </section>
      )}

      {confirmDeleteId && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5" style={{ border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 6%, transparent)' }}>
          <div>
            <h4 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('confirmDelete')}</h4>
            <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tCommon('cannotUndo')}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setConfirmDeleteId(null)} className="rounded-[10px] px-4 py-2 text-caption font-bold" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{tCommon('cancel')}</button>
            <button onClick={confirmDelete} className="rounded-[10px] px-4 py-2 text-caption font-bold text-white" style={{ background: 'var(--danger)' }}>{tCommon('deletePermanently')}</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        {presentTopics.length > 0 && (
          <>
            <FilterGroup label={tHub('filterType')}>
              <Chip label={tCommon('all')} on={filterTopic === ''} onClick={() => setFilterTopic('')} />
              {presentTopics.map((ty) => (
                <Chip key={ty} label={topicLabel(ty)} on={filterTopic === ty} onClick={() => setFilterTopic(ty)} dotColor={TOPIC_COLOR[ty]} />
              ))}
            </FilterGroup>
            <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
          </>
        )}
        <FilterGroup label={tHub('filterLevel')}>
          <Chip label={tCommon('all')} on={filterLevel === ''} onClick={() => { setFilterLevel(''); setPage(1); }} />
          {['A1', 'A2', 'B1', 'B2'].map((lvl) => (
            <Chip key={lvl} label={lvl} mono on={filterLevel === lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }} />
          ))}
        </FilterGroup>
        <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
        <FilterGroup label={tHub('filterStatus')}>
          <Chip label={tCommon('all')} on={filterStatus === ''} onClick={() => { setFilterStatus(''); setPage(1); }} />
          <Chip label={t('filterStatuses.DRAFT')} on={filterStatus === 'DRAFT'} onClick={() => { setFilterStatus('DRAFT'); setPage(1); }} dotColor="var(--theme-text-muted)" />
          <Chip label={t('filterStatuses.GRADING')} on={filterStatus === 'GRADING'} onClick={() => { setFilterStatus('GRADING'); setPage(1); }} dotColor="var(--warn)" />
          <Chip label={t('filterStatuses.GRADED')} on={filterStatus === 'GRADED'} onClick={() => { setFilterStatus('GRADED'); setPage(1); }} dotColor="var(--success)" />
        </FilterGroup>
      </div>

      {!isLoading && allItems.length > 0 && (
        <p className="mb-3 text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tHub('showing', { count: items.length, total: allItems.length })}</p>
      )}

      {isLoading ? (
        <GridSkeleton cols={3} count={6} height="h-40" gap="gap-4" />
      ) : !items.length ? (
        <div className="rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="mb-3 text-[32px]">📭</div>
          <h3 className="text-body font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h3>
          <p className="mx-auto mt-1 mb-6 max-w-xs text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('emptySubtitle')}</p>
          <Link href="/practice-test/speaking/new" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-body font-bold text-white" style={{ background: GRADIENT.speaking }}>{t('emptyCta')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
          ))}
        </div>
      )}

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
