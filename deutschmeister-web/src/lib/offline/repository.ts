import type { Progress, ReviewRating } from '@/types';

const DATABASE = 'dm-offline-learning-v1';
const OWNER_KEY = 'dm:offline-owner';
export interface OfflineDeck {
  ownerId: string;
  cards: Progress[];
  downloadedAt: string;
}
export interface OfflineReview {
  requestId: string;
  ownerId: string;
  wordId: string;
  rating: ReviewRating;
  expectedTotalReviews: number;
  blocked?: boolean;
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('decks', { keyPath: 'ownerId' });
      request.result.createObjectStore('outbox', { keyPath: 'requestId' });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
async function operation<T>(
  store: 'decks' | 'outbox',
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = action(transaction.objectStore(store));
    transaction.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    transaction.onabort = transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? request.error);
    };
  });
}
export function offlineOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}
export async function clearOfflineData() {
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* Storage is optional. */
  }
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['decks', 'outbox'], 'readwrite');
    transaction.objectStore('decks').clear();
    transaction.objectStore('outbox').clear();
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
export async function bindOfflineOwner(ownerId: string) {
  const previous = offlineOwner();
  if (previous && previous !== ownerId) await clearOfflineData();
  localStorage.setItem(OWNER_KEY, ownerId);
}
export const getOfflineDeck = (ownerId: string) =>
  operation<OfflineDeck | undefined>('decks', 'readonly', (store) =>
    store.get(ownerId),
  );
export const saveOfflineDeck = (deck: OfflineDeck) =>
  operation('decks', 'readwrite', (store) => store.put(deck));
export async function offlineOutbox(ownerId: string) {
  const all = await operation<OfflineReview[]>('outbox', 'readonly', (store) =>
    store.getAll(),
  );
  return all.filter((review) => review.ownerId === ownerId);
}
export async function queueOfflineReview(review: OfflineReview): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['decks', 'outbox'], 'readwrite');
    const decks = transaction.objectStore('decks');
    const request = decks.get(review.ownerId);
    request.onsuccess = () => {
      const deck = request.result as OfflineDeck | undefined;
      if (!deck?.cards.some((card) => card.wordId === review.wordId)) {
        transaction.abort();
        return;
      }
      transaction.objectStore('outbox').add(review);
      decks.put({
        ...deck,
        cards: deck.cards.filter((card) => card.wordId !== review.wordId),
      });
    };
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onabort = transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('Offline card changed'));
    };
  });
}
export const removeOfflineReview = (requestId: string) =>
  operation('outbox', 'readwrite', (store) => store.delete(requestId));
export const blockOfflineReview = (review: OfflineReview) =>
  operation('outbox', 'readwrite', (store) =>
    store.put({ ...review, blocked: true }),
  );
