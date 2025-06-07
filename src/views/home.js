import HomePresenter from '../presenter/homePresenter.js';

export default async function home(container) {
  const presenter = new HomePresenter(container);
  await presenter.init();
}

// Misalnya, menambahkan tombol simpan di sini
function renderStory(story) {
  return `
    <div class="story-card" data-id="${story.id}">
      <img src="${story.photoUrl || '/assets/default.png'}" alt="${story.name}">
      <h3>${story.name}</h3>
      <p>${story.description}</p>
      <button class="save-btn" onclick="handleSaveBookmark(${story.id})">Simpan</button>
    </div>
  `;
}

async function handleSaveBookmark(storyId) {
  const story = await getStoryById(storyId);  // Pastikan Anda memiliki logika untuk mengambil cerita berdasarkan ID
  story.saved = true; // Tandai sebagai disimpan
  await saveStoryToDB(story);  // Menyimpan cerita yang sudah disimpan
  alert('Cerita berhasil disimpan!');
}
