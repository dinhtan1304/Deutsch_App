'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDictationHistory, useDictationStats, useStartDictation, useDeleteDictation, useStartDictationFromUrl } from '@/hooks/useDictation';
import { dictationApi, DictationHistoryItem } from '@/lib/api/dictation';
import { ACCENT, STATUS } from '@/lib/tokens';

const GRADIENT = 'linear-gradient(135deg, #06B6D4, #3B82F6)';
const COLOR = '#06B6D4';

function getScoreColor(s: number) {
  if (s >= 80) return STATUS.success;
  if (s >= 60) return STATUS.warning;
  return STATUS.danger;
}

function IconMic({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

const CEFR_COLORS: Record<string, string> = {
  A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab,
};

function HistoryCard({ item, onDelete }: { item: DictationHistoryItem; onDelete: () => void }) {
  const [imgError, setImgError] = useState(false);
  const href = item.status === 'GRADED'
    ? `/practice-test/dictation/${item.id}/result`
    : `/practice-test/dictation/${item.id}`;

  return (
    <div className="relative group rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#06B6D450]"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
      <Link href={href} className="flex p-3 gap-4 items-center">
        {/* Thumbnail or icon */}
        <div className="w-32 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-gray-100">
          {imgError ? (
            <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
              <IconMic size={20} />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.video.thumbnailUrl ?? `https://img.youtube.com/vi/${item.video.youtubeId}/hqdefault.jpg`}
              alt={item.video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          )}
          
          {/* Level Badge */}
          <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded text-white shadow-sm"
            style={{ backgroundColor: CEFR_COLORS[item.difficulty] || ACCENT.vocab }}>
            {item.difficulty}
          </span>

          {/* Progress Bar (Ongoing) */}
          {item.status !== 'GRADED' && (
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
               {/* Giả lập progress 30% cho đẹp, logic thực tế cần backend trả về answeredCount */}
               <div className="h-full bg-[#06B6D4]" style={{ width: '30%' }}></div>
             </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <p className="text-sm font-semibold line-clamp-2 transition-colors group-hover:text-[#06B6D4]" style={{ color: 'var(--theme-text-primary)' }}>
            {item.video.title}
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--theme-text-muted)' }}>
            {item.video.topic ?? 'Chép chính tả'} · {item.totalBlanks} chỗ trống
          </p>
          <div className="flex items-center gap-2 mt-2">
            {item.status === 'GRADED' ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: getScoreColor(item.score ?? 0), backgroundColor: `${getScoreColor(item.score ?? 0)}15` }}>
                {item.score?.toFixed(1)}%
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-white"
                style={{ backgroundColor: ACCENT.srs }}>
                Đang làm
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Delete */}
      <button
        type="button"
        title="Xóa"
        onClick={e => { e.preventDefault(); onDelete(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-500 hover:text-white"
        style={{ backgroundColor: 'var(--theme-bg-body)', color: STATUS.danger, border: '1px solid var(--theme-border)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}

export default function DictationHubPage() {
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLevel, setUrlLevel] = useState<'A1' | 'A2' | 'B1'>('A2');
  const [urlError, setUrlError] = useState('');

  const { data: history, isLoading } = useDictationHistory({ limit: 20, cefrLevel: levelFilter || undefined });
  const { data: stats } = useDictationStats();
  const { mutate: deleteSession } = useDeleteDictation();
  const { mutate: startSession } = useStartDictation();
  const { mutate: startFromUrl, isPending: isLoadingUrl } = useStartDictationFromUrl();

  async function handleRandom() {
    setIsStarting(true);
    try {
      const video = await dictationApi.getRandom({ cefrLevel: levelFilter || undefined });
      startSession({ videoId: video.id }, {
        onSuccess: (session) => router.push(`/practice-test/dictation/${session.id}`),
        onSettled: () => setIsStarting(false),
      });
    } catch {
      setIsStarting(false);
    }
  }

  function handleStartFromUrl(e: React.FormEvent) {
    e.preventDefault();
    setUrlError('');
    if (!urlInput.trim()) return;
    startFromUrl({ youtubeUrl: urlInput.trim(), cefrLevel: urlLevel }, {
      onSuccess: (session) => router.push(`/practice-test/dictation/${session.id}`),
      onError: (err: any) => {
        setUrlError(err?.message ?? 'Không thể tải video. Hãy thử URL khác.');
      },
    });
  }

  return (
    <div className="py-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: GRADIENT }}>
          <IconMic size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Chép chính tả
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Nghe video YouTube tiếng Đức và điền từ còn thiếu
          </p>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="rounded-3xl border p-5 mb-8"
        style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Tổng số bài', value: stats.total },
              { label: 'Điểm trung bình', value: stats.graded > 0 ? `${stats.avgScore.toFixed(1)}%` : '—' },
              { label: 'Điểm cao nhất', value: stats.graded > 0 ? `${stats.bestScore.toFixed(1)}%` : '—' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border relative overflow-hidden group"
                style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-body)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.05), rgba(59,130,246,0.05))' }}></div>
                <p className="text-2xl font-black relative z-10" style={{ color: COLOR }}>{s.value}</p>
                <p className="text-xs mt-1 font-medium relative z-10" style={{ color: 'var(--theme-text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* URL input */}
        <form onSubmit={handleStartFromUrl}>
          <div className="flex items-center justify-between mb-3">
             <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
               Luyện tập từ URL YouTube bất kỳ
             </p>
             <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
               *Yêu cầu video có phụ đề tiếng Đức
             </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-[#06B6D4] focus-within:border-transparent transition-all"
                 style={{ borderColor: urlError ? '#EF4444' : 'var(--theme-border)', backgroundColor: 'var(--theme-bg-body)' }}>
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                placeholder="Dán link YouTube vào đây..."
                disabled={isLoadingUrl}
                className="flex-1 text-sm px-4 py-3 bg-transparent outline-none"
                style={{ color: 'var(--theme-text-primary)' }}
              />
              {/* Level picker */}
              <div className="flex border-l shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
                {(['A1', 'A2', 'B1'] as const).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setUrlLevel(l)}
                    className="px-4 py-3 text-xs font-bold transition-colors border-r last:border-r-0"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: urlLevel === l ? '#06B6D420' : 'transparent',
                      color: urlLevel === l ? COLOR : 'var(--theme-text-secondary)',
                    }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoadingUrl || !urlInput.trim()}
              className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: GRADIENT, minWidth: '120px' }}>
              {isLoadingUrl ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Đang tải
                </>
              ) : 'Bắt đầu'}
            </button>
          </div>
          {urlError && (
            <p className="text-xs mt-2 font-medium" style={{ color: '#EF4444' }}>{urlError}</p>
          )}
        </form>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center p-1 rounded-xl" style={{ backgroundColor: 'var(--theme-bg-card)' }}>
          {['', 'A1', 'A2', 'B1'].map(l => (
            <button key={l} type="button" onClick={() => setLevelFilter(l)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: levelFilter === l ? 'var(--theme-bg-body)' : 'transparent',
                color: levelFilter === l ? COLOR : 'var(--theme-text-secondary)',
                boxShadow: levelFilter === l ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
              {l || 'Tất cả'}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Link href="/practice-test/dictation/library"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors hover:bg-[#06B6D410]"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            Thư viện
          </Link>
          <button type="button" onClick={handleRandom} disabled={isStarting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-transform active:scale-95 hover:shadow-lg hover:shadow-[#06B6D440]"
            style={{ background: GRADIENT }}>
            {isStarting ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : '🎲 Ngẫu nhiên'}
          </button>
        </div>
      </div>

      {/* History */}
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--theme-text-muted)' }}>
        LỊCH SỬ LÀM BÀI
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLOR} strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : !history?.items.length ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Chưa có bài nào. Bắt đầu ngay với nút <strong>Ngẫu nhiên</strong>!
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {history.items.map(item => (
            <HistoryCard key={item.id} item={item} onDelete={() => deleteSession(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
