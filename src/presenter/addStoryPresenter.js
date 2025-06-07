import AddStoryView from '../views/addStoryView.js';
import * as model from '../model/storyModel.js';
import { navigateTo } from '../index.js';

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
  }

  stopCamera() {
    if (this.#view && typeof this.#view.stopCamera === 'function') {
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
    await navigateTo('#stories');
  }
}
