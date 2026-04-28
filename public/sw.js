/* =============================================================================
   service worker (sw.js)
   =============================================================================
   This file is what makes Flight Tracker a real PWA. It runs in the
   background and caches the app's "shell" (HTML/CSS/JS) so that:

     - The app loads instantly on repeat visits (cache-first for assets)
     - The app still opens when offline (with stale data, of course)
     - API calls always hit the network when online (network-first for /api/*)

   It's kept intentionally simple. No fancy build-step magic — just standard
   Service Worker API calls that any browser supports.

   To bust the cache after a deploy, bump CACHE_VERSION below.
   ============================================================================= */

const CACHE_VERSION = 'flight-tracker-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ----- install: cache the app shell --------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ----- activate: clean up old caches -------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ----- fetch: choose strategy based on URL -------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GETs from our own origin.
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // /api/* -> network first, fall back to cache if offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Everything else (HTML / JS / CSS / images) -> cache first.
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    // Offline + nothing cached -> return a basic offline fallback for HTML.
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
