// src/presenter/storyPresenter.js
export function createStoryCard(story) {
  // Pastikan ada URL gambar, gunakan placeholder jika tidak ada
  let photoUrl = '/assets/place_24dp_5985E1.png'; // Default placeholder
  
  if (story.photoUrl) {
    photoUrl = story.photoUrl;
  } else if (story.photo) {
    photoUrl = story.photo;
  }
  
  const date = story.createdAt
    ? new Date(story.createdAt).toLocaleDateString()
    : 'Tanggal tidak tersedia';

  const isSaved = story.saved === true;

  return `
    <div class="story-card" tabindex="0" data-id="${story.id}">
      <img src="${photoUrl}" alt="Gambar cerita oleh ${story.name || 'Anonim'}" 
           onerror="this.onerror=null; this.src='/assets/place_24dp_5985E1.png';" />
      <h3>${story.name || 'Anonim'}</h3>
      <p>${story.description || '-'}</p>
      <p><small>${date}</small></p>
      <div class="story-card-actions">
        <button class="save-btn" data-id="${story.id}" ${isSaved ? 'disabled' : ''}>
          ${isSaved ? 'Tersimpan' : 'Simpan'}
        </button>
        ${isSaved ? `<button class="delete-btn" data-id="${story.id}">Hapus</button>` : ''}
      </div>
    </div>
  `;
}

/**
 * Attach listener ke tombol simpan dan hapus setelah kartu dirender
 * @param {Function} onSaveBookmarkCallback - callback ketika tombol simpan diklik
 * @param {Function} onDeleteStoryCallback - callback ketika tombol hapus diklik
 */
export function bindSaveButtonsAndDeleteButtons(onSaveBookmarkCallback, onDeleteStoryCallback) {
  const saveButtons = document.querySelectorAll('.save-btn');
  const deleteButtons = document.querySelectorAll('.delete-btn');

  // Mengikat event listener untuk tombol simpan
  saveButtons.forEach((btn) => {
    const storyId = btn.getAttribute('data-id');
    if (storyId && typeof onSaveBookmarkCallback === 'function') {
      btn.addEventListener('click', () => {
        onSaveBookmarkCallback(storyId);
      });
    }
  });

  // Mengikat event listener untuk tombol hapus
  deleteButtons.forEach((btn) => {
    const storyId = btn.getAttribute('data-id');
    if (storyId && typeof onDeleteStoryCallback === 'function') {
      btn.addEventListener('click', () => {
        onDeleteStoryCallback(storyId);
      });
    }
  });
}
