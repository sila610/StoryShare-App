// src/utils/database.js
import { openDB } from 'idb';  // Untuk IndexedDB

const DATABASE_NAME = 'storyshare-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' }); // Menggunakan 'id' sebagai keyPath
    }
  },
});

// Menyimpan cerita ke IndexedDB
export const saveStoryToDB = async (story) => {
  const db = await dbPromise;
  console.log('Menyimpan cerita ke IndexedDB:', story); // Debugging log
  
  // Pastikan cerita memiliki id, jika tidak buat id
  if (!story.id) {
    story.id = Date.now(); // Membuat id unik jika tidak ada
  }
  
  return db.put(OBJECT_STORE_NAME, story); // Simpan cerita
};

// Mengambil cerita dari IndexedDB
export const getStoriesFromDB = async () => {
  const db = await dbPromise;
  const stories = await db.getAll(OBJECT_STORE_NAME);
  console.log('Cerita yang diambil dari IndexedDB:', stories);  // Debugging log
  return stories;
};

// Menghapus cerita dari IndexedDB
export const deleteStoryFromDB = async (storyId) => {
  const db = await dbPromise;
  return db.delete(OBJECT_STORE_NAME, storyId);
};
