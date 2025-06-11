import router from '../src/routes/router.js';
import '../src/styles/styles.css';

// Fungsi untuk berpindah ke hash tertentu
export async function navigateTo(hash) {
  if (document.startViewTransition) {
    await document.startViewTransition(() => {
      window.location.hash = hash;
    });
  } else {
    window.location.hash = hash;
  }
}

// Fungsi untuk mendaftarkan Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Registering Service Worker...');
      
      // Gunakan sw.js untuk semua lingkungan
      const swPath = '/sw.js';
      
      // Register service worker
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker berhasil didaftarkan dengan scope:', registration.scope);
      
      // Pastikan service worker aktif
      if (registration.active) {
        console.log('Service Worker sudah aktif');
      } else {
        console.log('Menunggu Service Worker aktif...');
        // Tunggu hingga service worker aktif
        await new Promise(resolve => {
          if (registration.installing) {
            registration.installing.addEventListener('statechange', e => {
              if (e.target.state === 'activated') {
                console.log('Service Worker sekarang aktif');
                resolve();
              }
            });
          } else if (registration.waiting) {
            registration.waiting.addEventListener('statechange', e => {
              if (e.target.state === 'activated') {
                console.log('Service Worker sekarang aktif');
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      }
      
      return registration;
    } catch (error) {
      console.error('Registrasi Service Worker gagal:', error);
      return null;
    }
  } else {
    console.log('Service Worker tidak didukung di browser ini');
    return null;
  }
}

// Fungsi untuk mendeteksi status online/offline
function setupOnlineOfflineHandlers() {
  const updateOnlineStatus = () => {
    const statusElement = document.createElement('div');
    statusElement.id = 'online-status';
    statusElement.style.position = 'fixed';
    statusElement.style.top = '0';
    statusElement.style.left = '0';
    statusElement.style.right = '0';
    statusElement.style.padding = '10px';
    statusElement.style.textAlign = 'center';
    statusElement.style.zIndex = '1000';
    
    if (navigator.onLine) {
      statusElement.textContent = 'Anda kembali online!';
      statusElement.style.backgroundColor = '#d4edda';
      statusElement.style.color = '#155724';
      
      // Reload halaman untuk mendapatkan data terbaru
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      statusElement.textContent = 'Anda sedang offline. Menampilkan data tersimpan.';
      statusElement.style.backgroundColor = '#f8d7da';
      statusElement.style.color = '#721c24';
    }
    
    // Hapus notifikasi sebelumnya jika ada
    const existingStatus = document.getElementById('online-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    document.body.appendChild(statusElement);
    
    // Hapus notifikasi setelah beberapa detik
    setTimeout(() => {
      statusElement.remove();
    }, 3000);
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Cek status awal
  if (!navigator.onLine) {
    updateOnlineStatus();
  }
}

// Fungsi untuk memperbarui navigasi berdasarkan status login
window.updateNav = function() {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  
  // Elemen navigasi
  const navAddStory = document.getElementById('nav-add-story');
  const navStories = document.getElementById('nav-stories');
  const navBookmarks = document.getElementById('nav-bookmarks');
  const navLogin = document.getElementById('nav-login');
  const navRegister = document.getElementById('nav-register');
  const navLogout = document.getElementById('nav-logout');
  const navSubscribe = document.getElementById('nav-subscribe');
  
  // Update tampilan navigasi berdasarkan status login
  if (isLoggedIn) {
    // Menu untuk user yang sudah login
    navAddStory.classList.remove('hidden');
    navStories.classList.remove('hidden');
    navBookmarks.classList.remove('hidden');
    navLogout.classList.remove('hidden');
    navSubscribe.classList.remove('hidden');
    
    // Sembunyikan menu login dan register
    navLogin.classList.add('hidden');
    navRegister.classList.add('hidden');
  } else {
    // Menu untuk user yang belum login
    navAddStory.classList.add('hidden');
    navStories.classList.add('hidden');
    navBookmarks.classList.add('hidden');
    navLogout.classList.add('hidden');
    navSubscribe.classList.add('hidden');
    
    // Tampilkan menu login dan register
    navLogin.classList.remove('hidden');
    navRegister.classList.remove('hidden');
  }
};

// Fungsi untuk menangani logout
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Hapus token dari localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      
      // Update navigasi
      if (typeof window.updateNav === 'function') {
        window.updateNav();
      }
      
      // Redirect ke halaman home
      window.location.hash = '#home';
      
      // Tampilkan pesan
      alert('Logout berhasil!');
    });
  }
}

// Fungsi untuk setup tombol subscribe di navigasi
async function setupNavSubscribeButton() {
  const navSubscribeBtn = document.getElementById('nav-subscribe-push');
  if (!navSubscribeBtn) return;
  
  try {
    // Import langsung dari file yang sudah ada di window/global scope
    // karena notification-helper.js sudah diimpor di tempat lain
    if (!window.notificationHelper) {
      // Jika belum ada, buat objek kosong
      window.notificationHelper = {};
      
      // Coba dapatkan dari modul yang sudah dimuat
      const homePresenterModule = await import('../src/presenter/homePresenter.js');
      if (homePresenterModule) {
        // Ambil fungsi-fungsi yang dibutuhkan
        window.notificationHelper = {
          isCurrentPushSubscriptionAvailable,
          updateSubscriptionButtonText,
          togglePushNotification,
          subscribe,
          unsubscribe
        };
      }
    }
    
    // Gunakan fungsi dari window object
    const { 
      isCurrentPushSubscriptionAvailable, 
      updateSubscriptionButtonText, 
      togglePushNotification 
    } = window.notificationHelper;
    
    // Cek status langganan
    const isSubscribed = await isCurrentPushSubscriptionAvailable();
    
    // Update teks dan kelas tombol
    navSubscribeBtn.textContent = isSubscribed ? 'Unsubscribe Notification' : 'Subscribe Notification';
    
    if (isSubscribed) {
      navSubscribeBtn.classList.add('unsubscribe');
      navSubscribeBtn.classList.remove('subscribe');
    } else {
      navSubscribeBtn.classList.add('subscribe');
      navSubscribeBtn.classList.remove('unsubscribe');
    }
    
    // Tambahkan event listener
    navSubscribeBtn.onclick = async () => {
      navSubscribeBtn.disabled = true;
      navSubscribeBtn.textContent = 'Memproses...';
      
      try {
        await togglePushNotification(navSubscribeBtn);
        
        // Update teks tombol setelah toggle
        const newStatus = await isCurrentPushSubscriptionAvailable();
        navSubscribeBtn.textContent = newStatus ? 'Unsubscribe Notification' : 'Subscribe Notification';
        
        if (newStatus) {
          navSubscribeBtn.classList.add('unsubscribe');
          navSubscribeBtn.classList.remove('subscribe');
        } else {
          navSubscribeBtn.classList.add('subscribe');
          navSubscribeBtn.classList.remove('unsubscribe');
        }
      } catch (error) {
        console.error('Error toggling push notification:', error);
        alert('Gagal mengubah status langganan notifikasi');
      } finally {
        navSubscribeBtn.disabled = false;
      }
    };
  } catch (error) {
    console.error('Error setting up nav subscribe button:', error);
    navSubscribeBtn.textContent = 'Notifikasi tidak tersedia';
    navSubscribeBtn.disabled = true;
  }
}

// Panggil setupLogoutButton saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  setupLogoutButton();
  window.updateNav();
});

// Panggil juga saat router dijalankan
window.addEventListener('hashchange', () => {
  setTimeout(() => {
    setupLogoutButton();
    window.updateNav();
  }, 100); // Beri waktu untuk DOM diperbarui
});

// Panggil updateNav saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  window.updateNav();
});

// Inisialisasi aplikasi
async function initApp() {
  // Register service worker
  await registerServiceWorker();
  
  // Setup online/offline handlers
  setupOnlineOfflineHandlers();
  
  // Update navigasi berdasarkan status login
  if (typeof updateNav === 'function') {
    updateNav();
  }
  
  // Navigasi ke halaman yang sesuai dengan hash URL
  if (typeof navigateTo === 'function') {
    await navigateTo(window.location.hash || '#/');
  }
}

// Panggil fungsi inisialisasi saat halaman dimuat
window.addEventListener('load', initApp);
