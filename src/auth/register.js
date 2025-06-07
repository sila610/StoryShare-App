import RegisterView from '../views/registerView.js';
import RegisterPresenter from '../presenter/registerPresenter.js';

export default function register(container) {
  const view = new RegisterView(container);
  const presenter = new RegisterPresenter(view);
  view.render();
}
