import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precaching semua aset yang dibundle oleh webpack
precacheAndRoute(self.__WB_MANIFEST);

// Cache halaman HTML utama (jika file HTML belum ada di cache, maka akan dicoba dengan NetworkFirst)
registerRoute(
  ({ request }) => request.destination === 'document',  // Menangani permintaan halaman HTML
  new NetworkFirst({
    cacheName: 'html-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Caching untuk API
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',  // Ganti dengan URL API yang benar
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Caching untuk gambar (image)
registerRoute(
  ({ request }) => request.destination === 'image',  // Menangani permintaan gambar
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Caching font dari Google
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Caching untuk asset statis seperti gambar avatar, fontawesome, dll.
registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com' || url.origin.includes('fontawesome');
  },
  new CacheFirst({
    cacheName: 'static-assets-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Caching gambar peta atau map tiles jika Anda menggunakan map API
registerRoute(
  ({ url }) => url.origin.includes('maptiler'),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Event push notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'StoryShare App';
  const options = {
    body: data.options?.body || 'Ada cerita baru yang menunggu untuk Anda baca!',
    icon: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    badge: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    data: data.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)  // Menampilkan notifikasi
  );
});
