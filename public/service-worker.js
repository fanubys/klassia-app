const CACHE_VERSION = 11; // Incremented to force update
const STATIC_CACHE_NAME = `klassia-static-v${CACHE_VERSION}`;

// Assets to cache on installation.
const assetsToCache = [
    '/',
    '/index.html',
    '/icon-192.png',
    '/portada1.png',
    '/portada.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching App Shell');
            return cache.addAll(assetsToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name.startsWith('klassia-') && name !== STATIC_CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    return self.clients.claim();
});

// A safer fetch strategy to avoid caching API responses.
self.addEventListener('fetch', event => {
    const { request } = event;

    // For external modules or API calls (like Firestore), always go to the network.
    if (request.url.includes('esm.sh') || request.url.includes('googleapis.com')) {
        event.respondWith(fetch(request));
        return;
    }

    // For other requests (app shell, etc.), use a cache-first strategy.
    event.respondWith(
        caches.match(request).then(response => {
            // Return from cache if found, otherwise fetch from network.
            return response || fetch(request).catch(() => {
                // Optional: Provide a fallback if network fails for a cached item.
                // For now, it will just fail, which is fine for non-essential assets.
            });
        })
    );
});


self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
