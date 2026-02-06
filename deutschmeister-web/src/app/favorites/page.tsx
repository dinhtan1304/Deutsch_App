'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { WordCard } from '@/components/words/WordCard';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api/client';

// ─── Inline SVG Icons ───
function IconStar({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
function IconRefresh({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function IconChevronLeft({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function FavoritesPage() {
  const { isAuthenticated, logout } = useAuthStore();
  const { data: favorites, isLoading, error, refetch } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const handleFavoriteToggle = async (wordId: string) => {
    try {
      await toggleFavorite(wordId, true);
    } catch { /* ignore errors */ }
  };

  const isAuthError = error instanceof ApiError && error.status === 401;

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
            <IconStar size={28} style={{ color: 'white' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Đăng nhập để xem yêu thích</h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--theme-text-muted)' }}>Tạo tài khoản để lưu từ vựng yêu thích</p>
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
              style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
              <IconStar size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Từ vựng yêu thích
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                Các từ đã lưu để ôn tập nhanh ({favorites?.length || 0} từ)
              </p>
            </div>
          </div>
          <Link href="/words"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={14} /> Từ điển
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--theme-bg-secondary)' }} />
            ))}
          </div>
        )}

        {/* Error — Auth expired */}
        {error && isAuthError && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'rgba(239,68,68,.2)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,.08)' }}>
              <IconLogIn size={24} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Phiên đăng nhập hết hạn</h2>
            <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>Vui lòng đăng nhập lại để xem từ vựng yêu thích</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                onClick={() => logout()}>
                <IconLogIn size={16} /> Đăng nhập lại
              </Link>
            </div>
          </div>
        )}

        {/* Error — Network/Server */}
        {error && !isAuthError && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'rgba(239,68,68,.2)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,.08)' }}>
              <IconRefresh size={24} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Lỗi tải dữ liệu</h2>
            <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>
              {error instanceof ApiError ? error.message : 'Không thể kết nối đến máy chủ'}
            </p>
            <button onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
              <IconRefresh size={16} /> Thử lại
            </button>
          </div>
        )}

        {/* Grid */}
        {favorites && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {favorites.map(fav => <WordCard key={fav.id} word={fav.word} isFavorite={true} onFavoriteToggle={handleFavoriteToggle} />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && favorites && favorites.length === 0 && (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
              <IconStar size={28} style={{ color: 'white' }} />
            </div>
            <h2 className="text-[16px] font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Chưa có từ yêu thích</h2>
            <p className="text-[13px] mb-5" style={{ color: 'var(--theme-text-muted)' }}>Nhấn vào biểu tượng ⭐ trên thẻ từ để lưu lại</p>
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