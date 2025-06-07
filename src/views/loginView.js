export default class LoginView {
  constructor(container) {
    this.container = container;
    this.onSubmit = null;
    this.onAlert = null;
  }

  render() {
    this.container.innerHTML = `
      <h2 style="text-align:center; margin-bottom:20px; font-weight:700; font-size:28px; color:#333;">Login</h2>
      <form id="loginForm" class="story-form" aria-label="Form Login Pengguna">
        <div class="form-control">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Masukkan email" required aria-required="true" />
        </div>
        <div class="form-control">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" placeholder="Masukkan password" required aria-required="true" />
        </div>
        <div class="form-buttons" style="margin-top: 20px;">
          <button class="btn" type="submit">Masuk</button>
          <button type="button" id="cancel-button" class="btn btn-outline">Batal</button>
        </div>
      </form>
    `;

    this.#bindEvents();
  }

  #bindEvents() {
    const form = this.container.querySelector('#loginForm');
    const cancelBtn = this.container.querySelector('#cancel-button');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.elements['email'].value.trim();
      const password = form.elements['password'].value;

      if (!email || !password) {
        this.onAlert?.('Email dan password harus diisi.');
        return;
      }

      if (this.onSubmit) {
        this.onSubmit(email, password);
      }
    });

    cancelBtn.addEventListener('click', () => {
      window.location.hash = '#home'; // navigasi ke home saat batal
    });
  }

  showError(message) {
    this.onAlert?.(message);
  }
}
