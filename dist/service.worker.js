const CACHE_NAME = 'klassia-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncAttendanceData());
  }
});

async function syncAttendanceData() {
  // Lógica para sincronizar datos con el servidor
  return new Promise(resolve => {
    // Simular sincronización
    setTimeout(() => {
      console.log('Datos sincronizados desde Service Worker');
      resolve();
    }, 2000);
  });
}