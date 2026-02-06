'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { useHistory, useClearHistory } from '@/hooks/useHistory';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';

// ─── Inline SVG Icons ───
function IconClock({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconTrash({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
function IconBook({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconLogIn({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}
function IconLoader({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default function HistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: history, isLoading, error } = useHistory();
  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const clearHistory = useClearHistory();

  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    try {
      await toggleFavorite(wordId, favoriteIds.has(wordId));
    } catch { /* ignore duplicate/not-found errors */ }
  };

  const handleClearHistory = async () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) await clearHistory.mutateAsync();
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
            <IconClock size={28} style={{ color: 'white' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Đăng nhập để xem lịch sử</h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>Tạo tài khoản để theo dõi lịch sử học tập</p>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            <IconLogIn size={16} /> Đăng nhập
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
              <IconClock size={22} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Lịch sử xem</h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Các từ bạn đã xem gần đây ({history?.length || 0} từ)
              </p>
            </div>
          </div>
          {history && history.length > 0 && (
            <button onClick={handleClearHistory} disabled={clearHistory.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ backgroundColor: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)' }}>
              {clearHistory.isPending ? <IconLoader size={14} /> : <IconTrash size={14} />} Xóa lịch sử
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && <div className="text-center py-12 text-[14px]" style={{ color: '#EF4444' }}>Lỗi tải dữ liệu.</div>}

        {/* Grid */}
        {history && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map(item => (
              <div key={item.id} className="relative">
                <div className="absolute -top-2 right-2 z-10 px-2 py-0.5 rounded-md text-[11px] font-medium"
                  style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                  {formatTimeAgo(item.viewedAt)}
                </div>
                <WordCard word={item.word} isFavorite={favoriteIds.has(item.wordId)} onFavoriteToggle={handleFavoriteToggle} />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && history && history.length === 0 && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
              <IconClock size={28} style={{ color: 'white' }} />
            </div>
            <h2 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Chưa có lịch sử</h2>
            <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>Các từ bạn xem sẽ xuất hiện ở đây</p>
            <Link href="/words"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <IconBook size={16} /> Xem từ điển
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}