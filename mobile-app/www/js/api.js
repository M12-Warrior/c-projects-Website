const API_BASE = localStorage.getItem('m12w_api_url') || 'http://localhost:3000';

const api = {
  async request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  del(path) { return this.request('DELETE', path); },

  // Auth
  login(username, password) { return this.post('/api/auth/login', { username, password }); },
  register(username, email, password) { return this.post('/api/auth/register', { username, email, password }); },
  logout() { return this.post('/api/auth/logout'); },
  me() { return this.get('/api/auth/me'); },
  updateProfile(bio) { return this.put('/api/auth/profile', { bio }); },

  // Blog
  getPosts() { return this.get('/api/blog/posts'); },
  getPost(slug) { return this.get('/api/blog/posts/' + slug); },
  addComment(slug, content) { return this.post('/api/blog/posts/' + slug + '/comments', { content }); },

  // Forum
  getCategories() { return this.get('/api/forum/categories'); },
  getCategory(slug) { return this.get('/api/forum/categories/' + slug); },
  getThread(slug) { return this.get('/api/forum/threads/' + slug); },
  createThread(category_id, title, content) { return this.post('/api/forum/threads', { category_id, title, content }); },
  addReply(slug, content) { return this.post('/api/forum/threads/' + slug + '/replies', { content }); },

  // Shop
  getProducts() { return this.get('/api/shop/products'); },
  getProduct(slug) { return this.get('/api/shop/products/' + slug); },
  placeOrder(items, shipping) { return this.post('/api/shop/orders', { items, shipping }); },
  getOrders() { return this.get('/api/shop/orders'); },

  // Contact
  sendMessage(name, email, subject, message) { return this.post('/api/contact', { name, email, subject, message }); }
};

const cart = {
  KEY: 'm12w_cart',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  save(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); },
  add(product) {
    const items = this.getAll();
    const existing = items.find(i => i.product_id === product.id);
    if (existing) { existing.quantity++; }
    else { items.push({ product_id: product.id, name: product.name, price: product.price, slug: product.slug, quantity: 1 }); }
    this.save(items);
    return items;
  },
  updateQty(productId, qty) {
    let items = this.getAll();
    if (qty <= 0) { items = items.filter(i => i.product_id !== productId); }
    else { const item = items.find(i => i.product_id === productId); if (item) item.quantity = qty; }
    this.save(items);
    return items;
  },
  remove(productId) { return this.updateQty(productId, 0); },
  clear() { this.save([]); },
  total() { return this.getAll().reduce((sum, i) => sum + i.price * i.quantity, 0); },
  count() { return this.getAll().reduce((sum, i) => sum + i.quantity, 0); }
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Expose globals for script usage (no bundler)
window.api = api;
window.cart = cart;
window.formatDate = formatDate;
