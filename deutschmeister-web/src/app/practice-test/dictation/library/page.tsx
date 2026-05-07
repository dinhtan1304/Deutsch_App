'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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

function VideoCard({ video, onStart, isStarting, ctaLabel = 'Luyện tập →' }: { video: DictationVideo; onStart: () => void; isStarting: boolean; ctaLabel?: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div 
      onClick={isStarting ? undefined : onStart}
      className={`group relative rounded-4xl border overflow-hidden transition-all duration-700 ${isStarting ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] hover:border-cyan-500/30'}`}
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      
      {/* Thumbnail Area */}
      <div className="relative w-full aspect-video bg-black/40 overflow-hidden">
        {/* Shimmer / Skeleton Loader Effect while loading can be added here */}
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {imgError ? (
          <div className="w-full h-full flex items-center justify-center bg-white/2">
            <div className="flex flex-col items-center gap-2 opacity-20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15.5c.667.667 1.5 1 2.5 1s1.833-.333 2.5-1"/></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter">Preview Unavailable</span>
            </div>
          </div>
        ) : (
          <Image
            src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            fill
            className="object-cover transition-all duration-1000 group-hover:scale-110 grayscale-20 group-hover:grayscale-0"
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-500">
            {isStarting ? (
               <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            )}
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[10px] font-black px-3 py-1 rounded-xl text-white shadow-xl backdrop-blur-xl border border-white/20"
            style={{ backgroundColor: `${CEFR_COLORS[video.cefrLevel] || ACCENT.vocab}CC` }}>
            {video.cefrLevel}
          </span>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             {video.topic ?? 'General'}
           </span>
           {video.durationSec > 0 && (
             <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-black/80 text-white backdrop-blur-md border border-white/10">
               {formatDuration(video.durationSec)}
             </span>
           )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-base font-black line-clamp-2 leading-tight tracking-tight group-hover:text-cyan-400 transition-colors duration-300" style={{ color: 'var(--theme-text-primary)' }}>
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </div>
              <span className="text-[11px] font-bold opacity-40 uppercase tracking-wider" style={{ color: 'var(--theme-text-primary)' }}>
                {video.channelName ?? 'YouTube'}
              </span>
           </div>
           <span className="text-[10px] font-black uppercase text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
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
    <div className="py-6 space-y-10">
      <PageHeader
        backHref={isShadowingMode ? '/practice-test/dictation/shadow' : '/practice-test/dictation'}
        title={isShadowingMode ? 'Thư viện cho Shadowing' : 'Thư viện video'}
        subtitle={
          isShadowingMode
            ? 'Chọn 1 video để bắt đầu luyện shadowing — nghe câu mẫu và nói theo'
            : 'Chọn từ hàng trăm video được tuyển chọn để bắt đầu hành trình chinh phục tiếng Đức'
        }
        accent="listening"
      />

      {/* Filter Toolbar */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {['', 'A1', 'A2', 'B1'].map(l => (
            <button key={l} onClick={() => { setCefrLevel(l); setPage(1); }}
              className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border"
              style={{
                backgroundColor: cefrLevel === l ? 'var(--theme-text-primary)' : 'var(--theme-bg-card)',
                color: cefrLevel === l ? 'var(--theme-bg-body)' : 'var(--theme-text-muted)',
                borderColor: cefrLevel === l ? 'var(--theme-text-primary)' : 'var(--theme-border)',
                boxShadow: cefrLevel === l ? '0 10px 20px rgba(0,0,0,0.2)' : 'none',
              }}>
              {l || 'Tất cả trình độ'}
            </button>
          ))}
        </div>

        {data?.availableTopics && data.availableTopics.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => { setTopic(''); setPage(1); }}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${topic === '' ? 'border-cyan-500/50 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-muted hover:text-primary'}`}>
              Tất cả chủ đề
            </button>
            {data.availableTopics.map(t => (
              <button key={t} onClick={() => { setTopic(t); setPage(1); }}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${topic === t ? 'border-cyan-500/50 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-muted hover:text-primary'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <GridSkeleton cols={3} count={12} />
      ) : !data?.items.length ? (
        <div className="text-center py-32 rounded-[3rem] border-2 border-dashed transition-all hover:border-cyan-500/30" 
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)/30' }}>
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 opacity-20">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15.5c.667.667 1.5 1 2.5 1s1.833-.333 2.5-1"/></svg>
          </div>
          <p className="text-sm font-black uppercase tracking-widest opacity-30">Không tìm thấy video phù hợp</p>
        </div>
      ) : (
        <>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onStart={() => handleStart(video.id)}
                isStarting={startingId === video.id}
                ctaLabel={isShadowingMode ? '🎤 Shadowing →' : 'Luyện tập →'}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-20 pt-10 border-t border-white/5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all hover:bg-white/5 disabled:opacity-20 active:scale-90"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              
              <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                  Trang {page} / {data.totalPages}
                </span>
              </div>

              <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all hover:bg-white/5 disabled:opacity-20 active:scale-90"
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
