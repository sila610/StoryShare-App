import * as api from '../api/api.js';
import { BASE_URL } from '../config.js';
import { saveStoryToDB, getStoriesFromDB } from '../utils/database.js';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

export function getUserName() {
  return localStorage.getItem('userName');
}

export function setUserName(name) {
  localStorage.setItem('userName', name);
}

export async function loginUser(email, password) {
  return await api.loginUser(email, password);
}

export async function registerUser(name, email, password) {
  return await api.registerUser(name, email, password);
}

export async function fetchStories(token, page = 1, size = 10, location = 0) {
  try {
    // Cek koneksi internet
    const isOnline = navigator.onLine;
    console.log('Online status in fetchStories:', isOnline);
    
    // Jika offline, coba ambil dari IndexedDB
    if (!isOnline) {
      console.log('Offline mode: Fetching stories from IndexedDB');
      const stories = await getStoriesFromDB();
      if (stories && stories.length > 0) {
        console.log('Stories found in IndexedDB:', stories.length);
        return { 
          error: false,
          message: 'Menampilkan data dari penyimpanan lokal (offline mode)',
          listStory: stories 
        };
      }
      console.log('No stories found in IndexedDB');
      return { 
        error: false,
        message: 'Tidak ada data tersimpan untuk mode offline',
        listStory: [] 
      };
    }
    
    // Jika online atau tidak ada data di IndexedDB, ambil dari API
    const url = `${BASE_URL}/stories?page=${page}&size=${size}&location=${location}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await fetch(url, options);
    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    // Simpan ke IndexedDB untuk penggunaan offline
    if (responseJson.listStory && responseJson.listStory.length > 0) {
      console.log('Saving stories to IndexedDB');
      await Promise.all(responseJson.listStory.map(story => {
        // Pastikan URL gambar disimpan dengan benar
        if (story.photoUrl) {
          // URL gambar sudah ada, gunakan apa adanya
          return saveStoryToDB(story);
        } else if (story.photoUrl === undefined && story.photo) {
          // Jika photoUrl tidak ada tapi photo ada, gunakan photo sebagai photoUrl
          story.photoUrl = story.photo;
          return saveStoryToDB(story);
        } else {
          // Jika tidak ada URL gambar, gunakan placeholder
          story.photoUrl = '/assets/place_24dp_5985E1.png';
          return saveStoryToDB(story);
        }
      }));
    }

    return responseJson;
  } catch (error) {
    console.error('Error fetching stories:', error);
    
    // Jika gagal fetch dan offline, coba ambil dari IndexedDB
    if (!navigator.onLine) {
      console.log('Offline mode: Trying to get stories from IndexedDB after fetch failure');
      const stories = await getStoriesFromDB();
      if (stories && stories.length > 0) {
        console.log('Stories found in IndexedDB after fetch failure:', stories.length);
        return { 
          error: false,
          message: 'Menampilkan data dari penyimpanan lokal (offline mode)',
          listStory: stories 
        };
      }
    }
    
    throw error;
  }
}

export async function postStory(token, description, photoFile, lat, lon) {
  try {
    const response = await api.addStory(token, description, photoFile, lat, lon);
    
    // Jika berhasil, tambahkan properti story dengan data cerita yang baru ditambahkan
    if (!response.error) {
      response.story = {
        id: response.id || `story-${Date.now()}`, // Gunakan ID dari respons atau buat ID sementara
        name: getUserName() || 'Anda',
        description: description,
        photoUrl: URL.createObjectURL(photoFile),
        createdAt: new Date().toISOString(),
        lat: lat,
        lon: lon
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error posting story:', error);
    return { error: true, message: error.message || 'Terjadi kesalahan jaringan' };
  }
}

export async function subscribePushNotification(token, subscription) {
  return await api.subscribePushNotification(token, subscription);
}

export async function unsubscribePushNotification(token, endpoint) {
  return await api.unsubscribePushNotification(token, endpoint);
}
