// Import modul Workbox yang diperlukan
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Aktifkan logging di development
workbox.setConfig({ debug: false });

// Gunakan precaching untuk aset statis
workbox.precaching.precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/app.bundle.js', revision: '1' },
  { url: '/app.webmanifest', revision: '1' },
  { url: '/styles.css', revision: '1' },
  { url: '/index.js', revision: '1' },
  { url: '/offline.html', revision: '1' },
  { url: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png', revision: '1' },
  { url: '/assets/icon-128x128.png', revision: '1' },
  { url: '/assets/icon-512x512.png', revision: '1' }
]);

// Strategi Cache First untuk gambar
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
      }),
    ],
  })
);

// Strategi Stale While Revalidate untuk CSS dan JavaScript
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Strategi Network First untuk API
workbox.routing.registerRoute(
  ({ url }) => url.pathname.includes('/v1/stories'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 hari
      }),
    ],
  })
);

// Fallback untuk navigasi ke offline.html jika tidak ada koneksi
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  async () => {
    try {
      return await workbox.strategies.NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 25,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 minggu
          }),
        ],
      }).handle({ request: new Request('/') });
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);

// Event listener untuk push notification
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};

  // Pastikan event data bisa diparse ke JSON
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push message:', error);
    // Jika gagal parse JSON, gunakan text
    const textData = event.data ? event.data.text() : 'Ada update baru!';
    data = { 
      title: 'StoryShare App',
      options: { body: textData }
    };
  }

  const title = data.title || 'StoryShare App';
  const options = {
    body: data.options?.body || 'Ada cerita baru yang menunggu untuk Anda baca!',
    icon: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    badge: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    data: data.url || '/',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Event listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({type: 'window'}).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
