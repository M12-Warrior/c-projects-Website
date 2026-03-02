const app = {
  user: null,
  currentPage: null,
  currentParam: null,

  async init() {
    await this.checkAuth();
    this.bindNav();
    this.navigate('home');
  },

  async checkAuth() {
    try {
      const data = await api.me();
      this.user = data.user || null;
    } catch {
      this.user = null;
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        this.navigate(page);
      });
    });
  },

  updateNav(page) {
    const root = page.split('/')[0];
    const tabMap = {
      home: 'home', about: 'home', services: 'home', roadmap: 'home',
      'roadmap-detail': 'home', contact: 'home', packets: 'home', course: 'home',
      blog: 'blog', 'blog-post': 'blog',
      forum: 'forum', 'forum-category': 'forum', 'forum-thread': 'forum',
      'forum-new-thread': 'forum',
      shop: 'shop', 'shop-product': 'shop', cart: 'shop', checkout: 'shop',
      profile: 'profile', login: 'profile', register: 'profile',
      terms: 'profile', privacy: 'profile', 'disclaimer-page': 'profile',
      'accessibility-page': 'profile'
    };
    const active = tabMap[root] || 'home';
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === active);
    });
  },

  async navigate(page, param) {
    this.currentPage = page;
    this.currentParam = param;
    this.updateNav(page);

    const container = document.getElementById('app');
    let result;

    switch (page) {
      case 'home': result = pages.home(); break;
      case 'about': result = pages.about(); break;
      case 'services': result = pages.services(); break;
      case 'roadmap': result = pages.roadmap(); break;
      case 'roadmap-detail': result = pages.roadmapDetail(param); break;
      case 'contact': result = pages.contact(); break;
      case 'packets': result = pages.packets(); break;
      case 'course': result = pages.course(); break;
      case 'blog': result = pages.blog(); break;
      case 'blog-post': result = pages.blogPost(param); break;
      case 'forum': result = pages.forum(); break;
      case 'forum-category': result = pages.forumCategory(param); break;
      case 'forum-thread': result = pages.forumThread(param); break;
      case 'forum-new-thread': result = pages.forumNewThread(); break;
      case 'shop': result = pages.shop(); break;
      case 'shop-product': result = pages.shopProduct(param); break;
      case 'cart': result = pages.cart(); break;
      case 'checkout': result = pages.checkout(); break;
      case 'login': result = pages.login(); break;
      case 'register': result = pages.register(); break;
      case 'profile': result = pages.profile(); break;
      case 'terms': result = pages.terms(); break;
      case 'privacy': result = pages.privacy(); break;
      case 'disclaimer-page': result = pages['disclaimer-page'](); break;
      case 'accessibility-page': result = pages['accessibility-page'](); break;
      default: result = pages.home(); break;
    }

    container.innerHTML = result.html;
    container.scrollTo(0, 0);

    if (result.init) {
      try { await result.init(); }
      catch (e) { console.error('Page init error:', e); }
    }
  },

  toast(message, duration) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration || 2500);
  },

  async onLogin() {
    await this.checkAuth();
  },

  async onLogout() {
    try { await api.logout(); } catch {}
    this.user = null;
    this.navigate('home');
    this.toast('Signed out');
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
