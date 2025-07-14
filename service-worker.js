const CACHE_NAME = 'fisio-quiz-v1';
const urlsToCache = [
  './', // Esto es crucial para que la página de inicio se almacene en caché
  'index.html',
  'style.css',
  'script.js',
  'mi_logo.png',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Blinker:wght@400;600&display=swap', // Fuentes de Google
  // Agrega aquí otras imágenes o recursos que uses
];

// Evento 'install': Se ejecuta cuando el Service Worker se instala
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
});

// Evento 'fetch': Intercepta las solicitudes de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve
        if (response) {
          return response;
        }
        // Si no está en caché, lo busca en la red
        return fetch(event.request)
          .catch(() => {
            // Si la red falla y no está en caché, puedes devolver una página offline
            // return caches.match('/offline.html'); // Opcional: crea una página offline
          });
      })
  );
});

// Evento 'activate': Se ejecuta cuando el Service Worker se activa
self.addEventListener('activate', event => {
  // Elimina cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});