// src/routes/router.js
let currentPageInstance = null;

// Fungsi untuk memuat modul dengan fallback untuk mode offline
async function loadModule(importFunc, fallbackView) {
  try {
    return await importFunc();
  } catch (error) {
    console.error('Error loading module:', error);
    
    // Jika offline dan terjadi error, tampilkan fallback
    if (!navigator.onLine) {
      return {
        default: fallbackView || OfflineView
      };
    }
    
    // Jika online tapi tetap error, lempar error
    throw error;
  }
}

// View fallback untuk mode offline
class OfflineView {
  constructor(container) {
    this.container = container;
  }
  
  async init() {
    this.container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h2>Mode Offline</h2>
        <p>Halaman ini tidak tersedia dalam mode offline.</p>
        <p>Silakan hubungkan ke internet untuk mengakses fitur ini.</p>
        <button id="try-again-btn" class="btn">Coba Lagi</button>
      </div>
    `;
    
    // Tambahkan event listener untuk tombol coba lagi
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
}

const routes = {
  '#/': () => loadModule(() => import('../views/home.js')),
  '#home': () => loadModule(() => import('../views/home.js')),
  '#stories': () => loadModule(() => import('../views/home.js')),
  '#add-story': () => loadModule(() => import('../presenter/addStoryPresenter.js'), OfflineAddStoryView),
  '#login': () => loadModule(() => import('../auth/login.js')),
  '#register': () => loadModule(() => import('../auth/register.js')),
  '#bookmarks': () => loadModule(() => import('../views/bookmarkView.js')),
  '#logout': () => {
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
    
    return loadModule(() => import('../views/home.js'));
  }
};

// View fallback untuk tambah cerita dalam mode offline
class OfflineAddStoryView {
  constructor(container) {
    this.container = container;
  }
  
  async init() {
    this.container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h2>Tambah Cerita</h2>
        <p>Fitur tambah cerita tidak tersedia dalam mode offline.</p>
        <p>Cerita yang Anda tambahkan perlu dikirim ke server.</p>
        <p>Silakan hubungkan ke internet untuk menggunakan fitur ini.</p>
        <button id="try-again-btn" class="btn">Coba Lagi</button>
      </div>
    `;
    
    // Tambahkan event listener untuk tombol coba lagi
    const tryAgainBtn = document.getElementById('try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
}

async function router() {
  const content = document.getElementById('main-content');
  const hash = window.location.hash || '#/';

  // Matikan kamera jika ada instance sebelumnya
  if (currentPageInstance && typeof currentPageInstance.stopCamera === 'function') {
    console.log('Router calling stopCamera on', currentPageInstance.constructor?.name || 'current page');
    currentPageInstance.stopCamera();
  }

  // Tambahan: Matikan kamera dari instance AddStoryView jika ada
  if (window.currentAddStoryView && typeof window.currentAddStoryView.stopCamera === 'function') {
    console.log('Router calling stopCamera on AddStoryView instance');
    window.currentAddStoryView.stopCamera();
  }

  // Update navigasi setiap kali router dipanggil
  if (typeof window.updateNav === 'function') {
    window.updateNav();
  }

  if (document.startViewTransition) {
    await document.startViewTransition(async () => {
      await loadRoute(hash, content);
    });
  } else {
    await loadRoute(hash, content);
  }
}

async function loadRoute(hash, container) {
  try {
    // Hapus instance lama
    if (currentPageInstance && typeof currentPageInstance.stopCamera === 'function') {
      currentPageInstance.stopCamera();
    }
    
    // Ambil modul berdasarkan hash
    const routeKey = Object.keys(routes).find(key => hash.startsWith(key)) || '#/';
    const module = await routes[routeKey]();
    
    // Buat instance baru
    if (module.default) {
      if (typeof module.default === 'function') {
        if (module.default.prototype && module.default.prototype.constructor) {
          // Class-based component
          currentPageInstance = new module.default(container);
          if (typeof currentPageInstance.init === 'function') {
            await currentPageInstance.init();
          }
        } else {
          // Function-based component
          currentPageInstance = await module.default(container);
        }
      }
    }
    
    // Simpan instance untuk diakses global
    window.currentPageInstance = currentPageInstance;
    
    console.log('Route loaded:', hash, 'Instance:', currentPageInstance?.constructor?.name || 'unknown');
  } catch (error) {
    console.error('Error loading route:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h3>Terjadi kesalahan</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

window.addEventListener('hashchange', async () => {
  await router();
});

window.addEventListener('load', async () => {
  await router();
});

// Tambahkan event listener untuk saat pengguna menutup tab/browser
window.addEventListener('beforeunload', () => {
  if (currentPageInstance && typeof currentPageInstance.stopCamera === 'function') {
    currentPageInstance.stopCamera();
  }
});

export default router;

export async function navigateTo(hash) {
  // Matikan kamera sebelum navigasi jika perlu
  if (currentPageInstance && typeof currentPageInstance.stopCamera === 'function') {
    currentPageInstance.stopCamera();
  }
  
  window.location.hash = hash;
  
  // Jika navigasi ke halaman stories, pastikan data dimuat ulang
  if (hash === '#stories' || hash === '#/') {
    // Tunggu sebentar agar router selesai memuat halaman
    setTimeout(() => {
      if (window.currentPageInstance && 
          typeof window.currentPageInstance.loadAndRenderStories === 'function') {
        window.currentPageInstance.loadAndRenderStories();
      }
    }, 100);
  }
}
