const FILES = /* __FILES__ */ [];
const CACHE = 'una-manito-shell-__VERSION__';
const allowed = new Set(FILES);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('una-manito-shell-') && name !== CACHE).map(name => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  const path = request.mode === 'navigate' && url.pathname === '/' ? '/index.html' : url.pathname;
  if (!allowed.has(path)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(path)).then(cached => cached || fetch(request)));
});
