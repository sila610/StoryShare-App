// src/presenter/homePresenter.js
import * as model from '../model/storyModel.js';
import { initMapWithStories } from '../utils/map.js';
import { createStoryCard, bindSaveButtonsAndDeleteButtons } from './storyPresenter.js';
import { saveStoryToDB, getStoriesFromDB, deleteStoryFromDB } from '../utils/database.js';
import { subscribe, unsubscribe, isCurrentPushSubscriptionAvailable } from '../utils/notification-helper.js';

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
      let stories = await getStoriesFromDB();
      if (stories.length > 0) {
        this.renderStories(stories);
      } else {
        const result = await model.fetchStories(token, 1, 10, 1);

        if (!result || !result.listStory || result.listStory.length === 0) {
          this.container.innerHTML = `<p>Gagal memuat cerita: Tidak ada cerita yang ditemukan.</p>`;
          return;
        }

        result.listStory.forEach(story => saveStoryToDB(story));
        this.renderStories(result.listStory);
      }
    } catch (error) {
      this.container.innerHTML = `<p>Terjadi kesalahan saat memuat cerita: ${error.message}</p>`;
      console.error(error);
    }
  }

  // Render stories di halaman
  renderStories(stories) {
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
      <div id="notification-container" style="text-align: center; margin-top: 20px;">
        <button id="btn-push-toggle" class="btn">Loading...</button>
      </div>
    `;

    // Bind tombol simpan dan hapus setelah cerita dirender
    bindSaveButtonsAndDeleteButtons(this.handleSaveBookmark.bind(this), this.deleteStory.bind(this));
    initMapWithStories(stories);
  }

  // Setup tombol subscribe/unsubscribe push notification
  async #setupPushNotificationButton() {
    const btn = this.container.querySelector('#btn-push-toggle');
    if (!btn) return;

    const token = model.getToken(); // Pastikan token ada

    // Jika token tidak ada, tombol akan dinonaktifkan
    if (!token) {
      btn.textContent = 'Anda harus login untuk notifikasi';
      btn.disabled = true;
      return;
    }

    // Cek status langganan push notification
    const subscribed = await isCurrentPushSubscriptionAvailable();

    // Ubah teks tombol berdasarkan status langganan
    btn.textContent = subscribed ? 'Unsubscribe Push Notification' : 'Subscribe Push Notification';
    btn.disabled = false;

    // Tangani klik tombol untuk subscribe atau unsubscribe
    btn.onclick = async () => {
      btn.disabled = true;  // Nonaktifkan tombol sementara

      try {
        if (subscribed) {
          await unsubscribe();  // Unsubscribe
          alert('Berhasil berhenti berlangganan notifikasi!');
        } else {
          await subscribe();  // Subscribe
          alert('Berhasil berlangganan push notification!');
        }
      } catch (err) {
        alert('Gagal mengubah langganan notifikasi.');
        console.error(err);
      }

      // Perbarui tombol setelah aksi
      await this.#setupPushNotificationButton();
    };
  }

  // Menambahkan cerita ke bookmark
  async handleSaveBookmark(storyId) {
    const stories = await getStoriesFromDB();
    const story = stories.find(st => st.id === storyId);

    if (story) {
      story.saved = true;  // Tandai cerita sebagai disimpan
      await saveStoryToDB(story);  // Simpan kembali ke IndexedDB dengan status 'saved'
      alert('Cerita berhasil disimpan ke bookmark!');
      await this.loadAndRenderStories();  // Perbarui tampilan daftar cerita
    }
  }

  // Menghapus cerita dari database dan memperbarui tampilan
  async deleteStory(storyId) {
    await deleteStoryFromDB(storyId);  // Hapus cerita dari IndexedDB
    alert('Cerita berhasil dihapus!');
    await this.loadAndRenderStories();  // Perbarui tampilan daftar cerita setelah dihapus
  }
}
