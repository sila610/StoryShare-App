import router from './routes/router.js';
import 'leaflet/dist/leaflet.css';

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

// Fungsi cek ketersediaan service worker
function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}

// Fungsi registrasi service worker
async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log('Service Worker API unsupported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.bundle.js');
    console.log('Service worker StoryShare App telah terpasang', registration);
  } catch (error) {
    console.log('Failed to install service worker:', error);
  }
}

// Matikan kamera saat tidak berada di halaman "Tambah Cerita"
async function stopCameraIfNotAddStoryPage() {
  // Pastikan ada instance dari halaman aktif
  if (window.currentPageInstance && window.location.hash !== '#add-story') {
    if (typeof window.currentPageInstance.stopCamera === 'function') {
      window.currentPageInstance.stopCamera(); // Mematikan kamera
      console.log('Kamera dimatikan karena tidak berada di halaman tambah cerita');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const skipLink = document.getElementById('skip-link');

  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      skipLink.style.display = 'inline-block';
      window.removeEventListener('keydown', handleFirstTab);
      window.addEventListener('mousedown', handleMouseDownOnce);
    }
  }

  function handleMouseDownOnce() {
    skipLink.style.display = 'none';
    window.removeEventListener('mousedown', handleMouseDownOnce);
    window.addEventListener('keydown', handleFirstTab);
  }

  window.addEventListener('keydown', handleFirstTab);
  window.addEventListener('mousedown', handleMouseDownOnce);

  skipLink.addEventListener('click', () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.focus();
  });

  function updateNav() {
    const token = localStorage.getItem('token');
    const loginMenus = ['nav-home', 'nav-add-story', 'nav-stories', 'nav-logout'];
    const logoutMenus = ['nav-login', 'nav-register'];

    if (token) {
      loginMenus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });
      logoutMenus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    } else {
      loginMenus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      logoutMenus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });
    }

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn && !logoutBtn.hasAttribute('data-listener')) {
      logoutBtn.addEventListener('click', async e => {
        e.preventDefault();
        if (window.currentPageInstance && typeof window.currentPageInstance.stopCamera === 'function') {
          window.currentPageInstance.stopCamera();
        }

        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        alert('Anda berhasil logout.');
        updateNav();
        await navigateTo('#login');
      });
      logoutBtn.setAttribute('data-listener', 'true');
    }
  }

  window.addEventListener('userLoggedIn', () => {
    updateNav();
  });

  window.updateNav = updateNav;

  updateNav();

  await registerServiceWorker();

  await router();

  if (sessionStorage.getItem('loginSuccess')) {
    alert('Login berhasil!');
    sessionStorage.removeItem('loginSuccess');
    updateNav();
  }

  window.addEventListener('hashchange', async () => {
    await stopCameraIfNotAddStoryPage(); // Matikan kamera jika tidak di halaman tambah cerita
    if (window.currentPageInstance && typeof window.currentPageInstance.stopCamera === 'function') {
      window.currentPageInstance.stopCamera();
    }
    await router();
  });

  console.log('Berhasil mendaftarkan service worker.');
});
