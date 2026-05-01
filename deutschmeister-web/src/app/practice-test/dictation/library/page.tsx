'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDictationLibrary, useStartDictation } from '@/hooks/useDictation';
import { DictationVideo } from '@/lib/api/dictation';
import { ACCENT, STATUS } from '@/lib/tokens';

const GRADIENT = 'linear-gradient(135deg, #06B6D4, #3B82F6)';
const COLOR = '#06B6D4';

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VideoCard({ video, onStart, isStarting }: { video: DictationVideo; onStart: () => void; isStarting: boolean }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div 
      onClick={isStarting ? undefined : onStart}
      className={`group rounded-2xl border overflow-hidden transition-all duration-300 ${isStarting ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-[#06B6D450]'}`}
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.thumbnailUrl ?? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
            {isStarting ? (
               <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M21 12a9 9 0 1 1-6.219-8.56" />
               </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </div>
        </div>

        {/* Level badge */}
        <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm"
          style={{ backgroundColor: CEFR_COLORS[video.cefrLevel] || ACCENT.vocab }}>
          {video.cefrLevel}
        </span>
        {video.durationSec > 0 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur-md">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold line-clamp-2 mb-1 transition-colors group-hover:text-[#06B6D4]" style={{ color: 'var(--theme-text-primary)' }}>
          {video.title}
        </p>
        <p className="text-xs mb-1" style={{ color: 'var(--theme-text-muted)' }}>
          {video.channelName ?? 'YouTube'} · {video.topic ?? 'Chép chính tả'}
        </p>
      </div>
    </div>
  );
}

export default function DictationLibraryPage() {
  const router = useRouter();
  const [cefrLevel, setCefrLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data, isLoading } = useDictationLibrary({ page, limit: 12, cefrLevel: cefrLevel || undefined, topic: topic || undefined });
  const { mutate: startSession } = useStartDictation();

  function handleStart(videoId: string) {
    setStartingId(videoId);
    startSession({ videoId }, {
      onSuccess: (session) => router.push(`/practice-test/dictation/${session.id}`),
      onSettled: () => setStartingId(null),
    });
  }

  return (
    <div className="py-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center border"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Thư viện video</h1>
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Chọn video để bắt đầu chép chính tả</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center p-1 rounded-xl shrink-0" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
          {['', 'A1', 'A2', 'B1'].map(l => (
            <button key={l} type="button" onClick={() => { setCefrLevel(l); setPage(1); }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: cefrLevel === l ? 'var(--theme-bg-body)' : 'transparent',
                color: cefrLevel === l ? COLOR : 'var(--theme-text-secondary)',
                boxShadow: cefrLevel === l ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
              {l || 'Tất cả cấp độ'}
            </button>
          ))}
        </div>

        {data?.availableTopics && data.availableTopics.length > 0 && (
          <div className="flex items-center p-1 rounded-xl overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
            <button type="button" onClick={() => { setTopic(''); setPage(1); }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0"
              style={{
                backgroundColor: topic === '' ? 'var(--theme-bg-body)' : 'transparent',
                color: topic === '' ? COLOR : 'var(--theme-text-secondary)',
                boxShadow: topic === '' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
              Tất cả chủ đề
            </button>
            {data.availableTopics.map(t => (
              <button key={t} type="button" onClick={() => { setTopic(t); setPage(1); }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: topic === t ? 'var(--theme-bg-body)' : 'transparent',
                  color: topic === t ? COLOR : 'var(--theme-text-secondary)',
                  boxShadow: topic === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Không có video nào phù hợp.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onStart={() => handleStart(video.id)}
                isStarting={startingId === video.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                Trước
              </button>
              <span className="px-4 py-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {page}/{data.totalPages}
              </span>
              <button type="button" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                Tiếp
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
