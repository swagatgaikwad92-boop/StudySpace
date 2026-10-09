// Study Space service worker: caches the application shell so the desk opens offline.
// Cross-origin requests (YouTube, AI endpoints) are never cached or intercepted.
const VERSION = '1879242102';
const CACHE = `study-space-${VERSION}`;
const PRECACHE = /*__PRECACHE__*/["./", "./app.js", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./icon.svg", "./index.html", "./manifest.json", "./pdf.min.mjs", "./pdf.worker.min.mjs", "./style.css"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('study-space-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Navigations: network first (fresh shell), fall back to cached index.html offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Everything else: cache first, refresh in the background.
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
