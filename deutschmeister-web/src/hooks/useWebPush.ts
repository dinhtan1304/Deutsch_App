'use client';

import { useCallback, useEffect, useState } from 'react';
import { getVapidPublicKey, subscribePush, unsubscribePush } from '@/lib/api/push';

// VAPID public key is base64url — convert to the Uint8Array PushManager expects.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Web Push subscribe/unsubscribe lifecycle. Returns support + permission state
 * plus `enable`/`disable` that drive the browser subscription AND the backend
 * `/push/*` endpoints. The persisted `webPushEnabled` setting is managed by the
 * caller (Settings) based on the boolean these return.
 */
export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
    if (supported) setPermission(Notification.permission);
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const { key } = await getVapidPublicKey();
      if (!key) return false;

      // Register on demand — the install prompt only registers in production,
      // so this guarantees a ready SW for the subscribe flow.
      await navigator.serviceWorker.register('/service-worker.js').catch(() => null);
      const reg = await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }));

      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) return false;
      await subscribePush({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      });
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, [isSupported]);

  const disable = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint).catch(() => null);
        await sub.unsubscribe().catch(() => null);
      }
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, [isSupported]);

  return { isSupported, permission, busy, enable, disable };
}
