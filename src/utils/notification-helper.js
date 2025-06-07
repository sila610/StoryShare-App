import { subscribePushNotification, unsubscribePushNotification } from '../api/api.js';
import { VAPID_PUBLIC_KEY } from '../config.js';

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isCurrentPushSubscriptionAvailable() {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

// src/utils/notification-helper.js
export async function subscribe() {
  if (!('Notification' in window)) {
    alert('Browser tidak mendukung notifikasi.');
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    alert('Izin notifikasi tidak diberikan.');
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    alert('Service Worker belum terdaftar.');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-public-key', // Ganti dengan kunci Anda
    });

    console.log('Berhasil subscribe push notification:', subscription);
  } catch (error) {
    console.error('Gagal subscribe:', error);
    alert('Gagal berlangganan push notification.');
  }
}

export async function unsubscribe() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    alert('Service Worker belum terdaftar.');
    return;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    alert('Anda belum berlangganan notifikasi.');
    return;
  }

  try {
    await subscription.unsubscribe();
    console.log('Berhasil unsubscribe');
  } catch (error) {
    console.error('Gagal unsubscribe:', error);
    alert('Gagal berhenti berlangganan push notification.');
  }
}
