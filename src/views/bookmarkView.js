import BookmarkPresenter from '../presenter/bookmarkPresenter.js';

export default class BookmarkView {
  constructor(container) {
    this.container = container;
    this.presenter = null;  // Menambahkan properti untuk presenter
  }

  async init() {
    this.presenter = new BookmarkPresenter({
      view: this,
      model: StorySource,  // Ganti dengan model yang Anda gunakan untuk mengambil data bookmark
    });

    await this.presenter.initialRender();
  }

  showLoading() {
    this.container.innerHTML = '<p>Loading...</p>';
  }

  hideLoading() {
    this.container.innerHTML = '';
  }

  showBookmarks(bookmarks) {
    const container = document.getElementById('bookmarks');
    container.innerHTML = bookmarks.map((story) => `
      <div class="bookmark-card" data-id="${story.id}">
        <img src="${story.photoUrl}" alt="Story image" />
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <button class="delete-btn" data-id="${story.id}">Hapus Bookmark</button>
      </div>
    `).join('');
  }

  showEmpty() {
    this.container.innerHTML = '<p>Belum ada cerita yang disimpan.</p>';
  }

  showError(message) {
    this.container.innerHTML = `<p style="color: red">${message}</p>`;
  }

  async afterRender() {
    // Event listener untuk tombol hapus bookmark
    const container = document.getElementById('bookmarks');
    container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        await this.presenter.deleteBookmark(id); // Akses presenter melalui this.presenter
      }
    });
  }
}
