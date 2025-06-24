const CACHE_NAME = 'nada';
const urlsToCache = [
    './',
    './index.html',
    './favicon.svg',
    './min2phase.js',
    './cube3.js',
];
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (!cacheWhitelist.includes(cache)) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});
self.addEventListener('message', event => {
    if (event.data === 'ud') {
      caches.open(CACHE_NAME).then(cache => {
        urlsToCache.forEach(url => {
          fetch(url).then(response => cache.put(url, response));
        });
      });
    }
  });
  