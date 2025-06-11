import HomePresenter from '../presenter/homePresenter.js';

export default async function home(container) {
  const presenter = new HomePresenter(container);
  await presenter.init();
  
}
