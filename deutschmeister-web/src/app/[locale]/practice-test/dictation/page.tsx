'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import * as DictationHooks from '@/hooks/useDictation';
import { DictationHistoryItem, dictationApi } from '@/lib/api/dictation';
import { GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── Local Icons ─────────────────────────────────────────────────────────────
function IconVideo({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" /></svg>;
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function IconLibrary({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>;
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconLink({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab, B2: ACCENT.xp, C1: ACCENT.writing,
};

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

// ─── Blank-density bars ───────────────────────────────────────────────────────
function BlankBars({ n, color }: { n: number; color: string }) {
  const filled = Math.min(5, Math.ceil(n / 12));
  return (
    <span className="inline-flex items-end gap-0.5" style={{ height: 12 }} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="w-0.75 rounded-[1px]" style={{ height: 4 + i * 2, background: i <= filled ? color : 'var(--theme-bg-tertiary)', opacity: i <= filled ? 1 : 0.5 }} />
      ))}
    </span>
  );
}

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

// ─── Component: HistoryCard (v2 thumbnail) ──────────────────────────────────
function HistoryCard({ item, onDelete }: { item: DictationHistoryItem; onDelete: () => void }) {
  const t = useTranslations('practice.dictation.list');
  const formatter = useFormatter();
  const isGraded = item.status === 'GRADED';
  const inProgress = !isGraded && item.correctBlanks > 0;
  const score = item.score ?? null;
  const levelColor = CEFR_COLORS[item.difficulty] || ACCENT.vocab;
  const statusColor = isGraded ? STATUS.success : inProgress ? ACCENT.xp : ACCENT.srs;
  const statusLabel = isGraded ? t('statusGraded') : t('statusDraft');
  const pct = item.totalBlanks > 0 ? Math.round((item.correctBlanks / item.totalBlanks) * 100) : 0;
  const cta = isGraded ? t('cardReview') : inProgress ? t('cardContinue') : t('cardStart');
  const href = isGraded ? `/practice-test/dictation/${item.id}/result` : `/practice-test/dictation/${item.id}`;

  return (
    <Link href={href} className="block h-full outline-none">
      <article className="word-card-v2 flex h-full flex-col overflow-hidden rounded-[13px]"
        style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', ['--card-accent' as string]: levelColor } as React.CSSProperties}>
        {/* Thumbnail */}
        <div className="relative flex items-center justify-center"
          style={{
            aspectRatio: '16 / 9',
            backgroundColor: `color-mix(in srgb, ${levelColor} 18%, var(--theme-bg-secondary))`,
            backgroundImage: item.video.thumbnailUrl ? `url(${item.video.thumbnailUrl})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
          {!item.video.thumbnailUrl && <span className="text-[44px] opacity-80">🎬</span>}
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: 'rgba(0,0,0,.6)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2v10l9-5z" /></svg>
          </div>
          {item.video.topic && (
            <span className="absolute left-2 top-2 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: 'rgba(0,0,0,.6)', letterSpacing: '.04em' }}>{item.video.topic}</span>
          )}
          <span className="mono absolute right-2 top-2 rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold text-white" style={{ background: levelColor }}>{item.difficulty}</span>
          {inProgress && (
            <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: 'rgba(0,0,0,.4)' }}>
              <div className="h-full" style={{ width: `${pct}%`, background: ACCENT.xp }} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${statusColor} 16%, transparent)`, color: statusColor, letterSpacing: '.04em' }}>
              <span className="h-1 w-1 rounded-full" style={{ background: statusColor }} />{statusLabel}
            </span>
            {score !== null && (
              <span className="mono ml-auto text-caption font-bold" style={{ color: getScoreColor(score) }}>{Math.round(score)}%</span>
            )}
          </div>
          <h3 className="line-clamp-2 text-body font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{item.video.title}</h3>
          <div className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
            <BlankBars n={item.totalBlanks} color={levelColor} />
            <span><b className="mono" style={{ color: 'var(--theme-text-secondary)' }}>{item.totalBlanks}</b> {t('blanksUnit')}</span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
            <span className="mono text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{formatter.dateTime(new Date(item.createdAt), { day: '2-digit', month: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: levelColor }}>
                {cta}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500" style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Main Component: DictationListPage ──────────────────────────────────────
export default function DictationListPage() {
  const router = useRouter();
  const t = useTranslations('practice.dictation.list');
  const tQuick = useTranslations('practice.dictation.list.quickStart');
  const tReq = useTranslations('practice.dictation.list.requests');
  const tCommon = useTranslations('practice.common');
  const formatter = useFormatter();
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quick-start: URL
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlLevel, setUrlLevel] = useState('');
  const [urlError, setUrlError] = useState('');
  const [queuedMessage, setQueuedMessage] = useState('');
  // Quick-start: Random
  const [randomLevel, setRandomLevel] = useState('');
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState('');

  const { data: history, isLoading } = DictationHooks.useDictationHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const deleteMutation = DictationHooks.useDeleteDictation();
  const { data: stats } = DictationHooks.useDictationStats();
  const startFromUrlMutation = DictationHooks.useStartDictationFromUrl();
  const startSessionMutation = DictationHooks.useStartDictation();
  const { data: myRequests } = DictationHooks.useMyDictationRequests();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const handleStartFromUrl = async () => {
    if (!youtubeUrl.trim()) { setUrlError(tQuick('urlMissing')); return; }
    if (!/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch|embed|shorts|live|v)\/?)/i.test(youtubeUrl)) {
      setUrlError(tQuick('urlInvalid')); return;
    }
    setUrlError('');
    setQueuedMessage('');
    try {
      const result = await startFromUrlMutation.mutateAsync({
        youtubeUrl: youtubeUrl.trim(),
        cefrLevel: urlLevel || undefined,
      });
      if ('status' in result && result.status === 'QUEUED') {
        setQueuedMessage(result.message);
        setYoutubeUrl('');
        return;
      }
      router.push(`/practice-test/dictation/${result.id}`);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : '';
      setUrlError(msg || tQuick('urlGenericError'));
    }
  };

  const handleStartRandom = async () => {
    setIsLoadingRandom(true);
    setRandomError('');
    try {
      const video = await dictationApi.getRandom({ cefrLevel: randomLevel || undefined });
      const session = await startSessionMutation.mutateAsync({ videoId: video.id });
      router.push(`/practice-test/dictation/${session.id}`);
    } catch {
      setRandomError(tQuick('randomNotFound'));
    } finally {
      setIsLoadingRandom(false);
    }
  };

  return (
    <div className="mx-auto max-w-360 px-4 py-6 pb-32 sm:px-6">
      <Link href="/practice-test" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        {tCommon('hub.back')}
      </Link>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/practice-test/dictation/library" className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-4 text-caption font-bold text-white" style={{ background: GRADIENT.dictation }}>
            <IconLibrary size={16} /> {t('newSession')}
          </Link>
          <Link href="/practice-test/dictation/shadow" className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-4 text-caption font-bold" style={{ background: 'var(--theme-bg-card)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
            {t('shadowingLink')}
          </Link>
          {stats && stats.total > 0 && (
            <>
              <MiniStat label={t('stats.total')} value={stats.total} color="var(--accent)" />
              <MiniStat label={t('stats.accuracy')} value={stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—'} color="var(--warn)" />
              <MiniStat label={t('stats.best')} value={stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—'} color="var(--success)" />
            </>
          )}
        </div>
      </header>

      {/* Quick Start */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* YouTube URL card */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT.dictation}15`, color: ACCENT.dictation }}>
              <IconLink size={18} />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{tQuick('urlTitle')}</div>
              <div className="text-[11px] opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>{tQuick('urlSubtitle')}</div>
            </div>
          </div>
          <input
            type="text"
            value={youtubeUrl}
            onChange={e => { setYoutubeUrl(e.target.value); setUrlError(''); setQueuedMessage(''); }}
            onKeyDown={e => e.key === 'Enter' && handleStartFromUrl()}
            placeholder={tQuick('urlPlaceholder')}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border transition-all mb-2"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: urlError ? STATUS.danger : 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
          {urlError && <p className="text-xs mb-2 font-medium" style={{ color: STATUS.danger }}>{urlError}</p>}
          {queuedMessage && (
            <div className="flex items-start gap-2 mb-2 px-3 py-2.5 rounded-xl text-xs font-medium"
              style={{ backgroundColor: `${STATUS.success}12`, color: STATUS.success }}>
              <IconCheck size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{queuedMessage}</span>
            </div>
          )}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map(lvl => (
              <button key={lvl} onClick={() => setUrlLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={urlLevel === lvl
                  ? { background: GRADIENT.dictation, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                {lvl || tQuick('allLevels')}
              </button>
            ))}
          </div>
          <button
            onClick={handleStartFromUrl}
            disabled={startFromUrlMutation.isPending}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: GRADIENT.dictation, boxShadow: '0 8px 20px rgba(6,182,212,0.2)' }}>
            {startFromUrlMutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {tQuick('processing')}</>
              : tQuick('start')}
          </button>
        </div>

        {/* Random card */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT.xp}15`, color: ACCENT.xp }}>
              <IconDice size={18} />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>{tQuick('randomTitle')}</div>
              <div className="text-[11px] opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>{tQuick('randomSubtitle')}</div>
            </div>
          </div>
          <p className="text-xs opacity-50 mb-4 font-medium leading-relaxed" style={{ color: 'var(--theme-text-primary)' }}>
            {tQuick('randomDescription')}
          </p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map(lvl => (
              <button key={lvl} onClick={() => setRandomLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={randomLevel === lvl
                  ? { background: GRADIENT.dictation, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                {lvl || tQuick('allLevels')}
              </button>
            ))}
          </div>
          {randomError && <p className="text-xs mb-3 font-medium" style={{ color: STATUS.danger }}>{randomError}</p>}
          <button
            onClick={handleStartRandom}
            disabled={isLoadingRandom}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: GRADIENT.dictation, boxShadow: '0 8px 20px rgba(6,182,212,0.2)' }}>
            {isLoadingRandom
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {tQuick('searching')}</>
              : <><IconDice size={14} /> {tQuick('startRandom')}</>}
          </button>
        </div>
      </div>

      {/* My Requests */}
      {myRequests && myRequests.items.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest mb-3 opacity-50" style={{ color: 'var(--theme-text-primary)' }}>
            {tReq('title')}
          </h3>
          <div className="space-y-2">
            {myRequests.items.map(req => {
              const statusConfig = {
                PENDING:  { label: tReq('pending'),  color: '#FBBF24', bg: 'rgba(245,158,11,0.12)' },
                APPROVED: { label: tReq('approved'), color: '#4ADE80', bg: 'rgba(34,197,94,0.12)' },
                REJECTED: { label: tReq('rejected'), color: '#FCA5A5', bg: 'rgba(239,68,68,0.12)' },
              }[req.status];
              return (
                <div key={req.id}
                  className="rounded-xl border p-3 flex items-center gap-3 flex-wrap"
                  style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${req.youtubeId}/default.jpg`}
                    alt=""
                    className="w-20 h-14 rounded-lg object-cover shrink-0 bg-black/20"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
                        {statusConfig.label}
                      </span>
                      <span className="text-[10px] opacity-40 font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                        {formatter.dateTime(new Date(req.createdAt), { dateStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                      {req.video?.title ?? req.youtubeUrl}
                    </p>
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#FCA5A5' }}>
                        {tReq('reason', { reason: req.rejectionReason })}
                      </p>
                    )}
                  </div>
                  {req.status === 'APPROVED' && req.video && (
                    <button
                      onClick={() => startSessionMutation.mutate(
                        { videoId: req.video!.id },
                        { onSuccess: (s) => router.push(`/practice-test/dictation/${s.id}`) },
                      )}
                      disabled={startSessionMutation.isPending}
                      className="px-4 py-2 rounded-lg text-xs font-black text-white shrink-0 disabled:opacity-60"
                      style={{ background: GRADIENT.dictation }}>
                      {tReq('start')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Banner for Deletion */}
      {confirmDeleteId && (
        <div className="mb-10 rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 flex-wrap animate-in fade-in slide-in-from-top-4 duration-500"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}05` }}>
          <div>
            <h4 className="text-xl font-black mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('confirmDelete')}</h4>
            <p className="text-base opacity-50 font-medium" style={{ color: 'var(--theme-text-primary)' }}>{tCommon('cannotUndo')}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setConfirmDeleteId(null)} className="px-6 py-3 rounded-xl text-xs font-black border transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>{tCommon('cancel')}</button>
            <button onClick={confirmDelete} className="px-6 py-3 rounded-xl text-xs font-black text-white transition-all hover:brightness-110 shadow-xl shadow-red-500/30"
              style={{ backgroundColor: STATUS.danger }}>{tCommon('deletePermanently')}</button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {['', 'A1', 'A2', 'B1'].map(lvl => {
            const isActive = filterLevel === lvl;
            return (
              <button key={lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
                style={isActive
                  ? { background: GRADIENT.dictation, color: 'white', boxShadow: '0 10px 20px rgba(6,182,212,0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }>{lvl || tCommon('allLevels')}</button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: tCommon('allStatuses') },
            { id: 'DRAFT', label: t('statusDraft') },
            { id: 'GRADED', label: t('statusGraded') },
          ].map(status => {
            const isActive = filterStatus === status.id;
            const color = status.id === '' ? ACCENT.dictation : status.id === 'GRADED' ? STATUS.success : ACCENT.games;
            return (
              <button key={status.id} onClick={() => { setFilterStatus(status.id); setPage(1); }}
                className="px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border shadow-sm"
                style={isActive
                  ? { background: 'var(--theme-bg-card)', borderColor: color, color, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }
                }>{status.label}</button>
            );
          })}
        </div>
      </div>

      {/* List Content */}
      {isLoading ? (
        <GridSkeleton cols={4} count={8} height="h-72" gap="gap-4" />
      ) : !history?.items.length ? (
        <div className="text-center py-28 rounded-[3.5rem] border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl" style={{ background: GRADIENT.dictation }}>
            <IconVideo size={40} style={{ color: 'white' }} />
          </div>
          <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">{t('emptySubtitle')}</p>
          <Link href="/practice-test/dictation/library" className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.dictation }}>{t('emptyCta')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {history.items.map((item: DictationHistoryItem) => (
            <HistoryCard key={item.id} item={item} onDelete={() => setConfirmDeleteId(item.id)} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-cyan-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            <IconChevronLeft size={18} /> {tCommon('previous')}
          </button>
          <div className="px-8 py-3 rounded-xl bg-black/3 dark:bg-white/5 text-xs font-black tracking-widest" style={{ color: 'var(--theme-text-primary)' }}>
            {page} / {history.totalPages}
          </div>
          <button onClick={() => setPage(p => Math.min(history.totalPages, p + 1))} disabled={page === history.totalPages}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-cyan-500/20"
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
            {tCommon('next')} <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
