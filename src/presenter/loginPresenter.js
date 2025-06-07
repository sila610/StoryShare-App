// src/presenter/loginPresenter.js
import * as model from '../model/storyModel.js';
import { navigateTo } from '../index.js';

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.view.onSubmit = this.handleLogin.bind(this);
  }

  async handleLogin(email, password) {
    try {
      const result = await model.loginUser(email, password);

      if (!result.error && result.loginResult && result.loginResult.token) {
        model.setToken(result.loginResult.token);
        model.setUserName(result.loginResult.name || 'Guest');

        sessionStorage.setItem('loginSuccess', 'true');

        if (typeof window.updateNav === 'function') {
          window.updateNav();
        }

        await navigateTo('#stories');
      } else {
        this.view.showError(`Login gagal: ${result.message || 'Email atau password salah.'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.view.showError('Terjadi kesalahan saat login, silakan coba lagi.');
    }
  }
}
