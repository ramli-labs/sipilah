/* SIPILAH — Service Worker v14 production
 * Strategy: cache-first untuk semua asset lokal.
 * Bobot MobileNet lokal ikut dipre-cache agar demo offline tidak bergantung
 * pada fetch pertama saat "Latih Model" dibuka.
 */

const CACHE_NAME = 'sipilah-v26-prod-2026';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './bundle.js?v=collab-real-20260517',
  './sipilah-3t-map.js?v=collab-real-20260517',
  './sipilah-showcase.js?v=collab-real-20260517',
  './sipilah-branding.js?v=collab-real-20260517',
  './sipilah-merge.js?v=collab-real-20260517',
  './sipilah-mobile-fix.css?v=collab-real-20260517',
  './logo-sipilah.png',
  './logo-rjm.png',
  './peta-indonesia-persis.svg',
  './style.css',
  './icon-192.svg',
  './icon-512.svg',
  './mobilenet/model.json',
  './mobilenet/group1-shard1of1.bin',
];

/* Domain bobot MobileNet — di-cache otomatis saat pertama kali di-fetch */
const MOBILENET_HOSTS = ['tfhub.dev', 'storage.googleapis.com', 'www.kaggle.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL).catch(e => console.warn('[SW] app shell:', e));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  event.respondWith((async () => {
    /* Cache-first untuk app shell + asset lokal */
    const cached = await caches.match(event.request);
    if (cached) return cached;

    /* Network, lalu simpan ke cache jika asset penting (lokal atau MobileNet weights) */
    try {
      const fresh = await fetch(event.request);
      const sameOrigin = url.origin === self.location.origin;
      const isMobilenet = MOBILENET_HOSTS.some(h => url.hostname.endsWith(h));

      if (fresh && fresh.status === 200 && (sameOrigin || isMobilenet)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      throw new Error('Offline: resource not cached');
    }
  })());
});

/* Pesan dari halaman: minta SW pre-warm cache MobileNet
   (dipakai tombol "Siapkan untuk Offline" di UI) */
self.addEventListener('message', event => {
  if (event.data?.type === 'PREFETCH_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(event.data.urls.map(async u => {
        try {
          const url = new URL(u, self.location.href);
          const sameOrigin = url.origin === self.location.origin;
          const res = await fetch(url.href, sameOrigin ? {} : { mode: 'no-cors' });
          await cache.put(url.href, res);
        } catch {
          return null;
        }
      }));
    })());
  }
});
