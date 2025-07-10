const CACHE_VERSION = 8;
const STATIC_CACHE_NAME = `klassia-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `klassia-dynamic-v${CACHE_VERSION}`;

// Assets to cache on installation.
const assetsToCache = [
    '/',
    '/index.html',
    '/icon-192.png',
    '/portada1.png'
];

self.addEventListener('install', (event) => {
    // We don't call self.skipWaiting() here, to allow the user to trigger the update.
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
                    .filter(name => name.startsWith('klassia-') && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // For navigation requests, use a network-first strategy to get the latest HTML.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
            .catch(() => caches.match(event.request)) // Fallback to cache if network fails
            .catch(() => caches.match('/index.html')) // Fallback to index.html
        );
        return;
    }

    // For other requests (CSS, JS, images), use a cache-first strategy.
    event.respondWith(
        caches.match(event.request).then(cacheRes => {
            return cacheRes || fetch(event.request).then(fetchRes => {
                return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                    // Don't cache API calls or external modules
                    if (
                        !event.request.url.includes('generativelanguage.googleapis.com') &&
                        !event.request.url.includes('firestore.googleapis.com') &&
                        !event.request.url.includes('esm.sh')
                    ) {
                       cache.put(event.request.url, fetchRes.clone());
                    }
                    return fetchRes;
                })
            });
        }).catch(() => {
            // Optional: A fallback for images or other assets can be provided here.
        })
    );
});


self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});