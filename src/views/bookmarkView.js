import BookmarkPresenter from '../presenter/bookmarkPresenter.js';

export default function bookmarkView(container) {
  const presenter = new BookmarkPresenter(container);
  presenter.init();
  return presenter;
}
