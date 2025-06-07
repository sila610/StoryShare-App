let currentStream = null;

export function captureCamera() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const captureButton = document.getElementById('capture');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      currentStream = stream;  // simpan stream agar bisa dimatikan nanti
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('Tidak dapat mengakses kamera', err);
    });

  captureButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.style.display = 'block';
    video.style.display = 'none';
  });
}

// Fungsi untuk mematikan kamera
export function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
    const video = document.getElementById('camera');
    if (video) video.srcObject = null;
  }
}
