// borrowed from https://developers.google.com/web/fundamentals/getting-started/primers/service-workers

var cacheName = 'sample-cache-v1';

var baseUrl = 'example.com';

var urlsToCache = [
    '/',
    '/js/index.js',
    '/css/index.css'
];

// If all the files are successfully cached, then the service worker will be installed.
// If any of the files fail to download, then the install step will fail
self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(cacheName)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// After a service worker is installed and the user navigates to a different page or refreshes,
// the service worker will begin to receive fetch events.
// If we want to cache new requests cumulatively, we can do so by handling the response of the fetch request and then adding it to the cache
self.addEventListener('fetch', function (event) {

    // cache only GET requests of same domain/subdomain
    if (event.request.method.toLowerCase() === "get"
        && event.request.url.indexOf(baseUrl) >= 0) {

        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }

                    // IMPORTANT: Clone the request. A request is a stream and
                    // can only be consumed once. Since we are consuming this
                    // once by cache and once by the browser for fetch, we need
                    // to clone the response.
                    var fetchRequest = event.request.clone();

                    return fetch(fetchRequest).then(
                        function (response) {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // IMPORTANT: Clone the response. A response is a stream
                            // and because we want the browser to consume the response
                            // as well as the cache consuming the response, we need
                            // to clone it so we have two streams.
                            var responseToCache = response.clone();

                            caches.open(cacheName)
                                .then(function (cache) {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        }
                    );
                })
        );
    }
});

// The following code would do this by looping through all of the caches in the service worker
// and deleting any caches that aren't defined in the cache whitelist
self.addEventListener('activate', function (event) {

    var cacheWhitelist = [cacheName];

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});