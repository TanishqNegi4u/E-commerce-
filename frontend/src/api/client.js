// ═══════════════════════════════════════════════════════════════
//  ShopWave API Client — v2 (native fetch, no axios dependency)
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080/api'
      : `${window.location.protocol}//${window.location.hostname}/api`);

// IMP-6 FIX: 401 interceptor — calls logout() from AuthContext on token expiry.
// We use a module-level ref so the apiFetch function (defined before AuthContext)
// can still call logout without a circular import.
let _logoutFn = null;
export function setLogoutHandler(fn) {
  _logoutFn = fn;
}

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('sw_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return null;

  // IMP-6 FIX: intercept 401 and trigger auto-logout so expired tokens
  // don't leave users stuck seeing generic "HTTP 401" error messages.
  if (res.status === 401) {
    if (_logoutFn) _logoutFn();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

export const productApi = {
  getAll: (page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc') =>
    apiFetch(`/products?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
  getById: (id) => apiFetch(`/products/${id}`),
  search: (q, page = 0) =>
    apiFetch(`/products/search?q=${encodeURIComponent(q)}&page=${page}`),
  getSuggestions: (prefix) =>
    apiFetch(`/products/search/suggestions?prefix=${encodeURIComponent(prefix)}`),
  getFeatured: () => apiFetch('/products/featured'),
  getBestsellers: () => apiFetch('/products/bestsellers'),
  getByCategory: (categoryId, page = 0) =>
    apiFetch(`/products/category/${categoryId}?page=${page}`),
  // BUG-4: getRecentlyViewed removed from Home page call site.
  // Kept here for when the feature is wired to a logged-in UI surface.
  getRecentlyViewed: () => apiFetch('/products/recently-viewed'),
};

export const authApi = {
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

export const cartApi = {
  get: () => apiFetch('/cart'),
  add: (productId, quantity = 1) =>
    apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  update: (productId, quantity) =>
    apiFetch(`/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (productId) =>
    apiFetch(`/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => apiFetch('/cart', { method: 'DELETE' }),
};

export const orderApi = {
  place: (data) =>
    apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: (page = 0) => apiFetch(`/orders?page=${page}`),
  getByNumber: (orderNumber) => apiFetch(`/orders/${orderNumber}`),
  cancel: (id) => apiFetch(`/orders/${id}/cancel`, { method: 'PUT' }),
};

export const categoryApi = {
  getAll: () => apiFetch('/categories'),
};

export const couponApi = {
  validate: (code, subtotal) =>
    apiFetch(`/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`),
};