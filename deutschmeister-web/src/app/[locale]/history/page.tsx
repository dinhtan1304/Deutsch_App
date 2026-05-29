'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WordCard } from '@/components/words/WordCard';
import { useHistory, useClearHistory } from '@/hooks/useHistory';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/lib/api/client';
import { formatTimeAgo } from '@/lib/utils';
import { GRADIENT, STATUS } from '@/lib/tokens';
import { AuthGate, GridSkeleton } from '@/components/ui';
import {
  IconClock, IconTrash, IconBook, IconLogIn, IconLoader, IconRefresh, IconChevronLeft, IconX,
} from '@/components/ui/Icons';

export default function HistoryPage() {
  const t = useTranslations('progress.history');
  const { isAuthenticated, logout } = useAuthStore();
  const { data: history, isLoading, error, refetch } = useHistory();
  const { data: favorites } = useFavorites();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const clearHistory = useClearHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.wordId) || []), [favorites]);
  const handleFavoriteToggle = async (wordId: string) => {
    try {
      await toggleFavorite(wordId, favoriteIds.has(wordId));
    } catch { /* ignore duplicate/not-found errors */ }
  };

  const handleClearHistory = async () => {
    await clearHistory.mutateAsync();
    setConfirmClear(false);
  };

  const isAuthError = error instanceof ApiError && error.status === 401;

  if (!isAuthenticated) return (
    <AuthGate
      icon={<IconClock size={28} className="text-white" />}
      gradient={GRADIENT.history}
      title={t('authGateTitle')}
      description={t('authGateBody')}
    />
  );

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: GRADIENT.history }}>
            <IconClock size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
              {t('pageTitle')}
            </h1>
            <p className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {t('pageSubtitle', { count: history?.length ?? 0 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history && history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={clearHistory.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-body font-semibold
                        transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              style={{
                backgroundColor: `${STATUS.danger}14`,
                color: STATUS.danger,
                border: `1px solid ${STATUS.danger}33`,
              }}>
              {clearHistory.isPending ? <IconLoader size={14} /> : <IconTrash size={14} />}
              {t('clearHistory')}
            </button>
          )}

          <Link href="/words"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-body font-semibold
                      transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
            <IconChevronLeft size={14} /> {t('backToDictionary')}
          </Link>
        </div>
      </div>

      {/* Inline confirmation dialog */}
      {confirmClear && (
        <div className="mb-6 rounded-2xl border-2 p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: `${STATUS.danger}40`, backgroundColor: `${STATUS.danger}08` }}
          role="alert">
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--theme-text-primary)' }}>
              {t('confirmTitle')}
            </p>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              {t('confirmBody')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmClear(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-body font-semibold transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              <IconX size={13} /> {t('cancel')}
            </button>
            <button
              onClick={handleClearHistory}
              disabled={clearHistory.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-body font-semibold text-white
                        transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: STATUS.danger }}>
              {clearHistory.isPending ? <IconLoader size={14} /> : <IconTrash size={14} />}
              {t('confirmClear')}
            </button>
          </div>
        </div>
      )}

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
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('sessionExpiredTitle')}</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>{t('sessionExpiredBody')}</p>
          <Link href="/auth/login?returnTo=/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: GRADIENT.action }}
            onClick={() => logout()}>
            <IconLogIn size={16} /> {t('loginAgain')}
          </Link>
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
      {history && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {history.map(item => (
            <div key={item.id} className="relative">
              <div className="absolute -top-2 right-2 z-10 px-2 py-0.5 rounded-md text-caption font-medium"
                style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                {formatTimeAgo(item.viewedAt)}
              </div>
              <WordCard word={item.word} isFavorite={favoriteIds.has(item.wordId)} onFavoriteToggle={handleFavoriteToggle} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && history && history.length === 0 && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: GRADIENT.history }}>
            <IconClock size={28} className="text-white" />
          </div>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>{t('emptyTitle')}</h2>
          <p className="text-body mb-5" style={{ color: 'var(--theme-text-muted)' }}>{t('emptyBody')}</p>
          <Link href="/words"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: GRADIENT.action }}>
            <IconBook size={16} /> {t('viewDictionary')}
          </Link>
        </div>
      )}
    </div>
  );
}
