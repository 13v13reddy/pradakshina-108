const CACHE = 'pradakshina-v3';
const FILES = [
  './', './index.html', './styles.css?v=3', './app.js?v=3', './state.js?v=3', './manifest.webmanifest',
  './assets/icon.svg', './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable.png',
  './assets/fonts/instrument-serif-regular.ttf', './assets/fonts/instrument-serif-italic.ttf',
  './assets/fonts/dm-sans-regular.ttf', './assets/fonts/dm-sans-semibold.ttf',
];
const allowed = new Set(FILES.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('pradakshina-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('./index.html', self.registration.scope).href)));
  } else if (allowed.has(url.href)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
