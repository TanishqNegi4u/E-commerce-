// ═══════════════════════════════════════════════════════════════
//  ShopWave API Client — v2 (native fetch, no axios dependency)
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080/api'
      : `${window.location.protocol}//${window.location.hostname}/api`);

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

  if (res.status === 401) {
    if (_logoutFn) _logoutFn();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

export const productApi = {
  getAll: (page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc', filters = {}) => {
    const params = new URLSearchParams({ page, size, sortBy, sortDir });
    if (filters.minPrice != null) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating != null && filters.minRating > 0) params.set('minRating', filters.minRating);
    if (filters.inStock) params.set('inStock', 'true');
    return apiFetch(`/products?${params.toString()}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  search: (q, page = 0) =>
    apiFetch(`/products/search?q=${encodeURIComponent(q)}&page=${page}`),
  getSuggestions: (prefix) =>
    apiFetch(`/products/search/suggestions?prefix=${encodeURIComponent(prefix)}`),
  getFeatured: () => apiFetch('/products/featured'),
  getBestsellers: () => apiFetch('/products/bestsellers'),
  getByCategory: (categoryId, page = 0, filters = {}) => {
    const params = new URLSearchParams({ page });
    if (filters.minPrice != null) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating != null && filters.minRating > 0) params.set('minRating', filters.minRating);
    if (filters.inStock) params.set('inStock', 'true');
    return apiFetch(`/products/category/${categoryId}?${params.toString()}`);
  },
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