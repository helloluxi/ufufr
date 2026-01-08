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
      caches.open(CACHE_NAME).then(cache => {
        urlsToCache.forEach(url => {
          fetch(url).then(response => cache.put(url, response)).catch(err => console.error(`Failed to update ${url}:`, err));
        });
      });
    }
  });