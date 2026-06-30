// DeutschMeister service worker — enables PWA install + light offline resilience.
// Strategy: cache-first for immutable static assets, network-first for navigations
// (with an offline cache fallback). Never touches API/auth/admin responses.
// Served as /service-worker.js (public/sw.js is gitignored by a leftover PWA rule).
const VERSION = 'v2';
const STATIC_CACHE = `dm-static-${VERSION}`;
const PAGE_CACHE = `dm-pages-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

// Paths that must always hit the network and never be cached.
function isBypassed(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/admin')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isBypassed(url)) return;

  // Navigations: network-first, fall back to cached page, then offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match('/');
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first with background refresh.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      })(),
    );
  }
});

// ── Web Push ──────────────────────────────────────────────────────────────
// Payload shape (from PushService): { title, body, icon?, url? }
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'DeutschMeister', {
      body: data.body || '',
      icon: data.icon || '/logo-192.png',
      badge: '/logo-192.png',
      data: { url: data.url || '/' },
    }),
  );
});

// Focus an existing tab on the target URL, else open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const hit = clientList.find((c) => c.url.includes(target));
      if (hit) return hit.focus();
      return self.clients.openWindow(target);
    }),
  );
});
