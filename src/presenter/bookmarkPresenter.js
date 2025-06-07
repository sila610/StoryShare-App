import { getStoriesFromDB, deleteStoryFromDB } from 'utils/database.js';
import { createStoryCard } from './storyPresenter.js';

export default class BookmarkPresenter {
  constructor(container) {
    this.container = container;
  }

  async init() {
    await this.loadAndRenderBookmarkedStories();
  }

  async loadAndRenderBookmarkedStories() {
    let stories = await getStoriesFromDB(); // Ambil cerita yang disimpan di IndexedDB
    const bookmarkedStories = stories.filter(story => story.saved); // Ambil cerita yang disimpan

    if (bookmarkedStories.length > 0) {
      this.renderStories(bookmarkedStories);
    } else {
      this.container.innerHTML = '<p>Anda belum menyimpan cerita apapun.</p>';
    }
  }

  renderStories(stories) {
    const cards = stories.map(story => createStoryCard(story, this.handleRemoveBookmark.bind(this))).join('');
    this.container.innerHTML = `
      <h2>Daftar Cerita Tersimpan</h2>
      <div class="story-list">${cards}</div>
    `;
  }

  // Fungsi untuk menghapus cerita dari bookmark
  handleRemoveBookmark(storyId) {
    deleteStoryFromDB(storyId); // Hapus cerita dari IndexedDB
    alert('Cerita dihapus dari bookmark!');
    this.loadAndRenderBookmarkedStories(); // Muat ulang daftar bookmark
  }
}
