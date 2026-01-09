const CACHE_NAME = 'ufufr-260107';
const urlsToCache = [
    './',
    './alg.txt',
    './cube.css',
    './cube3.js',
    './favicon.svg',
    './index.html',
    './manifest.json',
    './mem.txt',
    './min2phase.js',
    './ufufr.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('message', event => {
    if (event.data === 'ud') {
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          return caches.open(CACHE_NAME);
        }).then(cache => {
          return Promise.all(
            urlsToCache.map(url => 
              fetch(url, { cache: 'reload' }).then(response => cache.put(url, response))
            )
          );
        }).then(() => {
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage('reload'));
          });
        })
      );
    }
  });