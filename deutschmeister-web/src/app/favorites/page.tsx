'use client';

import Link from 'next/link';
import { WordCard } from '@/components/words/WordCard';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api/client';
import { GRADIENT, STATUS } from '@/lib/tokens';
import { AuthGate, GridSkeleton } from '@/components/ui';
import {
  IconStar, IconBook, IconLogIn, IconRefresh, IconChevronLeft,
} from '@/components/ui/Icons';

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

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconStar size={28} className="text-white" />}
      gradient={GRADIENT.xp}
      title="Đăng nhập để xem yêu thích"
      description="Tạo tài khoản để lưu từ vựng yêu thích và xem lại bất cứ lúc nào."
    />
  );

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT.xp }}>
            <IconStar size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              Từ vựng yêu thích
            </h1>
            <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              Các từ đã lưu để ôn tập nhanh ({favorites?.length || 0} từ)
            </p>
          </div>
        </div>
        <Link href="/words"
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-body font-semibold transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
          <IconChevronLeft size={14} /> Từ điển
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <GridSkeleton cols={3} count={6} />

      )}

      {/* Error — Auth expired */}
      {error && isAuthError && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${STATUS.danger}33` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: `${STATUS.danger}14` }}>
            <IconLogIn size={24} style={{ color: STATUS.danger }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Phiên đăng nhập hết hạn</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>Vui lòng đăng nhập lại để xem từ vựng yêu thích</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/login?returnTo=/favorites"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: GRADIENT.action }}
              onClick={() => logout()}>
              <IconLogIn size={16} /> Đăng nhập lại
            </Link>
          </div>
        </div>
      )}

      {/* Error — Network/Server */}
      {error && !isAuthError && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed"
          style={{ borderColor: `${STATUS.danger}33` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: `${STATUS.danger}14` }}>
            <IconRefresh size={24} style={{ color: STATUS.danger }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Lỗi tải dữ liệu</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            {error instanceof ApiError ? error.message : 'Không thể kết nối đến máy chủ'}
          </p>
          <button onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
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
            style={{ background: GRADIENT.xp }}>
            <IconStar size={28} className="text-white" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>Chưa có từ yêu thích</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            Nhấn vào biểu tượng sao trên thẻ từ để lưu lại
          </p>
          <Link href="/words"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: GRADIENT.action }}>
            <IconBook size={16} /> Xem từ điển
          </Link>
        </div>
      )}
    </div>
  );
}
