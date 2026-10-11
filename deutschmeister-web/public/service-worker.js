// DeutschMeister service worker — enables PWA install + light offline resilience.
// Strategy: cache-first for immutable static assets, network-first for navigations
// (with an offline cache fallback). Never touches API/auth/admin responses.
// Served as /service-worker.js (public/sw.js is gitignored by a leftover PWA rule).
const VERSION = 'v3-learning-2026-10';
const STATIC_CACHE = `dm-static-${VERSION}`;
const PAGE_CACHE = `dm-pages-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PAGE_CACHE);
    await cache.add('/offline.html');
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('dm-') && k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k)),
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
  const path = url.pathname.replace(/^\/(vi|en|de)(?=\/|$)/, '') || '/';
  return (
    /^\/(api|auth|admin|uploads)(\/|$)/.test(path) ||
    url.searchParams.has('_rsc') ||
    url.searchParams.has('token')
  );
}

async function boundedPut(name, request, response, limit) {
  if (!response.ok || response.type === 'opaque') return;
  const cache = await caches.open(name);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isBypassed(url) || request.headers.get('RSC') === '1') return;

  // Navigations: network-first, fall back to cached page, then offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const path = url.pathname.replace(/^\/(vi|en|de)(?=\/|$)/, '') || '/';
          // Only public shells can be stored. Never cache account pages or
          // personal server-rendered navigation responses across logins.
          if (['/', '/updates', '/offline-review'].includes(path) && !url.search) {
            await boundedPut(PAGE_CACHE, request, fresh.clone(), 12);
          }
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || await caches.match('/offline.html') || new Response('Offline', { status: 503 });
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
        await boundedPut(STATIC_CACHE, request, fresh.clone(), 300);
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
