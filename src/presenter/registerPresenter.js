import * as model from '../model/storyModel.js';
import { navigateTo } from '../../public/index.js';

export default class RegisterPresenter {
  constructor(view) {
    this.view = view;
    this.view.onSubmit = this.handleRegister.bind(this);
    this.view.onCancel = this.handleCancel.bind(this);
    this.view.onAlert = this.handleAlert.bind(this);
  }

  handleAlert(message) {
    alert(message);
  }

  async handleRegister(name, email, password) {
    try {
      const result = await model.registerUser(name, email, password);
      if (!result.error) {
        // Tandai bahwa ini adalah pengguna baru yang baru saja register
        sessionStorage.setItem('justRegistered', 'true');
        
        this.view.showSuccess('Registrasi berhasil! Silakan login.');
        await navigateTo('#login');
      } else {
        this.view.showError(`Registrasi gagal: ${result.message}`);
      }
    } catch (error) {
      console.error('Register error:', error);
      this.view.showError('Terjadi kesalahan saat registrasi, coba lagi.');
    }
  }

  async handleCancel() {
    await navigateTo('#home');
  }
}
