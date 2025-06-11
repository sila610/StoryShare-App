export default class RegisterView {
  constructor(container) {
    this.container = container;
    this.onSubmit = null;
    this.onCancel = null;
    this.onAlert = null;
  }

  render() {
    this.container.innerHTML = `
      <h2 style="text-align:center; margin-bottom:20px; font-weight:700; font-size:28px; color:#333;">Register</h2>
      <form id="registerForm" class="story-form" novalidate>
        <div class="form-control">
          <label for="name">Nama Lengkap:</label>
          <input type="text" id="name" name="name" placeholder="Masukkan nama lengkap" required />
        </div>
        <div class="form-control">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Masukkan email" required />
        </div>
        <div class="form-control">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" placeholder="Minimal 8 karakter" required minlength="8" />
        </div>
        <div class="form-buttons" style="margin-top: 20px;">
          <button class="btn" type="submit">Daftar</button>
          <button type="button" id="cancel-button" class="btn btn-outline">Batal</button>
        </div>
      </form>
    `;

    this.#bindEvents();
  }

  #bindEvents() {
    const form = this.container.querySelector('#registerForm');
    const cancelBtn = this.container.querySelector('#cancel-button');

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const name = form.elements['name'].value.trim();
      const email = form.elements['email'].value.trim();
      const password = form.elements['password'].value;

      if (this.onSubmit) {
        this.onSubmit(name, email, password);
      }
    });

    cancelBtn.addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });
  }

  showError(message) {
    this.onAlert?.(message);
  }

  showSuccess(message) {
    this.onAlert?.(message);
  }
}
