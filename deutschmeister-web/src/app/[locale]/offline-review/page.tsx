'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { progressApi } from '@/lib/api/progress';
import {
  bindOfflineOwner,
  getOfflineDeck,
  offlineOutbox,
  offlineOwner,
  queueOfflineReview,
  removeOfflineReview,
  saveOfflineDeck,
} from '@/lib/offline/repository';
import { syncOfflineReviews } from '@/lib/offline/sync';
import type { ReviewRating } from '@/types';
import { ACCENT } from '@/lib/tokens';

export default function OfflineReviewPage() {
  const t = useTranslations('common.offline');
  const locale = useLocale();
  const userId = useAuthStore((s) => s.user?.id);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const queryClient = useQueryClient();
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['offline-deck'] });
  }, [queryClient]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnerId(userId ?? offlineOwner());
    window.addEventListener('dm:offline-changed', refresh);
    return () => window.removeEventListener('dm:offline-changed', refresh);
  }, [userId, refresh]);
  const query = useQuery({
    queryKey: ['offline-deck', ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const [deck, outbox] = await Promise.all([
        getOfflineDeck(ownerId!),
        offlineOutbox(ownerId!),
      ]);
      return { deck, outbox };
    },
    retry: false,
  });
  const download = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Login required');
      await bindOfflineOwner(userId);
      if ((await offlineOutbox(userId)).length)
        throw new Error(t('pendingBeforeDownload'));
      const cards = await progressApi.getDue(100);
      if (useAuthStore.getState().user?.id !== userId)
        throw new Error('Account changed');
      await saveOfflineDeck({
        ownerId: userId,
        cards,
        downloadedAt: new Date().toISOString(),
      });
    },
    onSuccess: refresh,
  });
  const sync = useMutation({
    mutationFn: async () => {
      if (userId) await syncOfflineReviews(userId);
    },
    onSuccess: refresh,
  });
  const pendingIds = new Set(query.data?.outbox.map((review) => review.wordId));
  const cards =
    query.data?.deck?.cards.filter(
      (card) =>
        !pendingIds.has(card.wordId) &&
        (card.totalReviews === 0 || new Date(card.nextReviewAt) <= new Date()),
    ) ?? [];
  const card = cards[0];
  const rate = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      if (!ownerId || !card) return;
      await queueOfflineReview({
        requestId: crypto.randomUUID(),
        ownerId,
        wordId: card.wordId,
        rating,
        expectedTotalReviews: card.totalReviews,
      });
    },
    onSuccess: () => {
      setRevealed(false);
      refresh();
      if (userId) void syncOfflineReviews(userId);
    },
  });
  const discard = useMutation({
    mutationFn: async () => {
      for (const review of query.data?.outbox ?? [])
        if (review.blocked) await removeOfflineReview(review.requestId);
    },
    onSuccess: refresh,
  });
  const blocked =
    query.data?.outbox.filter((review) => review.blocked).length ?? 0;
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-h1 font-semibold">{t('title')}</h1>
      <p style={{ color: 'var(--theme-text-muted)' }}>{t('intro')}</p>
      <Card className="space-y-4">
        <p>
          {t('status', {
            cards: cards.length,
            pending: query.data?.outbox.length ?? 0,
          })}
        </p>
        <div className="flex flex-wrap gap-3">
          {userId ? (
            <>
              <Button
                onClick={() => download.mutate()}
                disabled={download.isPending || rate.isPending}
              >
                {t(download.isPending ? 'downloading' : 'download')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                {t('sync')}
              </Button>
            </>
          ) : (
            <Link href="/auth/login" style={{ color: ACCENT.brand }}>
              {t('login')}
            </Link>
          )}
        </div>
        {download.isError && <p role="alert">{download.error.message}</p>}
        {query.isError && <p role="alert">{t('storageError')}</p>}
      </Card>
      {blocked > 0 && (
        <Card className="space-y-4">
          <p>{t('conflicts', { count: blocked })}</p>
          <Button
            variant="secondary"
            disabled={discard.isPending}
            onClick={() => discard.mutate()}
          >
            {t('discard')}
          </Button>
        </Card>
      )}
      {card ? (
        <Card className="space-y-6 text-center">
          <p className="text-h2 font-semibold" lang="de">
            {card.word.article} {card.word.word}
          </p>
          {revealed ? (
            <>
              <p className="text-lead">
                {locale === 'vi'
                  ? card.word.translationVi || card.word.translationEn
                  : card.word.translationEn}
              </p>
              {card.word.examples?.[0] && (
                <p lang="de">{card.word.examples[0]}</p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                {(['again', 'hard', 'good', 'easy'] as const).map((rating) => (
                  <Button
                    key={rating}
                    variant="secondary"
                    disabled={rate.isPending || download.isPending}
                    onClick={() => rate.mutate(rating)}
                  >
                    {t(`ratings.${rating}`)}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <Button onClick={() => setRevealed(true)}>{t('reveal')}</Button>
          )}
          {rate.isError && <p role="alert">{t('saveError')}</p>}
        </Card>
      ) : (
        <Card>
          <p>{t(query.data?.deck ? 'finished' : 'empty')}</p>
        </Card>
      )}
      <p className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
        {t('privacy')}
      </p>
      <Link href="/learning-session" style={{ color: ACCENT.brand }}>
        {t('back')}
      </Link>
    </main>
  );
}
