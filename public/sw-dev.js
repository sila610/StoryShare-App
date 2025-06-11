// Service worker untuk mode development
console.log('Service Worker Development Version Loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Gunakan strategi network-first sederhana untuk development
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        console.log('Fetch failed, returning offline page');
        return new Response('Offline mode: Network request failed');
      })
  );
});

// Event listener untuk push notification
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};

  // Pastikan event data bisa diparse ke JSON
  try {
    data = event.data ? event.data.json() : {};  // Parsing JSON
    console.log('Push data parsed:', data);
  } catch (error) {
    console.error('Error parsing push message:', error);
    // Jika gagal parse JSON, gunakan text
    try {
      const textData = event.data ? event.data.text() : 'Ada update baru!';
      console.log('Raw text data:', textData);
      
      // Coba parse lagi jika text mungkin JSON dengan format yang salah
      if (textData.includes('{') && textData.includes('}')) {
        try {
          // Coba bersihkan dan parse sebagai JSON
          const cleanedText = textData.replace(/[\n\r\t]/g, '').trim();
          data = JSON.parse(cleanedText);
          console.log('Successfully parsed cleaned JSON:', data);
        } catch (e) {
          console.log('Still failed to parse as JSON after cleaning');
          // Gunakan sebagai teks biasa
          data = { 
            title: 'StoryShare App',
            options: { body: textData }
          };
        }
      } else {
        // Gunakan sebagai teks biasa
        data = { 
          title: 'StoryShare App',
          options: { body: textData }
        };
      }
      console.log('Using text data instead:', data);
    } catch (e) {
      console.error('Failed to get text data too:', e);
      data = { 
        title: 'StoryShare App',
        options: { body: 'Ada update baru!' }
      };
    }
  }

  const title = data.title || 'StoryShare App';
  const options = {
    body: data.options?.body || 'Ada cerita baru yang menunggu untuk Anda baca!',
    icon: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    badge: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png',
    data: data.url || '/',
  };

  console.log('Showing notification with:', { title, options });
  
  event.waitUntil(
    self.registration.showNotification(title, options)  // Menampilkan notifikasi
      .then(() => console.log('Notification shown successfully'))
      .catch(err => console.error('Error showing notification:', err))
  );
});

// Event listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Buka URL yang disertakan dalam notifikasi
  const urlToOpen = event.notification.data || '/';

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



