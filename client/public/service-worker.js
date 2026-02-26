const CACHE_NAME = 'spartan-coaching-v4';
const RUNTIME_CACHE = 'spartan-runtime-v4';
const OFFLINE_PAGE = '/offline.html';

const urlsToCache = [
  '/',
  '/offline.html',
  '/spartan-logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Failed to cache essential resources:', error);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests except for fonts and common CDN resources
  if (url.origin !== location.origin && !url.hostname.includes('googleapis') && !url.hostname.includes('gstatic')) {
    return;
  }

  // Network-first strategy for JS and CSS - always fetch fresh, fall back to cache offline
  if (request.url.match(/\.(js|css)(\?.*)?$/i) || request.url.includes('/assets/')) {
    event.respondWith(
      fetch(request)
        .then((fetchResponse) => {
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
            return fetchResponse;
          }
          const responseToCache = fetchResponse.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseToCache))
            .catch((error) => console.error('Failed to cache asset:', error));
          return fetchResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }

  // Cache-first strategy for images, fonts, and other true static assets
  if (
    request.url.includes('/attached_assets/') ||
    request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((fetchResponse) => {
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
              return fetchResponse;
            }
            const responseToCache = fetchResponse.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseToCache))
              .catch((error) => console.error('Failed to cache image:', error));
            return fetchResponse;
          });
        })
        .catch(() => {
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Network-first strategy for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseToCache))
              .catch((error) => console.error('Failed to cache API response:', error));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                error: 'Network unavailable',
                message: 'Please check your internet connection and try again.'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Network-first strategy for videos (bypass cache for range requests)
  if (request.url.match(/\.(mp4|webm|mov)$/i)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('Video unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }

  // Network-first strategy for HTML pages (with offline fallback)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && request.destination === 'document') {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseToCache))
            .catch((error) => console.error('Failed to cache page:', error));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.destination === 'document') {
            return caches.match(OFFLINE_PAGE);
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

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
