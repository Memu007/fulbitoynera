// Service Worker — Pizarra Pro PWA
// Cachea el shell de la app para offline (entrenadores en cancha sin señal)
const CACHE = 'pizarra-pro-v1';
const ASSETS = [
  '/pizarra-pro.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/gif.js',
  '/gif.worker.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install: pre-cachear assets esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para HTML (siempre fresco), cache-first para assets estáticos
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // HTML: network-first con fallback a cache (para que offline cargue la última versión)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/pizarra-pro.html')))
    );
    return;
  }

  // Fonts y otros assets: cache-first
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('fonts'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
