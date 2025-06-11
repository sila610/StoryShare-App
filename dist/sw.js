// Service Worker tanpa ketergantungan eksternal
console.log('Service Worker Version 1.1 Loaded');

// Versi cache
const CACHE_NAME = 'story-app-v7';

// Daftar aset statis yang akan di-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.webmanifest',
  '/styles.css',
  '/index.js',
  '/offline.html',
  '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
  '/assets/icon-128x128.png',
  '/assets/icon-512x512.png',
  '/assets/place_24dp_5985E1.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
];

// Event listener untuk install
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  // Tunggu hingga cache selesai
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(STATIC_ASSETS)
          .catch(error => {
            console.error('Failed to cache some assets:', error);
            // Lanjutkan meskipun beberapa aset gagal di-cache
            return cache.addAll([
              '/',
              '/index.html',
              '/app.bundle.js',
              '/app.webmanifest',
              '/styles.css',
              '/index.js',
              '/offline.html',
              '/assets/place_24dp_5985E1.png'
            ]);
          });
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
      })
  );
});

// Event listener untuk aktivasi service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  // Claim clients agar service worker langsung mengontrol halaman
  event.waitUntil(self.clients.claim());
  
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Service Worker: Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Event listener untuk fetch
self.addEventListener('fetch', (event) => {
  console.log('Fetch event for:', event.request.url);
  
  // Jika request adalah untuk halaman HTML atau navigasi
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/')
        .then(response => {
          return response || fetch(event.request)
            .catch(() => {
              console.log('Navigation fetch failed, returning offline page');
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Untuk semua request lainnya, gunakan strategi Cache First
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Jika ada di cache, kembalikan dari cache
        if (cachedResponse) {
          console.log('Found in cache:', event.request.url);
          return cachedResponse;
        }
        
        // Jika tidak ada di cache, coba ambil dari jaringan
        console.log('Not in cache, fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Jika berhasil, simpan ke cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch((error) => {
            console.log('Fetch failed:', error);
            
            // Jika permintaan adalah untuk API
            if (event.request.url.includes('/v1/stories')) {
              return new Response(JSON.stringify({
                error: false,
                message: 'Anda sedang offline. Menampilkan data tersimpan.',
                listStory: []
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Fallback default
            return new Response('Offline: Konten tidak tersedia.', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Event listener untuk push notification
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  let title = 'StoryShare App';
  let body = 'Ada cerita baru yang menunggu untuk Anda baca!';
  let url = '/';

  // Pastikan event data bisa diparse ke JSON
  try {
    // Coba parse sebagai JSON
    data = event.data ? event.data.json() : {};
    console.log('Push data parsed as JSON:', data);
    
    title = data.title || title;
    body = data.options?.body || body;
    url = data.url || url;
  } catch (error) {
    console.error('Error parsing push message as JSON:', error);
    
    // Jika gagal parse JSON, gunakan text
    try {
      const textData = event.data ? event.data.text() : 'Ada update baru!';
      console.log('Raw text data:', textData);
      body = textData;
    } catch (e) {
      console.error('Failed to get text data too:', e);
    }
  }

  const options = {
    body: body,
    icon: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    badge: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    data: url,
  };
  
  console.log('Showing notification with:', { title, options });
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('Notification shown successfully'))
      .catch(err => console.error('Error showing notification:', err))
  );
});

// Event listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  console.log('Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({type: 'window'}).then((windowClients) => {
      // Cek apakah ada jendela yang sudah terbuka
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak ada jendela yang terbuka, buka jendela baru
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
