import L from 'leaflet';

const locationIcon = L.icon({
  iconUrl: '/assets/place_24dp_5985E1.png', // Pastikan ikon sudah tersedia di public/assets
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default class AddStoryView {
  constructor(container) {
    if (!container) throw new Error('Container element is required');
    this.container = container;
    this.takenPictures = [];
    this.selectedLocation = { lat: null, lon: null };
    this._stream = null;
    this._map = null;
    this._marker = null;

    this.onSubmit = null;
    this.onCancel = null;
    this.onTakePhoto = null;
    this.onUploadPhoto = null;
  }

  render() {
    this.container.innerHTML = `
      <h2 style="text-align:center; margin-bottom:20px;">Tambah Cerita Baru</h2>
      <form id="storyForm" class="story-form" novalidate>
        <div class="form-control">
          <label for="title">Judul Cerita:</label>
          <input type="text" id="title" name="title" placeholder="Masukkan judul cerita" required />
        </div>
        <div class="form-control">
          <label for="desc">Deskripsi Cerita:</label>
          <textarea id="desc" name="desc" required placeholder="Tuliskan deskripsi cerita Anda..."></textarea>
        </div>
        <div class="form-control">
          <label for="date">Tanggal Cerita:</label>
          <input type="date" id="date" name="date" required value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="form-control">
          <label>Ambil Gambar dengan Kamera:</label>
          <video id="camera" autoplay muted playsinline></video>
          <canvas id="snapshot" style="display:none;"></canvas>
          <button type="button" id="capture" class="btn btn-outline">Ambil Foto</button>
          <ul id="taken-pictures-list" class="taken-pictures-list"></ul>
        </div>
        <div class="form-control">
          <label>Atau Upload Gambar:</label>
          <input type="file" id="fileUpload" accept="image/*" multiple />
        </div>
        <div class="form-control">
          <label>Pilih Lokasi (klik pada peta):</label>
          <div id="map" style="height:300px;"></div>
          <div id="location-display">
            Lokasi dipilih: <span id="location-lat">-</span>, <span id="location-lon">-</span>
          </div>
        </div>
        <div class="form-buttons">
          <button class="btn" type="submit">Kirim Cerita</button>
          <button type="button" id="cancel-button" class="btn btn-outline">Batal</button>
        </div>
      </form>
    `;

    this.#bindEvents();
    this.#setupCamera();
    this.#setupMap();
  }

  #bindEvents() {
    const form = this.container.querySelector('#storyForm');
    const captureBtn = this.container.querySelector('#capture');
    const fileUpload = this.container.querySelector('#fileUpload');
    const cancelBtn = this.container.querySelector('#cancel-button');
    const video = this.container.querySelector('#camera');
    const canvas = this.container.querySelector('#snapshot');

    form.addEventListener('submit', e => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (this.takenPictures.length === 0) {
        alert('Anda harus menambahkan minimal satu gambar.');
        return;
      }

      const photoFile = this.takenPictures[0];
      if (photoFile.size > 1024 * 1024) {
        alert('Ukuran gambar maksimal 1MB.');
        return;
      }

      if (this.onSubmit) {
        const title = form.elements['title'].value.trim();
        const description = form.elements['desc'].value.trim();
        const date = form.elements['date'].value;

        const fullDescription = `${title}\n\n${description}\n\nTanggal: ${date}`;

        this.onSubmit(fullDescription, photoFile, this.selectedLocation);
      }
    });

    cancelBtn.addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });

    captureBtn.addEventListener('click', () => {
      if (!video.videoWidth || !video.videoHeight) {
        alert('Video kamera belum siap.');
        return;
      }
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.style.display = 'block';
      video.style.display = 'none';

      canvas.toBlob(blob => {
        if (blob) {
          this.addTakenPicture(blob);
          if (this.onTakePhoto) this.onTakePhoto(blob);
        }
      }, 'image/jpeg');
    });

    fileUpload.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.addTakenPicture(file);
          if (this.onUploadPhoto) this.onUploadPhoto(file);
        }
      });
      fileUpload.value = '';
    });
  }

  #setupCamera() {
    const video = this.container.querySelector('#camera');

    this.stopCamera();

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this._stream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        const canvas = this.container.querySelector('#snapshot');
        if (canvas) canvas.style.display = 'none';
      })
      .catch(err => {
        console.error('Tidak dapat mengakses kamera', err);
        alert('Akses kamera ditolak atau tidak tersedia.');
      });
  }

  #setupMap() {
    const defaultLatLng = [-2.5, 117.5];
    this._map = L.map('map').setView(defaultLatLng, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this._map);

    this._marker = null;

    this._map.on('click', e => {
      const { lat, lng } = e.latlng;
      if (this._marker) {
        this._marker.setLatLng(e.latlng);
      } else {
        this._marker = L.marker(e.latlng, { icon: locationIcon }).addTo(this._map);
      }
      this.updateLocation(lat, lng);
    });
  }

  addTakenPicture(blob) {
    this.takenPictures.push(blob);
    this.#renderTakenPictures();
  }

  #renderTakenPictures() {
    const list = this.container.querySelector('#taken-pictures-list');
    list.innerHTML = '';
    this.takenPictures.forEach((blob, i) => {
      const li = document.createElement('li');
      li.className = 'taken-pictures-list__item';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.alt = `Foto dokumentasi ${i + 1}`;
      img.width = 100;

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'delete-picture-btn';
      btnDelete.title = 'Hapus foto ini';
      btnDelete.textContent = '×';

      btnDelete.addEventListener('click', () => {
        this.takenPictures.splice(i, 1);
        this.#renderTakenPictures();
      });

      li.appendChild(img);
      li.appendChild(btnDelete);
      list.appendChild(li);
    });
  }

  updateLocation(lat, lon) {
    this.selectedLocation = { lat, lon };
    this.container.querySelector('#location-lat').textContent = lat?.toFixed(6) || '-';
    this.container.querySelector('#location-lon').textContent = lon?.toFixed(6) || '-';
  }

  stopCamera() {
    try {
      if (this._stream) {
        this._stream.getTracks().forEach(track => track.stop());
        this._stream = null;
      }
      if (this.container) {
        const video = this.container.querySelector('#camera');
        if (video) {
          video.pause();
          video.srcObject = null;
          video.style.display = 'none';
        }
        const canvas = this.container.querySelector('#snapshot');
        if (canvas) canvas.style.display = 'none';
      }
    } catch (error) {
      console.warn('stopCamera error:', error);
    }
  }
}
