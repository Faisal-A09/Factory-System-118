/* Aqwat service worker — offline cache (app shell + modules + vendor).
   Cache-first for local assets; network passthrough for anything else. */
const CACHE = 'aqwat-v1';
const ASSETS = [
  './', './index.html', './css/main.css',
  './js/store.js', './js/i18n.js', './js/registry.js', './js/quiz-data.js',
  './js/quiz.js', './js/cert.js', './js/search.js', './js/analytics.js',
  './js/maintenance.js', './js/assistant.js', './js/practice.js', './js/equipment.js',
  './js/app.js',
  './vendor/three.min.js',
  './modules/ele.html', './modules/aws.html', './modules/mr4.html',
  './modules/hatchback.html', './modules/poultry.html',
  './.nojekyll'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // same-origin: cache-first, then network, and cache the response
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
  }
  // cross-origin (CDN fonts/libs): try cache, else network, else nothing
  else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => hit)));
  }
});
