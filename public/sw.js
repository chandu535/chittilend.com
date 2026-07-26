/*
 * Service worker for SriPay.
 *
 * Its job is to make the app installable and to start fast — not to work offline. This
 * app is about money, and a cached balance is a wrong balance: every server function call
 * goes straight to the network, always, with no cache in front of it. If the network is
 * down the app says so, which is the honest answer.
 *
 * So the only things cached are the build's own static assets, which are content-hashed
 * and therefore safe to keep forever, plus a small offline page for navigations that
 * cannot reach the server.
 */
const VERSION = 'sripay-v1';
const ASSETS = `${VERSION}-assets`;
const SHELL = `${VERSION}-shell`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icon-192.png', '/manifest.json']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

// Lets a new build take over without the user having to kill the app.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/')
    || /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never come between the app and its data. Server functions, and anything that looks
  // like an API, always go to the network so what is on screen is what is in the database.
  if (url.pathname.startsWith('/_serverFn') || url.pathname.startsWith('/api/')) return;

  // Hashed build output: safe to serve from cache, since a new build means a new filename.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy));
        }
        return response;
      })),
    );
    return;
  }

  // Pages are server-rendered per request and can carry signed-in content, so they are
  // never cached — the offline page stands in when the network cannot be reached.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then(
        (hit) => hit || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }),
      )),
    );
  }
});
