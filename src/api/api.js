const BASE_URL = 'https://story-api.dicoding.dev/v1';

export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, email, password }),
  });
  return await res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
}

export async function fetchStories(token, page = 1, size = 10, location = 0) {
  const url = new URL(`${BASE_URL}/stories`);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);
  url.searchParams.set('location', location);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
}

export async function addStory(token, description, photoFile, lat = null, lon = null) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photoFile);
  if (lat !== null) formData.append('lat', lat);
  if (lon !== null) formData.append('lon', lon);

  const res = await fetch(`${BASE_URL}/stories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return await res.json();
}

export async function addStoryGuest(description, photoFile, lat = null, lon = null) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photoFile);
  if (lat !== null) formData.append('lat', lat);
  if (lon !== null) formData.append('lon', lon);

  const res = await fetch(`${BASE_URL}/stories/guest`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
}

export async function subscribePushNotification(token, subscription) {
  // Kirim hanya bagian penting subscription ke server
  const filteredSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  const res = await fetch(`${BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(filteredSubscription),
  });
  return await res.json();
}

export async function unsubscribePushNotification(token, endpoint) {
  const res = await fetch(`${BASE_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return await res.json();
}

export async function sendNotification(reportId, token) {
  const res = await fetch(`${BASE_URL}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reportId }),
  });
  return await res.json();
}