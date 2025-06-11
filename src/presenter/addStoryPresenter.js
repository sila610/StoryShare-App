import AddStoryView from '../views/addStoryView.js';
import * as model from '../model/storyModel.js';


export default class AddStoryPresenter {
  #view;

  constructor(container) {
    if (!container) throw new Error('Container element is required');
    this.#view = new AddStoryView(container);
    this.#view.onSubmit = this.handleSubmit.bind(this);
    this.#view.onCancel = this.handleCancel.bind(this);
  }

  async init() {
    this.#view.render();
    // Selalu minta izin kamera setiap kali halaman dibuka
    console.log('AddStoryPresenter init - requesting camera permission');
    
    // Tambahkan timeout kecil untuk memastikan DOM sudah siap
    setTimeout(() => {
      // Tampilkan dialog konfirmasi terlebih dahulu
      if (confirm('Aplikasi membutuhkan akses kamera untuk mengambil foto. Izinkan akses kamera?')) {
        // Jika user setuju, baru setup kamera
        this.#view.setupCamera();
      }
    }, 500);
  }

  stopCamera() {
    if (this.#view && typeof this.#view.stopCamera === 'function') {
      console.log('AddStoryPresenter - stopping camera');
      this.#view.stopCamera();
    }
  }

  async handleSubmit(description, photoFile, location) {
    const token = model.getToken();
    if (!token) {
      alert('Anda harus login terlebih dahulu.');
      return;
    }
    try {
      const res = await model.postStory(token, description, photoFile, location.lat, location.lon);
      if (!res.error) {
        alert('Cerita berhasil ditambahkan');
        
        // Tambahkan cerita baru ke IndexedDB agar muncul di beranda
        if (res.story) {
          // Tambahkan properti yang diperlukan
          const newStory = {
            id: res.story.id,
            name: localStorage.getItem('userName') || 'Anda',
            description: description,
            photoUrl: URL.createObjectURL(photoFile),
            createdAt: new Date().toISOString(),
            lat: location.lat,
            lon: location.lon
          };
          
          // Simpan ke IndexedDB
          const { saveStoryToDB } = await import('../utils/database.js');
          await saveStoryToDB(newStory);
        }
        
        // Matikan kamera sebelum navigasi
        this.stopCamera();
        
        // Navigasi ke halaman stories
        const { navigateTo } = await import('../routes/router.js');
        await navigateTo('#stories');
      } else {
        alert('Gagal menambahkan cerita: ' + res.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan.');
      console.error(error);
    }
  }

  async handleCancel() {
    // Matikan kamera sebelum navigasi
    this.stopCamera();
    
    const { navigateTo } = await import('../routes/router.js');
    await navigateTo('#stories');
  }
}
