// src/presenter/homePresenter.js
import * as model from '../model/storyModel.js';
import { initMapWithStories } from '../utils/map.js';
import { createStoryCard } from './storyPresenter.js';
import { saveStoryToDB, getStoriesFromDB, deleteStoryFromDB } from '../utils/database.js';
import { subscribe, unsubscribe, isCurrentPushSubscriptionAvailable, updateSubscriptionButtonText, togglePushNotification } from '../utils/notification-helper.js';

export default class HomePresenter {
  constructor(container) {
    this.container = container;
  }

  // Memastikan init dipanggil untuk memulai
  async init() {
    await this.loadAndRenderStories();  // Fungsi untuk menampilkan semua cerita
    await this.#setupPushNotificationButton();  // Memanggil setup tombol subscribe/unsubscribe
  }

  // Fungsi untuk memuat semua cerita
  async loadAndRenderStories() {
    const token = model.getToken();
    console.log("Token:", token);

    if (!token) {
      this.container.innerHTML = '<p>Anda harus login terlebih dahulu untuk melihat cerita.</p>';
      return;
    }

    this.container.innerHTML = '<h2>Loading...</h2>';

    try {
      // Cek koneksi internet
      const isOnline = navigator.onLine;
      console.log('Online status:', isOnline);
      
      // Coba ambil dari IndexedDB terlebih dahulu
      let stories = await getStoriesFromDB();
      console.log('Stories from IndexedDB:', stories ? stories.length : 0);
      
      // Jika ada data di IndexedDB, tampilkan dulu
      if (stories && stories.length > 0) {
        this.renderStories(stories);
        console.log('Rendering stories from IndexedDB');
        
        // Jika offline, tambahkan pesan offline
        if (!isOnline) {
          const offlineMessage = document.createElement('div');
          offlineMessage.style.backgroundColor = '#f8d7da';
          offlineMessage.style.color = '#721c24';
          offlineMessage.style.padding = '10px';
          offlineMessage.style.marginBottom = '15px';
          offlineMessage.style.borderRadius = '5px';
          offlineMessage.style.textAlign = 'center';
          offlineMessage.textContent = 'Anda sedang offline. Menampilkan data tersimpan.';
          
          // Tambahkan pesan di atas daftar cerita
          const storyList = this.container.querySelector('.story-list');
          if (storyList) {
            storyList.parentNode.insertBefore(offlineMessage, storyList);
          }
        }
      }
      
      // Kemudian coba ambil dari API (jika online)
      if (isOnline) {
        try {
          const result = await model.fetchStories(token, 1, 10, 1);
          
          if (result && result.listStory && result.listStory.length > 0) {
            // Update tampilan dengan data terbaru
            this.renderStories(result.listStory);
            console.log('Updated stories from API');
          }
        } catch (apiError) {
          console.error('Error fetching from API, using IndexedDB data:', apiError);
          // Jika gagal dan tidak ada data di IndexedDB, tampilkan pesan error
          if (!stories || stories.length === 0) {
            this.container.innerHTML = `
              <div style="text-align: center; padding: 20px;">
                <h3>Terjadi kesalahan saat memuat cerita</h3>
                <p>${apiError.message}</p>
                <p>Anda sedang dalam mode offline. Silakan coba lagi saat online.</p>
              </div>
            `;
          }
        }
      } else {
        // Jika offline dan tidak ada data di IndexedDB
        if (!stories || stories.length === 0) {
          this.container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <h3>Mode Offline</h3>
              <p>Anda sedang offline dan tidak ada data cerita tersimpan.</p>
              <p>Silakan hubungkan ke internet untuk melihat cerita terbaru.</p>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>Terjadi kesalahan</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  // Render stories di halaman
  renderStories(stories) {
    try {
      const cards = stories
        .map((story) => createStoryCard(story))
        .join('');

      this.container.innerHTML = `
        <section style="text-align: center; margin-bottom: 24px;">
          <h2>Selamat Datang di StoryShare App!</h2>
          <p>Bagikan kisah unik dan pengalaman Anda ...</p>
        </section>

        <h2 style="text-align: center; font-size: 28px; font-weight: 700;">Daftar Cerita</h2>
        <div class="story-list">${cards}</div>
        <div id="map" style="height: 400px; margin-top: 20px;"></div>
      `;

      // Inisialisasi peta dengan cerita yang memiliki lokasi
      const storiesWithLocation = stories.filter(story => story.lat && story.lon);
      if (storiesWithLocation.length > 0) {
        // Bungkus dengan try-catch untuk menangani error leaflet
        try {
          initMapWithStories(storiesWithLocation);
        } catch (mapError) {
          console.error('Error initializing map:', mapError);
          const mapElement = document.getElementById('map');
          if (mapElement) {
            mapElement.innerHTML = '<div style="padding: 20px; text-align: center;">Peta tidak tersedia saat ini</div>';
          }
        }
      }

      // Tambahkan event listener untuk tombol simpan
      this.#bindSaveButtons();
      this.#bindDeleteButtons();
    } catch (error) {
      console.error('Error rendering stories:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>Terjadi kesalahan saat menampilkan cerita</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  // Mengikat event listener ke tombol simpan
  #bindSaveButtons() {
    const saveButtons = this.container.querySelectorAll('.save-btn');
    saveButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.dataset.id;
        await this.handleSaveBookmark(storyId);
      });
    });
  }

  // Mengikat event listener ke tombol hapus
  #bindDeleteButtons() {
    const deleteButtons = this.container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.dataset.id;
        await this.deleteStory(storyId);
      });
    });
  }

  // Setup tombol subscribe/unsubscribe push notification
  async #setupPushNotificationButton() {
    const btn = document.getElementById('btn-subscribe-nav');
    if (!btn) return;

    const token = model.getToken(); // Pastikan token ada

    // Jika token tidak ada, tombol akan dinonaktifkan
    if (!token) {
      btn.textContent = 'Anda harus login untuk notifikasi';
      btn.disabled = true;
      return;
    }

    try {
      // Update teks tombol berdasarkan status langganan
      await updateSubscriptionButtonText(btn);
      
      // Tangani klik tombol untuk subscribe atau unsubscribe
      btn.onclick = async () => {
        try {
          // Panggil fungsi togglePushNotification dengan tombol sebagai parameter
          await togglePushNotification(btn);
          
          // Update teks tombol setelah toggle
          await updateSubscriptionButtonText(btn);
        } catch (error) {
          console.error('Error toggling push notification:', error);
          alert('Gagal mengubah status langganan notifikasi');
          btn.disabled = false;
        }
      };
    } catch (error) {
      console.error('Error setting up push notification button:', error);
      btn.textContent = 'Notifikasi tidak tersedia';
      btn.disabled = true;
    }
  }

  // Menambahkan cerita ke bookmark
  async handleSaveBookmark(storyId) {
    try {
      const stories = await getStoriesFromDB();
      const story = stories.find(st => st.id === storyId);

      if (story) {
        story.saved = true;  // Tandai cerita sebagai disimpan
        await saveStoryToDB(story);  // Simpan kembali ke IndexedDB dengan status 'saved'
        alert('Cerita berhasil disimpan ke bookmark!');
        
        // Perbarui tampilan tombol simpan
        const saveBtn = this.container.querySelector(`.save-btn[data-id="${storyId}"]`);
        if (saveBtn) {
          saveBtn.textContent = 'Tersimpan';
          saveBtn.disabled = true;
        }
        
        // Tambahkan tombol hapus jika belum ada
        const card = saveBtn.closest('.story-card');
        if (card && !card.querySelector(`.delete-btn[data-id="${storyId}"]`)) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.dataset.id = storyId;
          deleteBtn.textContent = 'Hapus';
          deleteBtn.addEventListener('click', () => this.deleteStory(storyId));
          card.querySelector('.story-card-actions').appendChild(deleteBtn);
        }
      } else {
        alert('Cerita tidak ditemukan.');
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
      alert('Gagal menyimpan cerita ke bookmark.');
    }
  }

  // Menghapus cerita dari database dan memperbarui tampilan
  async deleteStory(storyId) {
    try {
      const stories = await getStoriesFromDB();
      const story = stories.find(st => st.id === storyId);
      
      if (story) {
        // Ubah status saved menjadi false, bukan menghapus cerita
        story.saved = false;
        await saveStoryToDB(story);
        alert('Cerita dihapus dari bookmark!');
      } else {
        // Jika tidak ditemukan, hapus dari IndexedDB
        await deleteStoryFromDB(storyId);
        alert('Cerita dihapus dari bookmark!');
      }
      
      // Perbarui tampilan
      await this.loadAndRenderStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Gagal menghapus cerita dari bookmark.');
    }
  }
}
