const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : 'https://shopwave-backend-mb3a.onrender.com';

console.log('🚀 ShopWave | API:', API_BASE);

// ── In-memory auth state (iframe/CSP safe) ──────────────
let _token = localStorage.getItem('sw_token') || null;
let _user  = (() => { try { return JSON.parse(localStorage.getItem('sw_user')); } catch { return null; } })();

const getToken = () => _token;
const getUser  = () => _user;
const setAuth  = (token, user) => {
  _token = token; _user = user;
  localStorage.setItem('sw_token', token);
  localStorage.setItem('sw_user', JSON.stringify(user));
};
const clearAuth = () => {
  _token = null; _user = null;
  localStorage.removeItem('sw_token');
  localStorage.removeItem('sw_user');
};

const apiFetch = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (_token) headers['Authorization'] = 'Bearer ' + _token;
  const res = await fetch(API_BASE + '/api' + path, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

// ── Currency formatter ───────────────────────────────────
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

// ── Toast ────────────────────────────────────────────────
const showToast = (msg, type = '') => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ` ${type}` : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
};

// ── Stars HTML ───────────────────────────────────────────
const starsHtml = (rating = 0, max = 5) => {
  const r = Math.round((rating || 0) * 2) / 2;
  return Array.from({ length: max }, (_, i) =>
    `<span class="star ${i + 1 <= r ? '' : 'empty'}">★</span>`
  ).join('');
};

// ── Category emoji map ───────────────────────────────────
const catEmoji = cat => {
  const map = {
    electronics: '📱', mobiles: '📱', phones: '📱',
    laptops: '💻', computers: '💻',
    audio: '🎧', headphones: '🎧', earphones: '🎧',
    watches: '⌚', fashion: '👗', clothing: '👕',
    shoes: '👟', bags: '👜', beauty: '💄', skincare: '🧴',
    home: '🏠', kitchen: '🍳', furniture: '🛋️',
    sports: '⚽', fitness: '💪',
    books: '📚', toys: '🧸', games: '🎮',
    food: '🍕', cameras: '📷', tv: '📺',
    automotive: '🚗', tools: '🔧',
  };
  if (!cat) return '📦';
  const lc = cat.toLowerCase();
  for (const [k, v] of Object.entries(map)) if (lc.includes(k)) return v;
  return '📦';
};

// ── Static fallback products (used if API is waking up) ──
const STATIC_PRODUCTS = [
  { id:1,  name:'Apple MacBook Pro M3 16"',       brand:'Apple',       price:249990, originalPrice:299990, averageRating:4.8, totalReviews:1247, stock:5,   category:{name:'Electronics'}, freeShipping:true  },
  { id:2,  name:'Samsung Galaxy S24 Ultra',        brand:'Samsung',     price:124999, originalPrice:149999, averageRating:4.7, totalReviews:2341, stock:12,  category:{name:'Electronics'}, freeShipping:true  },
  { id:3,  name:'Sony WH-1000XM5 Headphones',     brand:'Sony',        price:29990,  originalPrice:39990,  averageRating:4.6, totalReviews:3892, stock:23,  category:{name:'Electronics'}, freeShipping:false },
  { id:4,  name:'Nike Air Max 270',                brand:'Nike',        price:14995,  originalPrice:19995,  averageRating:4.5, totalReviews:876,  stock:34,  category:{name:'Fashion'},     freeShipping:false },
  { id:5,  name:'Dyson V15 Detect Cordless',      brand:'Dyson',       price:59900,  originalPrice:72900,  averageRating:4.7, totalReviews:654,  stock:8,   category:{name:'Home & Kitchen'},freeShipping:true},
  { id:6,  name:'LG 55" OLED 4K Smart TV',        brand:'LG',          price:99990,  originalPrice:149990, averageRating:4.8, totalReviews:432,  stock:6,   category:{name:'Electronics'}, freeShipping:true  },
  { id:7,  name:'Adidas Ultraboost 23',            brand:'Adidas',      price:17999,  originalPrice:24999,  averageRating:4.4, totalReviews:1123, stock:45,  category:{name:'Fashion'},     freeShipping:false },
  { id:8,  name:'Instant Pot Duo 7-in-1',         brand:'Instant Pot', price:9499,   originalPrice:13999,  averageRating:4.6, totalReviews:5678, stock:67,  category:{name:'Home & Kitchen'},freeShipping:false},
  { id:9,  name:'iPad Pro 12.9" M2 256GB',        brand:'Apple',       price:112900, originalPrice:139900, averageRating:4.7, totalReviews:987,  stock:9,   category:{name:'Electronics'}, freeShipping:true  },
  { id:10, name:"L'Oreal True Match Foundation",  brand:"L'Oreal",     price:899,    originalPrice:1299,   averageRating:4.3, totalReviews:3421, stock:234, category:{name:'Beauty'},      freeShipping:false },
  { id:11, name:'Atomic Habits — James Clear',    brand:'Penguin',     price:399,    originalPrice:799,    averageRating:4.9, totalReviews:12456,stock:456, category:{name:'Books'},       freeShipping:false },
  { id:12, name:'LEGO Technic Ferrari SP3',       brand:'LEGO',        price:34999,  originalPrice:44999,  averageRating:4.8, totalReviews:654,  stock:15,  category:{name:'Toys'},        freeShipping:true  },
  { id:13, name:'Bose SoundLink Flex Speaker',    brand:'Bose',        price:11900,  originalPrice:15900,  averageRating:4.5, totalReviews:2213, stock:30,  category:{name:'Electronics'}, freeShipping:false },
  { id:14, name:'Prestige Iris Induction Cooker', brand:'Prestige',    price:2999,   originalPrice:4299,   averageRating:4.4, totalReviews:8923, stock:89,  category:{name:'Home & Kitchen'},freeShipping:false},
  { id:15, name:'OnePlus Nord CE 3 Lite 5G',      brand:'OnePlus',     price:19999,  originalPrice:24999,  averageRating:4.2, totalReviews:4512, stock:56,  category:{name:'Electronics'}, freeShipping:true  },
  { id:16, name:'Wildcraft Hiking Backpack 45L',  brand:'Wildcraft',   price:2299,   originalPrice:3499,   averageRating:4.3, totalReviews:1876, stock:78,  category:{name:'Sports'},      freeShipping:false },
];

// ── Theme toggle ─────────────────────────────────────────
const toggleTheme = () => {
  const root = document.documentElement;
  const cur  = root.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('sw_theme', next);
  const icon = document.getElementById('themeIcon');
  icon.innerHTML = next === 'dark'
    ? '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
};

// Apply saved theme on load
const savedTheme = localStorage.getItem('sw_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
