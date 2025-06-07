// src/routes/router.js
let currentPageInstance = null;

const routes = {
  '#/': () => import('../views/home.js'),
  '#home': () => import('../views/home.js'),
  '#stories': () => import('../views/home.js'),
  '#add-story': () => import('../presenter/addStoryPresenter.js'),
  '#login': () => import('../auth/login.js'),
  '#register': () => import('../auth/register.js'),
  '#bookmarks': () => {
    // Panggil fungsi loadAndRenderSavedStories dari HomePresenter untuk rute #bookmarks
    const presenter = new HomePresenter(document.getElementById('main-content'));
    presenter.loadAndRenderSavedStories();  // Panggil fungsi yang benar untuk #bookmarks
  }
};

async function router() {
  const content = document.getElementById('main-content');
  const hash = window.location.hash || '#/';

  if (currentPageInstance && typeof currentPageInstance.stopCamera === 'function') {
    console.log('Router calling stopCamera on', currentPageInstance.constructor.name);
    currentPageInstance.stopCamera();
  }

  if (document.startViewTransition) {
    await document.startViewTransition(async () => {
      await loadRoute(hash, content);
    });
  } else {
    await loadRoute(hash, content);
  }
}

async function loadRoute(hash, content) {
  const routeLoader = routes[hash];
  if (!routeLoader) {
    content.innerHTML = '<p>Halaman tidak ditemukan.</p>';
    currentPageInstance = null;
    return;
  }

  const RouteModule = await routeLoader();
  const Route = RouteModule.default;

  if (typeof Route === 'function' && Route.prototype && Route.prototype.init) {
    currentPageInstance = new Route(content);
    window.currentPageInstance = currentPageInstance;
    await currentPageInstance.init();
  } else if (typeof Route === 'function') {
    currentPageInstance = null;
    window.currentPageInstance = null;
    Route(content);
  } else {
    content.innerHTML = '<p>Halaman tidak ditemukan.</p>';
    currentPageInstance = null;
    window.currentPageInstance = null;
  }
}

window.addEventListener('hashchange', async () => {
  await router();
});

window.addEventListener('load', async () => {
  await router();
});

export default router;
