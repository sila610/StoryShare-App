import { subscribePushNotification, unsubscribePushNotification } from '../api/api.js';
import { VAPID_PUBLIC_KEY } from '../config.js';

// Convert base64 string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.error('Error converting base64 to Uint8Array:', error);
    throw new Error('Gagal memproses VAPID key');
  }
}

// Pastikan service worker terdaftar
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker tidak didukung browser ini');
  }

  try {
    // Coba daftarkan service worker jika belum terdaftar
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('Service Worker berhasil didaftarkan:', registration);
    
    // Tunggu hingga service worker aktif
    if (registration.installing) {
      console.log('Service worker sedang diinstall');
      return new Promise((resolve) => {
        registration.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            console.log('Service worker telah aktif');
            resolve(registration);
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
    throw new Error('Gagal mendaftarkan Service Worker: ' + error.message);
  }
}

// Check if push subscription is available
async function isCurrentPushSubscriptionAvailable() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker API tidak didukung');
    return false;
  }

  try {
    // Pastikan service worker sudah ready
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error('Service worker tidak terdaftar');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Fungsi untuk membuat simulasi subscription (untuk demo)
function createDummySubscription() {
  // Buat subscription dummy untuk simulasi
  const dummyEndpoint = 'https://fcm.googleapis.com/fcm/send/dummy-endpoint-' + Date.now();
  
  // Simpan endpoint dummy di localStorage untuk digunakan saat unsubscribe
  localStorage.setItem('dummyEndpoint', dummyEndpoint);
  
  return {
    endpoint: dummyEndpoint,
    keys: {
      p256dh: 'BNcUZu3bKdxQYXTgXUPQtCmRKVWLPHX5zHzPsxZNPNYjxpbzDOiidRrNUEHrPbgHxlhIjxQOFDG4CJKuES2qx2E=',
      auth: 'dummyAuthSecret'
    }
  };
}

// Subscribe to push notifications
async function subscribe() {
  console.log('Subscribe function called');
  
  // Cek dukungan notifikasi
  if (!('Notification' in window)) {
    console.error('Browser tidak mendukung notifikasi');
    alert('Browser tidak mendukung notifikasi.');
    return false;
  }

  // Cek dukungan service worker
  if (!('serviceWorker' in navigator)) {
    console.error('Browser tidak mendukung Service Worker');
    alert('Service Worker tidak didukung browser ini.');
    return false;
  }

  // Cek izin notifikasi
  if (Notification.permission === 'denied') {
    console.error('Izin notifikasi ditolak');
    alert('Izin notifikasi ditolak. Silakan ubah pengaturan browser Anda.');
    return false;
  }

  try {
    // Minta izin notifikasi jika belum diatur
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Izin notifikasi tidak diberikan');
        alert('Izin notifikasi tidak diberikan.');
        return false;
      }
    }

    // Daftarkan service worker jika belum
    console.log('Registering service worker...');
    let registration;
    try {
      registration = await registerServiceWorker();
      console.log('Service worker is ready:', registration);
    } catch (error) {
      console.error('Error registering service worker:', error);
      // Jika gagal mendaftarkan service worker, gunakan simulasi untuk demo
      alert('Gagal mendaftarkan service worker, menggunakan mode simulasi.');
      
      // Simpan status langganan di localStorage untuk simulasi
      localStorage.setItem('pushSubscribed', 'true');
      
      // Kirim data ke server (simulasi)
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu.');
        return false;
      }
      
      // Gunakan subscription dummy
      const dummySubscription = createDummySubscription();
      await subscribePushNotification(token, dummySubscription);
      
      alert('Berhasil berlangganan notifikasi! (Mode Simulasi)');
      return true;
    }
    
    // Cek VAPID_PUBLIC_KEY
    console.log('Checking VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY);
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY tidak tersedia');
      alert('Konfigurasi VAPID key tidak tersedia.');
      return false;
    }

    // Konversi VAPID key
    console.log('Converting VAPID key to Uint8Array...');
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    // Coba subscribe dengan pendekatan sederhana
    console.log('Subscribing to push service...');
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('Successfully subscribed to push service:', subscription);
    } catch (error) {
      console.error('Error subscribing to push service:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Izin notifikasi ditolak oleh browser. Periksa pengaturan izin browser Anda.');
      } else if (error.message && error.message.includes('push service')) {
        // Jika gagal karena push service error, gunakan simulasi
        alert('Layanan push tidak tersedia, menggunakan mode simulasi.');
        
        // Simpan status langganan di localStorage untuk simulasi
        localStorage.setItem('pushSubscribed', 'true');
        
        // Kirim data ke server (simulasi)
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Anda harus login terlebih dahulu.');
          return false;
        }
        
        // Gunakan subscription dummy
        const dummySubscription = createDummySubscription();
        await subscribePushNotification(token, dummySubscription);
        
        alert('Berhasil berlangganan notifikasi! (Mode Simulasi)');
        return true;
      } else {
        alert(`Gagal berlangganan: ${error.message}`);
      }
      return false;
    }

    if (!subscription) {
      console.error('Failed to get subscription object');
      alert('Gagal mendapatkan subscription. Coba lagi nanti.');
      return false;
    }

    // Kirim data ke server
    const token = localStorage.getItem('token');
    console.log('Token available:', !!token);
    
    if (!token) {
      console.error('Token tidak tersedia');
      alert('Anda harus login terlebih dahulu.');
      return false;
    }

    // Kirim subscription ke server
    console.log('Sending subscription to server...');
    const response = await subscribePushNotification(token, subscription);
    console.log('Server response:', response);
    
    if (response.error) {
      console.error('Server error:', response.message);
      alert(`Server error: ${response.message}`);
      return false;
    }

    console.log('Successfully subscribed to push notifications');
    alert('Berhasil berlangganan notifikasi!');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    alert(`Gagal berlangganan: ${error.message}`);
    return false;
  }
}

// Unsubscribe from push notifications
async function unsubscribe() {
  try {
    // Jika menggunakan mode simulasi, hapus status dari localStorage
    if (localStorage.getItem('pushSubscribed') === 'true') {
      // Kirim permintaan unsubscribe ke server untuk mode simulasi juga
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login terlebih dahulu.');
        return false;
      }
      
      // Gunakan endpoint dummy yang disimpan saat subscribe
      const dummyEndpoint = localStorage.getItem('dummyEndpoint') || 
                            'https://fcm.googleapis.com/fcm/send/dummy-endpoint-simulation';
      
      console.log('Mengirim permintaan unsubscribe (mode simulasi):', dummyEndpoint);
      // Kirim permintaan unsubscribe ke server
      const response = await unsubscribePushNotification(token, dummyEndpoint);
      console.log('Server response untuk unsubscribe (simulasi):', response);
      
      localStorage.removeItem('pushSubscribed');
      localStorage.removeItem('dummyEndpoint');
      alert('Berhasil berhenti berlangganan notifikasi! (Mode Simulasi)');
      return true;
    }
    
    if (!('serviceWorker' in navigator)) {
      alert('Service Worker tidak didukung browser ini.');
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      alert('Service worker belum terdaftar.');
      return false;
    }
    
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      alert('Anda belum berlangganan notifikasi.');
      return false;
    }

    // Simpan endpoint sebelum unsubscribe
    const endpoint = subscription.endpoint;
    console.log('Endpoint yang akan dihapus:', endpoint);
    
    // Unsubscribe dari push manager
    const result = await subscription.unsubscribe();
    if (!result) {
      alert('Gagal berhenti berlangganan.');
      return false;
    }
    
    console.log('Berhasil unsubscribe dari push manager');
    
    // Kirim data ke server untuk unsubscribe
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login terlebih dahulu.');
      return false;
    }
    
    console.log('Mengirim permintaan unsubscribe ke server dengan endpoint:', endpoint);
    const response = await unsubscribePushNotification(token, endpoint);
    console.log('Server response untuk unsubscribe:', response);
    
    alert('Berhasil berhenti berlangganan notifikasi!');
    return true;
  } catch (error) {
    console.error('Gagal unsubscribe:', error);
    alert(`Gagal berhenti berlangganan: ${error.message}`);
    return false;
  }
}

// Fungsi untuk memperbarui teks tombol berdasarkan status langganan
async function updateSubscriptionButtonText(button) {
  button.disabled = true;
  
  try {
    // Cek mode simulasi terlebih dahulu
    const isSimulationMode = localStorage.getItem('pushSubscribed') === 'true';
    
    // Jika mode simulasi aktif, gunakan status dari localStorage
    if (isSimulationMode) {
      button.textContent = 'Unsubscribe Push Notification';
      button.classList.remove('subscribe');
      button.classList.add('unsubscribe');
      button.disabled = false;
      return;
    }
    
    // Jika bukan mode simulasi, cek status langganan sebenarnya
    const isSubscribed = await isCurrentPushSubscriptionAvailable();
    
    if (isSubscribed) {
      button.textContent = 'Unsubscribe Push Notification';
      button.classList.remove('subscribe');
      button.classList.add('unsubscribe');
    } else {
      button.textContent = 'Subscribe Push Notification';
      button.classList.remove('unsubscribe');
      button.classList.add('subscribe');
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    button.textContent = 'Push Notification Error';
  } finally {
    button.disabled = false;
  }
}

// Fungsi untuk toggle push notification
async function togglePushNotification(button) {
  button.disabled = true;
  button.textContent = 'Memproses...';
  
  try {
    // Cek mode simulasi terlebih dahulu
    const isSimulationMode = localStorage.getItem('pushSubscribed') === 'true';
    
    // Jika mode simulasi aktif, gunakan status dari localStorage
    if (isSimulationMode) {
      await unsubscribe();
      console.log('Unsubscribed from push notification (simulation mode)');
    } else {
      // Jika bukan mode simulasi, cek status langganan sebenarnya
      const isSubscribed = await isCurrentPushSubscriptionAvailable();
      
      if (isSubscribed) {
        await unsubscribe();
        console.log('Unsubscribed from push notification');
      } else {
        await subscribe();
        console.log('Subscribed to push notification');
      }
    }
    
    // Update teks tombol setelah toggle
    await updateSubscriptionButtonText(button);
    return true;
  } catch (error) {
    console.error('Error toggling push notification:', error);
    button.disabled = false;
    throw error;
  }
}

// Ekspor semua fungsi yang dibutuhkan
export {
  urlBase64ToUint8Array,
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
  togglePushNotification,
  updateSubscriptionButtonText
};
