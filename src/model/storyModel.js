import * as api from '../api/api.js';

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
  return await api.fetchStories(token, page, size, location);
}

export async function postStory(token, description, photoFile, lat, lon) {
  return await api.addStory(token, description, photoFile, lat, lon);
}

export async function subscribePushNotification(token, subscription) {
  return await api.subscribePushNotification(token, subscription);
}

export async function unsubscribePushNotification(token, endpoint) {
  return await api.unsubscribePushNotification(token, endpoint);
}
