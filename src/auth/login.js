import LoginView from '../views/loginView.js';
import LoginPresenter from '../presenter/loginPresenter.js';

export default function login(container) {
  const view = new LoginView(container);
  const presenter = new LoginPresenter(view);
  view.render();
}
