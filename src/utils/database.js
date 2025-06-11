import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, OBJECT_STORE_NAME } from '../config.js';

// Buka database
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    // Buat object store jika belum ada
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      console.log(`Object store ${OBJECT_STORE_NAME} berhasil dibuat`);
    }
  },
});

// Simpan cerita ke database
export async function saveStoryToDB(story) {
  if (!story || !story.id) {
    console.error('Invalid story object:', story);
    return;
  }
  
  try {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    
    // Cek apakah cerita sudah ada
    const existingStory = await store.get(story.id);
    
    // Jika sudah ada dan memiliki properti saved, pertahankan nilai saved
    if (existingStory && existingStory.saved !== undefined) {
      // Hanya update saved jika nilai baru diberikan
      if (story.saved !== undefined) {
        existingStory.saved = story.saved;
      }
      // Gabungkan properti lain dari cerita baru
      Object.assign(existingStory, story);
      await store.put(existingStory);
    } else {
      // Jika belum ada, simpan cerita baru
      await store.put(story);
    }
    
    await tx.done;
    console.log('Story saved to IndexedDB:', story.id);
    return true;
  } catch (error) {
    console.error('Error saving story to IndexedDB:', error);
    return false;
  }
}

// Ambil semua cerita dari database
export async function getStoriesFromDB() {
  try {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    const stories = await store.getAll();
    await tx.done;
    console.log('Stories retrieved from IndexedDB:', stories.length);
    return stories;
  } catch (error) {
    console.error('Error getting stories from IndexedDB:', error);
    return [];
  }
}

// Hapus cerita dari database
export async function deleteStoryFromDB(id) {
  try {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.delete(id);
    await tx.done;
    console.log('Story deleted from IndexedDB:', id);
    return true;
  } catch (error) {
    console.error('Error deleting story from IndexedDB:', error);
    return false;
  }
}

// Cek apakah database tersedia
export async function isDatabaseAvailable() {
  if (!('indexedDB' in window)) {
    console.log('IndexedDB not supported');
    return false;
  }
  
  try {
    const db = await dbPromise;
    return !!db;
  } catch (error) {
    console.error('Error checking database availability:', error);
    return false;
  }
}
