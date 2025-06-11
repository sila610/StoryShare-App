import { updateSubscriptionButtonText, togglePushNotification } from './utils/notification-helper.js';
import * as model from './model/storyModel.js';

// Inisialisasi tombol subscribe di navigasi saat aplikasi dimuat
document.addEventListener('DOMContentLoaded', async () => {
  // Update navigasi berdasarkan status login
  window.updateNav();
  
  // Setup tombol subscribe di navigasi
  const subscribeBtn = document.getElementById('btn-subscribe-nav');
  if (subscribeBtn) {
    const token = model.getToken();
    
    if (!token) {
      subscribeBtn.textContent = 'Login untuk notifikasi';
      subscribeBtn.disabled = true;
    } else {
      try {
        await updateSubscriptionButtonText(subscribeBtn);
        
        subscribeBtn.onclick = async () => {
          try {
            subscribeBtn.disabled = true;
            subscribeBtn.textContent = 'Memproses...';
            
            await togglePushNotification(subscribeBtn);
            
            // Tombol akan diupdate oleh togglePushNotification
          } catch (error) {
            console.error('Error toggling push notification:', error);
            alert('Gagal mengubah status langganan notifikasi');
            subscribeBtn.disabled = false;
          }
        };
      } catch (error) {
        console.error('Error setting up push notification button:', error);
        subscribeBtn.textContent = 'Notifikasi tidak tersedia';
        subscribeBtn.disabled = true;
      }
    }
  }
});

