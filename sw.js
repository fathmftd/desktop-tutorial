// Service worker: cache aplikasi agar bisa dibuka offline setelah kunjungan pertama.
const CACHE = 'absensi-bem-v4';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './data-anggota.js',
    './icons/logo.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    './vendor/tailwind.css',
    './vendor/html5-qrcode.min.js',
    './vendor/qrcode-generator.js',
    './vendor/jszip.min.js',
    './vendor/fontawesome/css/all.min.css',
    './vendor/fontawesome/webfonts/fa-solid-900.woff2',
    './vendor/fontawesome/webfonts/fa-regular-400.woff2'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

// Network first, fallback ke cache (termasuk library CDN yang pernah dimuat).
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(cache => cache.put(event.request, copy));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});
