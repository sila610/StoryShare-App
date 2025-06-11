let currentStream = null;

export function captureCamera() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('snapshot');
  const captureButton = document.getElementById('capture');

  // Pastikan kamera sebelumnya dimatikan dulu
  stopCamera();

  console.log('captureCamera: Starting camera...');
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      currentStream = stream;  // simpan stream agar bisa dimatikan nanti
      video.srcObject = stream;
      console.log('captureCamera: Camera started successfully');
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
  console.log('stopCamera: Stopping camera...');
  if (currentStream) {
    currentStream.getTracks().forEach(track => {
      console.log('stopCamera: Stopping track:', track.kind);
      track.stop();
    });
    currentStream = null;
    
    const video = document.getElementById('camera');
    if (video) {
      video.srcObject = null;
      console.log('stopCamera: Video element cleared');
    }
    
    console.log('stopCamera: Camera stopped successfully');
  } else {
    console.log('stopCamera: No active camera stream to stop');
  }
}

// Tambahkan event listener untuk membersihkan kamera saat halaman ditutup
window.addEventListener('beforeunload', () => {
  stopCamera();
});
