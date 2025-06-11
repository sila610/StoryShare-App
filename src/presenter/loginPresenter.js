// src/presenter/loginPresenter.js
import * as model from '../model/storyModel.js';
import { navigateTo } from '../../public/index.js';

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.view.onSubmit = this.handleLogin.bind(this);
    this.view.onAlert = this.handleAlert.bind(this);
  }

  handleAlert(message) {
    alert(message);
  }

  async handleLogin(email, password) {
    try {
      const result = await model.loginUser(email, password);

      if (!result.error && result.loginResult && result.loginResult.token) {
        model.setToken(result.loginResult.token);
        model.setUserName(result.loginResult.name || 'Guest');

        // Cek apakah ini login pertama kali atau setelah register
        const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
        const justRegistered = sessionStorage.getItem('justRegistered') === 'true';
        
        if (isFirstLogin || justRegistered) {
          // Tandai bahwa user sudah pernah login
          localStorage.setItem('hasLoggedInBefore', 'true');
          // Hapus flag justRegistered
          sessionStorage.removeItem('justRegistered');
          
          // Tunda sedikit untuk memastikan navigasi selesai
          setTimeout(() => {
            this.promptNotificationPermission();
          }, 1000);
        }

        sessionStorage.setItem('loginSuccess', 'true');

        // Dispatch event untuk memberitahu bahwa user telah login
        const event = new Event('userLoggedIn');
        window.dispatchEvent(event);

        // Perbarui navigasi setelah login
        if (typeof window.updateNav === 'function') {
          window.updateNav();
        }

        // Navigasi ke halaman stories
        await navigateTo('#stories');
      } else {
        this.view.showError(`Login gagal: ${result.message || 'Email atau password salah.'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.view.showError('Terjadi kesalahan saat login, silakan coba lagi.');
    }
  }

  // Tambahkan metode baru untuk meminta izin notifikasi
  promptNotificationPermission() {
    // Cek dukungan notifikasi
    if (!('Notification' in window)) {
      console.log('Browser tidak mendukung notifikasi');
      return;
    }

    // Jika izin belum diberikan, tampilkan dialog konfirmasi
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      const confirmNotif = confirm(
        'Selamat datang di StoryShare App! Apakah Anda ingin menerima notifikasi untuk cerita baru dan pembaruan?'
      );
      
      if (confirmNotif) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            // Jika izin diberikan, tampilkan notifikasi selamat datang
            const notification = new Notification('Selamat Datang di StoryShare App!', {
              body: 'Terima kasih telah bergabung. Anda akan menerima notifikasi untuk cerita baru.',
              icon: '/assets/auto_stories_24dp_5985E1_FILL0_wght400_GRAD0_opsz24.png'
            });
            
            // Setelah izin diberikan, tawarkan untuk subscribe push notification
            setTimeout(() => {
              this.offerPushSubscription();
            }, 3000);
          }
        });
      }
    }
  }

  // Metode untuk menawarkan langganan push notification
  async offerPushSubscription() {
    try {
      // Import fungsi dari notification-helper.js
      const { subscribe } = await import('../utils/notification-helper.js');
      
      const confirmPush = confirm(
        'Apakah Anda ingin berlangganan notifikasi push untuk mendapatkan pembaruan bahkan ketika browser ditutup?'
      );
      
      if (confirmPush) {
        // Panggil fungsi subscribe yang sudah ada
        const result = await subscribe();
        if (result) {
          console.log('Berhasil berlangganan push notification');
        } else {
          console.log('Gagal berlangganan push notification');
        }
      }
    } catch (error) {
      console.error('Error offering push subscription:', error);
    }
  }
}
