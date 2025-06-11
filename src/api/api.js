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
  try {
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
    
    const responseJson = await res.json();
    
    // Log respons untuk debugging
    console.log('API response:', responseJson);
    
    return responseJson;
  } catch (error) {
    console.error('Network error when adding story:', error);
    return { 
      error: true, 
      message: error.message || 'Terjadi kesalahan jaringan'
    };
  }
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
  console.log('Sending subscription to server:', { token, subscription });
  
  // Kirim hanya bagian penting subscription ke server
  const filteredSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  try {
    console.log('Filtered subscription data:', filteredSubscription);
    const res = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(filteredSubscription),
    });
    
    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      try {
        return JSON.parse(errorText);
      } catch (e) {
        return { error: true, message: `Server error: ${res.status} ${res.statusText}` };
      }
    }
    
    const data = await res.json();
    console.log('Server response for subscription:', data);
    return data;
  } catch (error) {
    console.error('Error subscribing to push notification:', error);
    return { error: true, message: error.message };
  }
}

export async function unsubscribePushNotification(token, endpoint) {
  console.log('Sending unsubscribe request to server:', { token, endpoint });
  
  try {
    const res = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
    
    if (!res.ok) {
      console.error('Server returned error status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      try {
        return JSON.parse(errorText);
      } catch (e) {
        return { error: true, message: `Server error: ${res.status} ${res.statusText}` };
      }
    }
    
    const data = await res.json();
    console.log('Server response for unsubscription:', data);
    return data;
  } catch (error) {
    console.error('Error unsubscribing from push notification:', error);
    return { error: true, message: error.message };
  }
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
