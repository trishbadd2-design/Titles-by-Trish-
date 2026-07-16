const CACHE = 'titlesbytrish-v5';
const STATIC = [
  '/Titles-by-Trish-/manifest.json',
  '/Titles-by-Trish-/icons/icon-192.png',
  '/Titles-by-Trish-/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Always fetch HTML fresh — covers .html, trailing /, and bare paths like /Titles-by-Trish-
  const isHtml = url.pathname.endsWith('.html')
    || url.pathname.endsWith('/')
    || url.pathname === '/Titles-by-Trish-'
    || (e.request.headers.get('accept') || '').includes('text/html');
  if (isHtml) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for icons and manifest only
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
