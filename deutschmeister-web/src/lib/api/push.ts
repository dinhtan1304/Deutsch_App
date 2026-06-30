import { apiGet, apiPost } from './client';

export interface PushSubscribePayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

/** VAPID public key for `pushManager.subscribe` (null when push is disabled server-side). */
export function getVapidPublicKey(): Promise<{ key: string | null }> {
  return apiGet<{ key: string | null }>('/push/public-key');
}

export function subscribePush(sub: PushSubscribePayload): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/push/subscribe', sub);
}

export function unsubscribePush(endpoint: string): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/push/unsubscribe', { endpoint });
}
