import { ApiError, apiPost } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import {
  blockOfflineReview,
  offlineOutbox,
  offlineOwner,
  removeOfflineReview,
} from './repository';

let inFlight: Promise<void> | null = null;
export function syncOfflineReviews(ownerId: string): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    for (const review of await offlineOutbox(ownerId)) {
      if (
        !navigator.onLine ||
        useAuthStore.getState().user?.id !== ownerId ||
        offlineOwner() !== ownerId
      )
        break;
      if (review.blocked) continue;
      try {
        await apiPost('/progress/offline-review', {
          wordId: review.wordId,
          rating: review.rating,
          expectedTotalReviews: review.expectedTotalReviews,
          requestId: review.requestId,
        });
        await removeOfflineReview(review.requestId);
      } catch (error) {
        if (error instanceof ApiError && [404, 409].includes(error.status)) {
          await blockOfflineReview(review);
          continue;
        }
        break; // Preserve the receipt id across timeouts, offline and server failures.
      }
    }
  })().finally(() => {
    inFlight = null;
    window.dispatchEvent(new Event('dm:offline-changed'));
  });
  return inFlight;
}
