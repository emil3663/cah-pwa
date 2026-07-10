/* ===== Cards Against Humanity — Service Worker ===== */

const CACHE_NAME = 'cah-v30';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=30',
  './app.js?v=30',
  './cards.js?v=30',
  './js/gemini.js?v=30',
  './prompts/praise.txt',
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
  const req = event.request;

  // Always try network first for app-shell navigations so installed launches
  // pick up new HTML and SW updates quickly.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', clone));
          return networkRes;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
