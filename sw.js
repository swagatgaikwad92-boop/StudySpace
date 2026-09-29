/**
 * Study Space service worker — offline shell
 * Relative paths for GitHub Pages compatibility
 */

const CACHE_NAME = 'study-space-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './styles/tokens.css',
  './styles/glass.css',
  './styles/canvas.css',
  './styles/windows.css',
  './styles/controls.css',
  './styles/tools.css',
  './styles/pomodoro.css',
  './styles/dabsy.css',
  './styles/animations.css',
  './styles/responsive.css',
  './styles/accessibility.css',
  './scripts/app.js',
  './assets/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only same-origin
  if (url.origin !== self.location.origin) {
    // Network-first for CDN (PDF.js etc.) — fall through
    return;
  }

  // Navigation: network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
