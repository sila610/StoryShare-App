import { getStoriesFromDB, deleteStoryFromDB, saveStoryToDB } from '../utils/database.js';
import { createStoryCard } from './storyPresenter.js';
import { initMapWithStories } from '../utils/map.js';

export default class BookmarkPresenter {
  constructor(container) {
    this.container = container;
  }

  async init() {
    await this.loadAndRenderBookmarkedStories();
  }

  async loadAndRenderBookmarkedStories() {
    try {
      this.container.innerHTML = '<h2>Loading...</h2>';
      
      let stories = await getStoriesFromDB(); // Ambil cerita yang disimpan di IndexedDB
      const bookmarkedStories = stories ? stories.filter(story => story.saved === true) : []; // Ambil cerita yang disimpan

      if (bookmarkedStories.length > 0) {
        this.renderStories(bookmarkedStories);
        
        // Jika offline, tambahkan pesan offline
        if (!navigator.onLine) {
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
      } else {
        this.container.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <h2>Cerita Tersimpan</h2>
            <p>Anda belum menyimpan cerita apapun.</p>
            <p>Klik tombol "Simpan" pada cerita di halaman utama untuk menyimpannya di sini.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading bookmarked stories:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>Terjadi kesalahan</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  renderStories(stories) {
    try {
      const cards = stories
        .map((story) => createStoryCard(story))
        .join('');

      this.container.innerHTML = `
        <section style="text-align: center; margin-bottom: 24px;">
          <h2>Cerita Tersimpan</h2>
          <p>Berikut adalah cerita-cerita yang telah Anda simpan.</p>
        </section>

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

      // Tambahkan event listener untuk tombol hapus
      this.#bindDeleteButtons();
    } catch (error) {
      console.error('Error rendering bookmarked stories:', error);
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>Terjadi kesalahan saat menampilkan cerita tersimpan</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
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

  // Menghapus cerita dari bookmark
  async deleteStory(storyId) {
    try {
      // Ambil cerita dari IndexedDB
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
      
      // Muat ulang daftar bookmark
      await this.loadAndRenderBookmarkedStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Gagal menghapus cerita dari bookmark.');
    }
  }
}
