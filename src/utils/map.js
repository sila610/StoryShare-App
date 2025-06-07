import L from 'leaflet';
import 'leaflet.markercluster';  // cukup import ini saja
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const locationIcon = L.icon({
  iconUrl: '/assets/place_24dp_5985E1.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

let mapInstance = null;
let markerClusterGroup = null;

export function initMapWithStories(stories) {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerClusterGroup = null;
  }

  mapInstance = L.map('map').setView([-2.5, 117.5], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(mapInstance);

  markerClusterGroup = L.markerClusterGroup();

  stories.forEach(story => {
    if (story.lat !== null && story.lon !== null) {
      const marker = L.marker([story.lat, story.lon], { icon: locationIcon });
      marker.bindPopup(`
        <strong>${story.name || 'Anonim'}</strong><br>
        ${story.description || '-'}
      `);
      markerClusterGroup.addLayer(marker);
    }
  });

  mapInstance.addLayer(markerClusterGroup);
}

export function initLocationPicker() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const defaultLatLng = [-2.5, 117.5];
  mapInstance = L.map('map').setView(defaultLatLng, 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(mapInstance);

  let locationPickerMarker = null;

  mapInstance.on('click', function (e) {
    const { lat, lng } = e.latlng;

    if (locationPickerMarker) {
      locationPickerMarker.setLatLng(e.latlng);
    } else {
      locationPickerMarker = L.marker(e.latlng, { icon: locationIcon }).addTo(mapInstance);
    }

    window.selectedLocation = { lat, lon: lng };
  });
}

export function removeMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerClusterGroup = null;
  }
}
