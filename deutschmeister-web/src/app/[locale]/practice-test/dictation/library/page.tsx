'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDictationLibrary, useStartDictation } from '@/hooks/useDictation';
import { useStartShadowing } from '@/hooks/useShadowing';
import { DictationVideo } from '@/lib/api/dictation';
import { PageHeader, GridSkeleton } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Shared filter chip — calm v2 (accent-tint when active).
function Chip({ label, on, onClick, mono }: { label: string; on: boolean; onClick: () => void; mono?: boolean }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 rounded-[7px] px-2.5 py-1 text-caption font-semibold transition-colors ${mono ? 'mono' : ''}`}
      style={on
        ? { background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--accent)' }
        : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-secondary)', border: '1px solid var(--theme-border)' }}>
      {label}
    </button>
  );
}

function VideoCard({ video, onStart, isStarting, ctaLabel }: { video: DictationVideo; onStart: () => void; isStarting: boolean; ctaLabel: string }) {
  const t = useTranslations('practice.dictation.library');
  const [imgError, setImgError] = useState(false);
  const levelColor = CEFR_COLORS[video.cefrLevel] || ACCENT.vocab;
  return (
    <div
      onClick={isStarting ? undefined : onStart}
      className={`word-card-v2 group relative rounded-[13px] border overflow-hidden transition-transform ${isStarting ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:-translate-y-0.5'}`}
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', ['--card-accent' as string]: levelColor } as React.CSSProperties}>

      {/* Thumbnail Area */}
      <div className="relative w-full aspect-video overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--theme-text-muted)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15.5c.667.667 1.5 1 2.5 1s1.833-.333 2.5-1"/></svg>
              <span className="text-caption font-semibold uppercase tracking-wide">{t('previewUnavailable')}</span>
            </div>
          </div>
        ) : (
          <Image
            src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-black">
            {isStarting ? (
               <div className="w-5 h-5 border-3 border-black/10 border-t-black rounded-full animate-spin" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            )}
          </div>
        </div>

        {/* CEFR badge */}
        <span className="mono absolute top-2.5 left-2.5 text-[10.5px] font-bold px-2 py-0.5 rounded-md text-white"
          style={{ background: levelColor }}>
          {video.cefrLevel}
        </span>

        {/* Topic + duration */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
           <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-white truncate" style={{ background: 'rgba(0,0,0,.6)' }}>
             {video.topic ?? t('defaultTopic')}
           </span>
           {video.durationSec > 0 && (
             <span className="mono text-[10px] font-semibold px-2 py-0.5 rounded-md text-white shrink-0" style={{ background: 'rgba(0,0,0,.7)' }}>
               {formatDuration(video.durationSec)}
             </span>
           )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 space-y-2.5">
        <h3 className="text-body font-bold line-clamp-2 leading-snug" style={{ color: 'var(--theme-text-primary)' }}>
          {video.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </span>
              <span className="text-caption truncate" style={{ color: 'var(--theme-text-muted)' }}>
                {video.channelName ?? t('defaultChannel')}
              </span>
           </div>
           <span className="text-caption font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent)' }}>
             {ctaLabel}
           </span>
        </div>
      </div>
    </div>
  );
}

export default function DictationLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('practice.dictation.library');
  const isShadowingMode = searchParams.get('mode') === 'shadowing';
  const [cefrLevel, setCefrLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data, isLoading } = useDictationLibrary({ page, limit: 12, cefrLevel: cefrLevel || undefined, topic: topic || undefined });
  const { mutate: startSession } = useStartDictation();
  const { mutate: startShadowing } = useStartShadowing();

  const handleStart = (videoId: string) => {
    setStartingId(videoId);
    if (isShadowingMode) {
      startShadowing({ videoId }, {
        onSuccess: (session) => router.push(`/practice-test/dictation/shadow/${session.id}`),
        onSettled: () => setStartingId(null),
      });
    } else {
      startSession({ videoId }, {
        onSuccess: (session) => router.push(`/practice-test/dictation/${session.id}`),
        onSettled: () => setStartingId(null),
      });
    }
  };

  return (
    <div className="mx-auto max-w-360 py-6 space-y-6">
      <PageHeader
        backHref={isShadowingMode ? '/practice-test/dictation/shadow' : '/practice-test/dictation'}
        title={isShadowingMode ? t('titleShadowing') : t('titleDictation')}
        subtitle={isShadowingMode ? t('subtitleShadowing') : t('subtitleDictation')}
        accent="listening"
      />

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'A1', 'A2', 'B1'].map(l => (
            <Chip key={l} label={l || t('allLevels')} mono={!!l} on={cefrLevel === l} onClick={() => { setCefrLevel(l); setPage(1); }} />
          ))}
        </div>

        {data?.availableTopics && data.availableTopics.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Chip label={t('allTopics')} on={topic === ''} onClick={() => { setTopic(''); setPage(1); }} />
            {data.availableTopics.map(topicItem => (
              <Chip key={topicItem} label={topicItem} on={topic === topicItem} onClick={() => { setTopic(topicItem); setPage(1); }} />
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <GridSkeleton cols={3} count={12} />
      ) : !data?.items.length ? (
        <div className="text-center py-24 rounded-2xl border border-dashed"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15.5c.667.667 1.5 1 2.5 1s1.833-.333 2.5-1"/></svg>
          </div>
          <p className="text-body font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{t('empty')}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onStart={() => handleStart(video.id)}
                isStarting={startingId === video.id}
                ctaLabel={isShadowingMode ? t('ctaShadowing') : t('ctaDictation')}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10 pt-6 border-t" style={{ borderColor: 'var(--theme-border)' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 rounded-md flex items-center justify-center border transition-colors hover:bg-(--theme-bg-secondary) disabled:opacity-30"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="px-5 py-2 rounded-md mono text-body font-semibold" style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)' }}>
                {t('page', { page, total: data.totalPages })}
              </div>

              <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 rounded-md flex items-center justify-center border transition-colors hover:bg-(--theme-bg-secondary) disabled:opacity-30"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
