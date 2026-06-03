/* SIPILAH — Service Worker v14 production
 * Strategy: cache-first untuk semua asset lokal.
 * Bobot MobileNet lokal ikut dipre-cache agar demo offline tidak bergantung
 * pada fetch pertama saat "Latih Model" dibuka.
 */

const CACHE_NAME = 'sipilah-v45-prod-2026';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './js/sipilah-merge.js?v=audit-real-20260517',
  './js/bundle.js?v=audit-real-20260517',
  './js/sipilah-enhancements.js?v=features-v1',
  './js/sipilah-3t-map.js?v=audit-real-20260517',
  './js/sipilah-showcase.js?v=audit-real-20260517',
  './js/sipilah-branding.js?v=audit-real-20260517',
  './css/sipilah-mobile-fix.css?v=audit-real-20260517',
  './assets/logo-sipilah.png',
  './assets/logo-rjm.png',
  './assets/peta-indonesia-persis.svg',
  './css/style.css',
  './assets/icon-512.svg',
  './assets/screenshot-beranda.svg',
  './assets/screenshot-laporan.svg',
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
    if (event.request.mode === 'navigate') {
      try {
        const freshPage = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', freshPage.clone()).catch(() => {});
        return freshPage;
      } catch {
        const cachedPage = await caches.match('./index.html');
        if (cachedPage) return cachedPage;
      }
    }

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
