/* ===== Cards Against Humanity — Service Worker ===== */

const CACHE_NAME = 'cah-v13';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=12',
  './app.js?v=12',
  './cards.js?v=12',
  './manifest.json',
  './icons/bot-skeeter.svg',
  './icons/bot-sally.svg',
  './icons/bot-linus.svg',
  './icons/deck-general-classic.svg',
  './icons/deck-general-edge.svg',
  './icons/deck-general-absurd.svg',
  './icons/deck-special-featured.svg',
  './icons/deck-special-chaos.svg',
  './icons/deck-special-apex.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
