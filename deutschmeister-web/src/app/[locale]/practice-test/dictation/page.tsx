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

  // Starter (URL / Random) — one panel, one shared level
  const [starterMode, setStarterMode] = useState<'url' | 'rand'>('url');
  const [starterLevel, setStarterLevel] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [queuedMessage, setQueuedMessage] = useState('');
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
        cefrLevel: starterLevel || undefined,
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
      const video = await dictationApi.getRandom({ cefrLevel: starterLevel || undefined });
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

      {/* Starter panel — one box, URL / Random toggle + shared level */}
      <section className="v2-hero-accent mb-5 overflow-hidden rounded-[14px] p-4 sm:p-5" style={{ border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)' }}>
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--accent)' }}>{tQuick('panelTitle')}</span>
          <div className="inline-flex gap-1 rounded-[8px] p-1" style={{ background: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border)' }}>
            <button onClick={() => setStarterMode('url')} className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-caption font-semibold transition-colors" style={starterMode === 'url' ? { background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-primary)' } : { color: 'var(--theme-text-muted)' }}>🔗 {tQuick('tabUrl')}</button>
            <button onClick={() => setStarterMode('rand')} className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-caption font-semibold transition-colors" style={starterMode === 'rand' ? { background: 'var(--theme-bg-tertiary)', color: 'var(--theme-text-primary)' } : { color: 'var(--theme-text-muted)' }}>🎲 {tQuick('tabRandom')}</button>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col gap-2.5">
            {starterMode === 'url' ? (
              <>
                <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tQuick('urlSubtitle')}</p>
                <div className="flex gap-2">
                  <input type="text" value={youtubeUrl}
                    onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(''); setQueuedMessage(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartFromUrl()}
                    placeholder={tQuick('urlPlaceholder')}
                    className="h-10 min-w-0 flex-1 rounded-[9px] px-3.5 text-caption outline-none"
                    style={{ background: 'var(--theme-bg-secondary)', border: `1px solid ${urlError ? 'var(--danger)' : 'var(--theme-border)'}`, color: 'var(--theme-text-primary)' }} />
                  <button onClick={handleStartFromUrl} disabled={!youtubeUrl.trim() || startFromUrlMutation.isPending}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[9px] px-5 text-caption font-bold disabled:opacity-50"
                    style={youtubeUrl.trim() ? { background: 'var(--accent)', color: 'var(--accent-on)' } : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                    {startFromUrlMutation.isPending ? tQuick('processing') : tQuick('start')}
                  </button>
                </div>
                {urlError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{urlError}</p>}
                {queuedMessage && (
                  <p className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--success)' }}><IconCheck size={13} />{queuedMessage}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-caption leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{tQuick('randomDescription')}</p>
                <button onClick={handleStartRandom} disabled={isLoadingRandom}
                  className="v2-icongrad-accent inline-flex h-10 w-fit items-center gap-1.5 rounded-[9px] px-5 text-caption font-bold text-white disabled:opacity-60">
                  🎲 {isLoadingRandom ? tQuick('searching') : tQuick('startRandom')} <IconChevronRight size={13} />
                </button>
                {randomError && <p className="text-[11px]" style={{ color: 'var(--danger)' }}>{randomError}</p>}
              </>
            )}
          </div>
          <div className="hidden w-px lg:block" style={{ background: 'var(--theme-border)' }} />
          <div className="lg:min-w-48">
            <div className="mb-2 text-[10.5px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>{tQuick('levelLabel')}</div>
            <div className="flex flex-wrap gap-1.5">
              {['', 'A1', 'A2', 'B1', 'B2'].map((lvl) => (
                <FChip key={lvl} label={lvl || tQuick('allLevels')} mono={!!lvl} on={starterLevel === lvl} onClick={() => setStarterLevel(lvl)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* My Requests — compact chip row */}
      {myRequests && myRequests.items.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>{tReq('title')} · {myRequests.items.length}</span>
          {myRequests.items.map((req) => {
            const sc = req.status === 'APPROVED' ? 'var(--success)' : req.status === 'REJECTED' ? 'var(--danger)' : 'var(--warn)';
            const label = req.status === 'APPROVED' ? tReq('approved') : req.status === 'REJECTED' ? tReq('rejected') : tReq('pending');
            const inner = (
              <>
                <span className="inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${sc} 16%, transparent)`, color: sc, letterSpacing: '.04em' }}>
                  <span className="h-1 w-1 rounded-full" style={{ background: sc }} />{label}
                </span>
                <span className="max-w-50 truncate text-caption" style={{ color: 'var(--theme-text-primary)' }}>{req.video?.title ?? req.youtubeUrl}</span>
                <span className="mono text-[10.5px]" style={{ color: 'var(--theme-text-muted)' }}>{formatter.dateTime(new Date(req.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </>
            );
            const cls = 'inline-flex items-center gap-2 rounded-[8px] px-2.5 py-1.5';
            const st = { background: 'var(--theme-bg-card)', border: `1px solid color-mix(in srgb, ${sc} 30%, transparent)` } as React.CSSProperties;
            return req.status === 'APPROVED' && req.video ? (
              <button key={req.id} onClick={() => startSessionMutation.mutate({ videoId: req.video!.id }, { onSuccess: (s) => router.push(`/practice-test/dictation/${s.id}`) })} disabled={startSessionMutation.isPending} className={cls} style={st}>{inner}</button>
            ) : (
              <div key={req.id} className={cls} style={st}>{inner}</div>
            );
          })}
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

      {/* Filters — single v2 card */}
      {(() => {
        const sources = Array.from(new Set((history?.items ?? []).map((i) => i.video.topic).filter(Boolean))) as string[];
        return (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl p-3" style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
            {sources.length > 0 && (
              <>
                <FGroup label={t('filterSourceLabel')}>
                  <FChip label={tCommon('all')} on={filterSource === ''} onClick={() => setFilterSource('')} />
                  {sources.map((s) => <FChip key={s} label={s} on={filterSource === s} onClick={() => setFilterSource(s)} dot={CEFR_COLORS[''] ?? ACCENT.dictation} />)}
                </FGroup>
                <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
              </>
            )}
            <FGroup label={t('filterLevelLabel')}>
              <FChip label={tCommon('all')} on={filterLevel === ''} onClick={() => { setFilterLevel(''); setPage(1); }} />
              {['A1', 'A2', 'B1', 'B2'].map((lvl) => <FChip key={lvl} label={lvl} mono on={filterLevel === lvl} onClick={() => { setFilterLevel(lvl); setPage(1); }} />)}
            </FGroup>
            <span className="h-5 w-px" style={{ background: 'var(--theme-border)' }} />
            <FGroup label={t('filterStatusLabel')}>
              <FChip label={tCommon('all')} on={filterStatus === ''} onClick={() => { setFilterStatus(''); setPage(1); }} />
              <FChip label={t('statusGraded')} on={filterStatus === 'GRADED'} onClick={() => { setFilterStatus('GRADED'); setPage(1); }} dot="var(--success)" />
              <FChip label={t('statusDraft')} on={filterStatus === 'DRAFT'} onClick={() => { setFilterStatus('DRAFT'); setPage(1); }} dot="var(--warn)" />
            </FGroup>
          </div>
        );
      })()}

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
          {history.items.filter((i) => !filterSource || i.video.topic === filterSource).map((item: DictationHistoryItem) => (
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
