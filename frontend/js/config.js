// =============================================
// SHOPWAVE CONFIG — Update API_BASE to your Render URL
// =============================================
const API_BASE = 'https://e-commerce-1dyu.onrender.com';

// Helpers
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const showToast = (msg, duration = 3000) => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
};

// Token storage (in-memory only — Render iframe safe)
let _token = null, _user = null;
const getToken = () => _token;
const getUser  = () => _user;
const setAuth  = (token, user) => { _token = token; _user = user; };
const clearAuth = () => { _token = null; _user = null; };

// Authenticated fetch helper
const apiFetch = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (_token) headers['Authorization'] = 'Bearer ' + _token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
  return data;
};

// Stars HTML
const starsHtml = (rating, max = 5) => {
  const r = Math.round(rating * 2) / 2;
  return Array.from({ length: max }, (_, i) => {
    const filled = i + 1 <= r;
    return `<span class="star ${filled ? '' : 'empty'}">★</span>`;
  }).join('');
};

// Emoji placeholder by category
const catEmoji = (cat) => {
  const map = {
    electronics: '📱', mobiles: '📱', phones: '📱',
    laptops: '💻', computers: '💻',
    audio: '🎧', headphones: '🎧',
    watches: '⌚', fashion: '👗', clothing: '👕',
    shoes: '👟', bags: '👜', beauty: '💄',
    home: '🏠', kitchen: '🍳', sports: '⚽',
    books: '📚', toys: '🧸', food: '🍕',
    cameras: '📷', tv: '📺',
  };
  if (!cat) return '📦';
  const lc = cat.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lc.includes(key)) return emoji;
  }
  return '📦';
};