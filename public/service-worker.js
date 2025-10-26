const CACHE_NAME = 'spartan-coaching-v1';
const RUNTIME_CACHE = 'spartan-runtime-v1';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/spartan-logo.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images, fonts)
  if (
    request.url.includes('/assets/') ||
    request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            // Don't cache if not a valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }
            // Clone and cache the response
            const responseToCache = fetchResponse.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseToCache));
            return fetchResponse;
          });
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
          // Return empty response for other assets when offline
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

  // Network-first strategy for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Network unavailable. Please check your connection.' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For everything else, try network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests, error for others
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
