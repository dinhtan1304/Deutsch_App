'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import {
  useShadowingHistory,
  useShadowingStats,
  useDeleteShadowing,
  useStartShadowing,
  useStartShadowingFromUrl,
} from '@/hooks/useShadowing';
import { dictationApi } from '@/lib/api/dictation';
import type { ShadowingHistoryItem } from '@/lib/api/shadowing';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

// ─── Inline Icons ──────────────────────────────────────────────────────────
function IconMic({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
function IconDice({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
      <path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
      <path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" />
    </svg>
  );
}
function IconLink({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconSparkles({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
function IconLibrary({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
function IconTrash({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IconCheck({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}

// ─── HistoryCard ───────────────────────────────────────────────────────────
function HistoryCard({ item, onDelete }: { item: ShadowingHistoryItem; onDelete: () => void }) {
  const t = useTranslations('practice.dictation.shadow');
  const formatter = useFormatter();
  const isSubmitted = item.status === 'SUBMITTED';
  const score = item.overallScore ?? null;
  const href = isSubmitted
    ? `/practice-test/dictation/shadow/${item.id}/result`
    : `/practice-test/dictation/shadow/${item.id}`;

  const levelColor = CEFR_COLORS[item.difficulty] || ACCENT.vocab;
  const inProgress = !isSubmitted && item.completedSegments > 0;
  const statusColor = isSubmitted ? STATUS.success : inProgress ? ACCENT.xp : ACCENT.srs;
  const statusLabel = isSubmitted ? t('statusSubmitted') : t('statusDraft');
  const pct = item.totalSegments > 0 ? Math.round((item.completedSegments / item.totalSegments) * 100) : 0;
  const cta = isSubmitted ? t('cardReview') : inProgress ? t('cardContinue') : t('cardStart');

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
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: 'rgba(0,0,0,.55)', border: `2px solid ${levelColor}` }}>
            <IconMic size={16} />
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
          <span className="inline-flex w-fit items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${statusColor} 16%, transparent)`, color: statusColor, letterSpacing: '.04em' }}>
            <span className="h-1 w-1 rounded-full" style={{ background: statusColor }} />{statusLabel}
          </span>
          <h3 className="line-clamp-2 text-body font-bold leading-snug" style={{ letterSpacing: '-.01em', color: 'var(--theme-text-primary)' }}>{item.video.title}</h3>
          <div className="text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="mono font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>{item.totalSegments}</span> {t('segmentsUnit')}
          </div>
          {score !== null && (
            <div>
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="mono text-body font-bold" style={{ color: getScoreColor(score) }}>{Math.round(score)}%</span>
                <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{t('scorePron')}</span>
              </div>
              <div className="h-0.75 overflow-hidden rounded-full" style={{ background: 'var(--theme-bg-secondary)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round(score)}%`, background: getScoreColor(score) }} />
              </div>
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed pt-2.5" style={{ borderColor: 'var(--theme-border)' }}>
            <span className="mono text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{formatter.dateTime(new Date(item.createdAt), { day: '2-digit', month: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: levelColor }}>{cta}<IconChevronRight size={12} /></span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-colors hover:text-red-500" style={{ color: 'var(--theme-text-muted)' }} aria-label="delete"><IconTrash size={15} /></button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ShadowingListPage() {
  const router = useRouter();
  const t = useTranslations('practice.dictation.shadow');
  const tCommon = useTranslations('practice.common');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [randomLevel, setRandomLevel] = useState('');
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState('');

  // URL submission state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlLevel, setUrlLevel] = useState('');
  const [urlError, setUrlError] = useState('');

  const { data: history, isLoading } = useShadowingHistory({
    page, limit: 10,
    status: filterStatus || undefined,
    cefrLevel: filterLevel || undefined,
  });
  const { data: stats } = useShadowingStats();
  const deleteMutation = useDeleteShadowing();
  const startMutation = useStartShadowing();
  const startFromUrlMutation = useStartShadowingFromUrl();

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try { await deleteMutation.mutateAsync(confirmDeleteId); } catch { /* handled */ }
    setConfirmDeleteId(null);
  };

  const handleStartFromUrl = async () => {
    if (!youtubeUrl.trim()) { setUrlError(t('urlMissing')); return; }
    if (!/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch|embed|shorts|live|v)\/?)/i.test(youtubeUrl)) {
      setUrlError(t('urlInvalid')); return;
    }
    setUrlError('');
    try {
      const session = await startFromUrlMutation.mutateAsync({
        youtubeUrl: youtubeUrl.trim(),
        cefrLevel: urlLevel || undefined,
      });
      router.push(`/practice-test/dictation/shadow/${session.id}`);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : '';
      setUrlError(msg || t('urlGenericError'));
    }
  };

  const handleStartRandom = async () => {
    setIsLoadingRandom(true);
    setRandomError('');
    try {
      const video = await dictationApi.getRandom({ cefrLevel: randomLevel || undefined });
      const session = await startMutation.mutateAsync({ videoId: video.id });
      router.push(`/practice-test/dictation/shadow/${session.id}`);
    } catch {
      setRandomError(t('randomError'));
    } finally {
      setIsLoadingRandom(false);
    }
  };

  return (
    <div className="max-w-360 mx-auto px-4 py-8 pb-32">
      <PageHeader
        backHref="/practice-test/dictation"
        title={t('title')}
        subtitle={t('subtitle')}
        accent="reading"
        right={
          <div className="flex items-center gap-3">
            <Link
              href="/practice-test/dictation/library?mode=shadowing"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/30"
              style={{ background: GRADIENT.reading }}
            >
              <IconLibrary size={20} /> {t('chooseVideo')}
            </Link>
          </div>
        }
      />

      {/* URL input — full width */}
      <div
        className="rounded-2xl p-5 border mb-4"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
          >
            <IconLink size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-black tracking-tight flex items-center gap-2 flex-wrap"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {t('urlTitle')}
              <span
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
              >
                <IconSparkles size={10} /> {t('urlAiBadge')}
              </span>
            </div>
            <div
              className="text-[11px] opacity-50 font-medium"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {t('urlSubtitle')}
            </div>
          </div>
        </div>
        <input
          type="text"
          value={youtubeUrl}
          onChange={e => { setYoutubeUrl(e.target.value); setUrlError(''); }}
          onKeyDown={e => e.key === 'Enter' && !startFromUrlMutation.isPending && handleStartFromUrl()}
          placeholder={t('urlPlaceholder')}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border transition-all mb-3"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            borderColor: urlError ? STATUS.danger : 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        />
        {urlError && (
          <p className="text-xs mb-3 font-medium" style={{ color: STATUS.danger }}>
            {urlError}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setUrlLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={urlLevel === lvl
                  ? { background: GRADIENT.reading, color: 'white' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              >
                {lvl || t('allLevels')}
              </button>
            ))}
          </div>
          <button
            onClick={handleStartFromUrl}
            disabled={startFromUrlMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center gap-2"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            {startFromUrlMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('processing')}
              </>
            ) : t('start')}
          </button>
        </div>
      </div>

      {/* Quick start: library + random */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT.reading}15`, color: ACCENT.reading }}
            >
              <IconLibrary size={18} />
            </div>
            <div>
              <div
                className="text-sm font-black tracking-tight"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {t('chooseShadowVideoTitle')}
              </div>
              <div
                className="text-[11px] opacity-50 font-medium"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {t('chooseShadowVideoSubtitle')}
              </div>
            </div>
          </div>
          <p
            className="text-xs opacity-50 mb-4 font-medium leading-relaxed"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('chooseShadowVideoDesc')}
          </p>
          <Link
            href="/practice-test/dictation/library?mode=shadowing"
            className="w-full block text-center py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            {t('openLibrary')}
          </Link>
        </div>

        {/* Random */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ACCENT.xp}15`, color: ACCENT.xp }}
            >
              <IconDice size={18} />
            </div>
            <div>
              <div
                className="text-sm font-black tracking-tight"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {t('randomTitle')}
              </div>
              <div
                className="text-[11px] opacity-50 font-medium"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                {t('randomSubtitle')}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'A1', 'A2', 'B1'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRandomLevel(lvl)}
                className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                style={
                  randomLevel === lvl
                    ? { background: GRADIENT.reading, color: 'white' }
                    : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }
                }
              >
                {lvl || t('allLevels')}
              </button>
            ))}
          </div>
          {randomError && (
            <p className="text-xs mb-3 font-medium" style={{ color: STATUS.danger }}>
              {randomError}
            </p>
          )}
          <button
            onClick={handleStartRandom}
            disabled={isLoadingRandom}
            className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: GRADIENT.reading, boxShadow: '0 8px 20px rgba(34,197,94,0.2)' }}
          >
            {isLoadingRandom ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('randomSearching')}
              </>
            ) : (
              <>
                <IconDice size={14} /> {t('randomStart')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: t('stats.total'),        value: stats.total, color: ACCENT.reading, icon: <IconMic size={20} /> },
            { label: t('stats.averageScore'), value: stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—', color: ACCENT.xp, icon: <IconDice size={20} /> },
            { label: t('stats.bestScore'),    value: stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—', color: STATUS.success, icon: <IconCheck size={20} /> },
          ].map((s, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl px-5 py-4 border shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--theme-bg-card)',
                borderColor: 'var(--theme-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="absolute -right-4 -bottom-4 w-20 h-20 blur-2xl opacity-20"
                style={{ backgroundColor: s.color }}
              />
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}15`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="relative z-10 min-w-0">
                <div
                  className="text-[10px] font-black uppercase tracking-widest opacity-40"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-2xl font-black tracking-tight"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDeleteId && (
        <div
          className="mb-10 rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 flex-wrap"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}05` }}
        >
          <div>
            <h4
              className="text-xl font-black mb-1.5"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {tCommon('confirmDelete')}
            </h4>
            <p
              className="text-base opacity-50 font-medium"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {tCommon('cannotUndo')}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-6 py-3 rounded-xl text-xs font-black border transition-all hover:bg-white/5"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="px-6 py-3 rounded-xl text-xs font-black text-white transition-all hover:brightness-110 shadow-xl shadow-red-500/30"
              style={{ backgroundColor: STATUS.danger }}
            >
              {tCommon('deletePermanently')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-5 mb-10">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {['', 'A1', 'A2', 'B1'].map((lvl) => {
            const isActive = filterLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => { setFilterLevel(lvl); setPage(1); }}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300"
                style={isActive
                  ? { background: GRADIENT.reading, color: 'white', boxShadow: '0 10px 20px rgba(34,197,94,0.3)' }
                  : { backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
              >
                {lvl || tCommon('allLevels')}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: '', label: tCommon('allStatuses') },
            { id: 'DRAFT', label: t('filterStatuses.DRAFT') },
            { id: 'SUBMITTED', label: t('filterStatuses.SUBMITTED') },
          ].map((status) => {
            const isActive = filterStatus === status.id;
            const color = status.id === '' ? ACCENT.reading : status.id === 'SUBMITTED' ? STATUS.success : ACCENT.games;
            return (
              <button
                key={status.id}
                onClick={() => { setFilterStatus(status.id); setPage(1); }}
                className="px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 border shadow-sm"
                style={isActive
                  ? { background: 'var(--theme-bg-card)', borderColor: color, color, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <GridSkeleton cols={4} count={8} height="h-72" gap="gap-4" />
      ) : !history?.items.length ? (
        <div
          className="text-center py-28 rounded-[3.5rem] border-2 border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div
            className="w-24 h-24 rounded-4xl mx-auto flex items-center justify-center mb-8 shadow-2xl"
            style={{ background: GRADIENT.reading }}
          >
            <IconMic size={40} style={{ color: 'white' }} />
          </div>
          <h3
            className="text-2xl font-black mb-3"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('emptyTitle')}
          </h3>
          <p className="text-base opacity-50 mb-10 max-w-xs mx-auto font-medium">
            {t('emptySubtitle')}
          </p>
          <Link
            href="/practice-test/dictation/library?mode=shadowing"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-base font-black text-white shadow-2xl shadow-green-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ background: GRADIENT.reading }}
          >
            {t('emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {history.items.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onDelete={() => setConfirmDeleteId(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history && history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-16">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-green-500/20"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            }}
          >
            <IconChevronLeft size={18} /> {tCommon('previous')}
          </button>
          <div
            className="px-8 py-3 rounded-xl bg-black/3 dark:bg-white/5 text-xs font-black tracking-widest"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {page} / {history.totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))}
            disabled={page === history.totalPages}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black disabled:opacity-30 transition-all hover:bg-black/3 dark:hover:bg-white/5 border border-transparent hover:border-green-500/20"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            }}
          >
            {tCommon('next')} <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
