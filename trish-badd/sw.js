const CACHE = 'trishbad-v2';
const BASE = '/Titles-by-Trish-/trish-badd/';
const STATIC = [
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('trishbad-') && k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Never cache cloud sync traffic
  if (url.origin !== self.location.origin) return;
  // Always fetch HTML and data (like weekly-ideas.json) fresh so updates show up right away;
  // fall back to the last saved copy when offline
  const isFresh = url.pathname.endsWith('.html')
    || url.pathname.endsWith('.json')
    || url.pathname.endsWith('/')
    || (e.request.headers.get('accept') || '').includes('text/html');
  if (isFresh) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
