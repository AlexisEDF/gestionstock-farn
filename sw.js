const CACHE_NAME = 'farn-stock-v1';
const urlsToCache = [
    './index.html',
    './style.css',
    './script.js',
    './logoapp.png'
];

// Installation : on met les fichiers en mémoire cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Utilisation : on lit la mémoire cache si pas de connexion
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});