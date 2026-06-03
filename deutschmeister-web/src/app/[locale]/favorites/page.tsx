'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('vocabulary.favorites');
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
      title={t('authGate.title')}
      description={t('authGate.description')}
    />
  );

  return (
    <div className="max-w-360 mx-auto py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-md flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)', color: 'var(--warn)' }}>
            <IconStar size={22} />
          </div>
          <div>
            <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>
              {t('pageTitle')}
            </h1>
            <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
              {t('pageSubtitle', { count: favorites?.length ?? 0 })}
            </p>
          </div>
        </div>
        <Link href="/words"
          className="flex items-center gap-1 px-3 py-2 rounded-[10px] border text-body font-semibold transition-transform duration-200 hover:-translate-y-0.5 shrink-0"
          style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
          <IconChevronLeft size={14} /> {t('backToDictionary')}
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <GridSkeleton cols={3} count={6} />

      )}

      {/* Error — Auth expired */}
      {error && isAuthError && (
        <div className="text-center py-16 rounded-2xl border border-dashed"
          style={{ borderColor: `color-mix(in srgb, ${STATUS.danger} 33%, transparent)` }}>
          <div className="w-14 h-14 rounded-[14px] mx-auto flex items-center justify-center mb-4"
            style={{ background: `color-mix(in srgb, ${STATUS.danger} 14%, transparent)` }}>
            <IconLogIn size={24} style={{ color: STATUS.danger }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('sessionExpiredTitle')}</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>{t('sessionExpiredBody')}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/login?returnTo=/favorites"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[11px] text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
              onClick={() => logout()}>
              <IconLogIn size={16} /> {t('loginAgain')}
            </Link>
          </div>
        </div>
      )}

      {/* Error — Network/Server */}
      {error && !isAuthError && (
        <div className="text-center py-16 rounded-2xl border border-dashed"
          style={{ borderColor: `color-mix(in srgb, ${STATUS.danger} 33%, transparent)` }}>
          <div className="w-14 h-14 rounded-[14px] mx-auto flex items-center justify-center mb-4"
            style={{ background: `color-mix(in srgb, ${STATUS.danger} 14%, transparent)` }}>
            <IconRefresh size={24} style={{ color: STATUS.danger }} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('loadErrorTitle')}</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            {error instanceof ApiError ? error.message : t('loadErrorBody')}
          </p>
          <button onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}>
            <IconRefresh size={16} /> {t('retry')}
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
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-16 h-16 rounded-[16px] mx-auto flex items-center justify-center mb-4"
            style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)', color: 'var(--warn)' }}>
            <IconStar size={28} />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            {t('emptyBody')}
          </p>
          <Link href="/words"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[11px] text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
            <IconBook size={16} /> {t('viewDictionary')}
          </Link>
        </div>
      )}
    </div>
  );
}
