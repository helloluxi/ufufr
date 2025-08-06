const CACHE_NAME = 'ufufr-cache';
const urlsToCache = [
    './',
    './index.html',
    './favicon.svg',
    './min2phase.js',
    './cube3.js',
    './manifest.json'
];
const cachedServerEndpoints = ['mem', 'alg'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const isServerRequest = cachedServerEndpoints.some(endpoint => 
        url.pathname.endsWith(`/${endpoint}`)
    );
    
    if (isServerRequest) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => 
                cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(response => {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    });
                    return cachedResponse || fetchPromise;
                })
            )
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => 
                response || fetch(event.request)
            )
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(
                cacheNames.map(cache => 
                    cache !== CACHE_NAME ? caches.delete(cache) : null
                )
            )
        )
    );
});

self.addEventListener('message', event => {
    if (event.data === 'ud') {
        caches.delete(CACHE_NAME);
    }
});
  