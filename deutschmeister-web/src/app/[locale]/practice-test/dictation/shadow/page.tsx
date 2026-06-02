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
import { GridSkeleton } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

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
function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="9 18 15 12 9 6" /></svg>;
}

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

function FChip({ label, on, onClick, dot, mono }: { label: string; on: boolean; onClick: () => void; dot?: string; mono?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors ${mono ? 'mono' : ''}`}
      style={on
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}{label}
    </button>
  );
}
function FGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.05em' }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function HowItWorks() {
  const t = useTranslations('practice.dictation.shadow');
  const steps = [
    { n: 1, icon: '👂', label: t('how1Label'), desc: t('how1Desc') },
    { n: 2, icon: '🎙', label: t('how2Label'), desc: t('how2Desc') },
    { n: 3, icon: '📊', label: t('how3Label'), desc: t('how3Desc') },
  ];
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {steps.map((s) => (
        <div key={s.n} className="flex items-center gap-3 rounded-[11px] p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[17px]" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            {s.icon}
            <span className="mono absolute -left-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: 'var(--accent)' }}>{s.n}</span>
          </div>
          <div className="min-w-0">
            <div className="text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{s.label}</div>
            <div className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: 'rgba(0,0,0,.55)', border: `2px solid ${levelColor}` }}>
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

  // Starter (URL / Library / Random) — one panel, one shared level
  const [starterMode, setStarterMode] = useState<'url' | 'lib' | 'rand'>('url');
  const [starterLevel, setStarterLevel] = useState('');
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [randomError, setRandomError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
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
        cefrLevel: starterLevel || undefined,
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
      const video = await dictationApi.getRandom({ cefrLevel: starterLevel || undefined });
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
      <Link href="/practice-test/dictation" className="mb-3 inline-flex items-center gap-1 text-caption font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronRight size={15} style={{ transform: 'rotate(180deg)' }} /> {tCommon('hub.back')}
      </Link>
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-text-muted)' }}>{t('eyebrow')}</p>
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-body leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>{t('subtitle')}</p>
        </div>
        {stats && stats.total > 0 && (
          <div className="flex shrink-0 gap-2">
            <MiniStat label={t('stats.total')} value={stats.total} color="var(--der)" />
            <MiniStat label={t('stats.averageScore')} value={stats.avgScore ? `${Math.round(stats.avgScore)}%` : '—'} color="var(--accent)" />
            <MiniStat label={t('stats.bestScore')} value={stats.bestScore ? `${Math.round(stats.bestScore)}%` : '—'} color="var(--violet)" />
          </div>
        )}
      </header>

      <HowItWorks />

      {/* Starter panel — one box: URL / Library / Random toggle + shared level */}
      <section className="v2-hero-accent mb-5 overflow-hidden rounded-[14px] p-4 sm:p-5" style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--accent)' }}>{t('panelTitle')}</span>
            <span className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: 'color-mix(in srgb, var(--violet) 16%, transparent)', color: 'var(--violet)', letterSpacing: '.04em' }}>
              <IconSparkles size={10} /> {t('urlAiBadge')}
            </span>
          </div>
          <div className="inline-flex gap-1 rounded-[8px] p-1" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            {([['url', '🔗', t('tabUrl')], ['lib', '📚', t('tabLib')], ['rand', '🎲', t('tabRandom')]] as const).map(([m, ic, lb]) => (
              <button key={m} onClick={() => setStarterMode(m)} className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-caption font-semibold transition-colors" style={starterMode === m ? { background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-primary)' } : { color: 'var(--theme-text-muted)' }}>{ic} {lb}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col gap-2.5">
            {starterMode === 'url' && (
              <>
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{t('urlSubtitle')}</p>
                <div className="flex gap-2">
                  <input type="text" value={youtubeUrl}
                    onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && !startFromUrlMutation.isPending && handleStartFromUrl()}
                    placeholder={t('urlPlaceholder')}
                    className="h-10 min-w-0 flex-1 rounded-[9px] px-3.5 text-caption outline-none"
                    style={{ background: 'var(--theme-bg-secondary)', border: `1px solid ${urlError ? 'var(--danger)' : 'var(--theme-border)'}`, color: 'var(--theme-text-primary)' }} />
                  <button onClick={handleStartFromUrl} disabled={!youtubeUrl.trim() || startFromUrlMutation.isPending}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[9px] px-5 text-caption font-bold disabled:opacity-50"
                    style={youtubeUrl.trim() ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                    {startFromUrlMutation.isPending ? t('processing') : t('start')}
                  </button>
                </div>
                {urlError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{urlError}</p>}
              </>
            )}
            {starterMode === 'lib' && (
              <>
                <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t('chooseShadowVideoDesc')}</p>
                <Link href="/practice-test/dictation/library?mode=shadowing" className="v2-icongrad-accent inline-flex h-10 w-fit items-center gap-1.5 rounded-[9px] px-5 text-caption font-bold text-white">
                  <IconLibrary size={15} /> {t('openLibrary')} <IconChevronRight size={13} />
                </Link>
              </>
            )}
            {starterMode === 'rand' && (
              <>
                <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{t('randomSubtitle')}</p>
                <button onClick={handleStartRandom} disabled={isLoadingRandom}
                  className="v2-icongrad-accent inline-flex h-10 w-fit items-center gap-1.5 rounded-[9px] px-5 text-caption font-bold text-white disabled:opacity-60">
                  🎲 {isLoadingRandom ? t('randomSearching') : t('randomStart')} <IconChevronRight size={13} />
                </button>
                {randomError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{randomError}</p>}
              </>
            )}
          </div>
          <div className="hidden w-px lg:block" style={{ background: 'var(--theme-border)' }} />
          <div className="lg:min-w-48">
            <div className="mb-2 text-[10.5px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>{t('levelLabel')}</div>
            <div className="flex flex-wrap gap-1.5">
              {['', 'A1', 'A2', 'B1', 'B2'].map((lvl) => (
                <FChip key={lvl} label={lvl || t('allLevels')} mono={!!lvl} on={starterLevel === lvl} onClick={() => setStarterLevel(lvl)} />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Confirm delete */}
      {confirmDeleteId && (
        <div
          className="mb-6 rounded-2xl border p-5 flex items-center justify-between gap-6 flex-wrap"
          style={{ borderColor: `color-mix(in srgb, ${STATUS.danger} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${STATUS.danger} 6%, transparent)` }}
        >
          <div>
            <h4
              className="text-lead font-bold mb-1"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {tCommon('confirmDelete')}
            </h4>
            <p
              className="text-body"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {tCommon('cannotUndo')}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-5 py-2.5 rounded-md text-body font-semibold border transition-colors hover:bg-(--theme-bg-secondary)"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2.5 rounded-md text-body font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-95"
              style={{ backgroundColor: STATUS.danger }}
            >
              {tCommon('deletePermanently')}
            </button>
          </div>
        </div>
      )}

      {/* Filters — single v2 card */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <FGroup label={t('filterLevelLabel')}>
          <FChip label={tCommon('all')} on={filterLevel === ''} onClick={() => { setFilterLevel(''); setPage(1); }} />
          {['A1', 'A2', 'B1', 'B2'].map((lvl) => <FChip key={lvl} label={lvl} mono on={filterLevel === lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }} />)}
        </FGroup>
        <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
        <FGroup label={t('filterStatusLabel')}>
          <FChip label={tCommon('all')} on={filterStatus === ''} onClick={() => { setFilterStatus(''); setPage(1); }} />
          <FChip label={t('filterStatuses.SUBMITTED')} on={filterStatus === 'SUBMITTED'} onClick={() => { setFilterStatus('SUBMITTED'); setPage(1); }} dot="var(--success)" />
          <FChip label={t('filterStatuses.DRAFT')} on={filterStatus === 'DRAFT'} onClick={() => { setFilterStatus('DRAFT'); setPage(1); }} dot="var(--warn)" />
        </FGroup>
      </div>

      {/* List */}
      {isLoading ? (
        <GridSkeleton cols={4} count={8} height="h-72" gap="gap-4" />
      ) : !history?.items.length ? (
        <div
          className="text-center py-20 rounded-2xl border border-dashed"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
          >
            <IconMic size={32} />
          </div>
          <h3
            className="text-lead font-bold mb-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            {t('emptyTitle')}
          </h3>
          <p className="text-body mb-6 max-w-xs mx-auto" style={{ color: 'var(--theme-text-muted)' }}>
            {t('emptySubtitle')}
          </p>
          <Link
            href="/practice-test/dictation/library?mode=shadowing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-body font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
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
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-body font-semibold disabled:opacity-30 border transition-colors hover:bg-(--theme-bg-secondary)"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <IconChevronLeft size={18} /> {tCommon('previous')}
          </button>
          <div
            className="px-5 py-2.5 rounded-md text-body font-semibold mono"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}
          >
            {page} / {history.totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))}
            disabled={page === history.totalPages}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-body font-semibold disabled:opacity-30 border transition-colors hover:bg-(--theme-bg-secondary)"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              color: 'var(--theme-text-primary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {tCommon('next')} <IconChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
