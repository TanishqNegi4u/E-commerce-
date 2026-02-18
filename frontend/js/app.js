// ============================================================
// ShopWave — app.js
// All JavaScript for the ShopWave frontend
// ============================================================

// ── API CONFIG ───────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api'
  : 'https://shopwave-backend-mb3a.onrender.com/api';

console.log('🚀 ShopWave initialized with API:', API_BASE);

// ── STATIC DATA ──────────────────────────────────────────────
const CATEGORIES = [
  {id:1, name:'Electronics', icon:'📱', color:'#E8F4FF', count:124},
  {id:2, name:'Fashion',     icon:'👗', color:'#FFF0F5', count:89},
  {id:3, name:'Home & Kitchen', icon:'🏠', color:'#F0FFF4', count:67},
  {id:4, name:'Sports',     icon:'⚽', color:'#FFF8E1', count:45},
  {id:5, name:'Beauty',     icon:'💄', color:'#FCE4EC', count:38},
  {id:6, name:'Books',      icon:'📚', color:'#EDE7F6', count:230},
  {id:7, name:'Toys',       icon:'🧸', color:'#E8F5E9', count:56},
  {id:8, name:'Automotive', icon:'🚗', color:'#FBE9E7', count:29}
];

const PRODUCTS = [
  {id:1,  name:"Apple MacBook Pro M3 Max 16\"", brand:'Apple',        price:249990, original:299990, discount:17, rating:4.8, reviews:1247, stock:5,   category:'Electronics',   badge:'New', image:'💻', featured:true},
  {id:2,  name:'Samsung Galaxy S24 Ultra',      brand:'Samsung',      price:124999, original:149999, discount:17, rating:4.7, reviews:2341, stock:12,  category:'Electronics',   badge:'Hot', image:'📱', featured:true},
  {id:3,  name:'Sony WH-1000XM5 Headphones',   brand:'Sony',         price:29990,  original:39990,  discount:25, rating:4.6, reviews:3892, stock:23,  category:'Electronics',   badge:'',    image:'🎧', featured:true},
  {id:4,  name:'Nike Air Max 720',              brand:'Nike',         price:14995,  original:19995,  discount:25, rating:4.5, reviews:876,  stock:34,  category:'Fashion',       badge:'',    image:'👟', featured:true},
  {id:5,  name:'Dyson V15 Detect Cordless',     brand:'Dyson',        price:59900,  original:72900,  discount:18, rating:4.7, reviews:654,  stock:8,   category:'Home & Kitchen',badge:'New', image:'🧹', featured:true},
  {id:6,  name:'LG 55" OLED 4K Smart TV',      brand:'LG',           price:99990,  original:149990, discount:33, rating:4.8, reviews:432,  stock:6,   category:'Electronics',   badge:'Hot', image:'📺', featured:false},
  {id:7,  name:'Adidas Ultraboost 23',          brand:'Adidas',       price:17999,  original:24999,  discount:28, rating:4.4, reviews:1123, stock:45,  category:'Fashion',       badge:'',    image:'👟', featured:true},
  {id:8,  name:'Instant Pot Duo 7-in-1',        brand:'Instant Pot',  price:9499,   original:13999,  discount:32, rating:4.6, reviews:5678, stock:67,  category:'Home & Kitchen',badge:'',    image:'🫕', featured:false},
  {id:9,  name:'iPad Pro 12.9" M2 256GB',       brand:'Apple',        price:112900, original:139900, discount:19, rating:4.7, reviews:987,  stock:9,   category:'Electronics',   badge:'',    image:'📟', featured:true},
  {id:10, name:"L'Oreal True Match Foundation", brand:"L'Oreal",      price:899,    original:1299,   discount:31, rating:4.3, reviews:3421, stock:234, category:'Beauty',        badge:'',    image:'💄', featured:false},
  {id:11, name:'Atomic Habits — James Clear',   brand:'Penguin Books', price:399,   original:799,    discount:50, rating:4.9, reviews:12456,stock:456, category:'Books',         badge:'',    image:'📖', featured:false},
  {id:12, name:'Lego Technic Ferrari SP3',      brand:'LEGO',         price:34999,  original:44999,  discount:22, rating:4.8, reviews:654,  stock:15,  category:'Toys',          badge:'New', image:'🧱', featured:false}
];

// ── APP STATE ─────────────────────────────────────────────────
let cart        = JSON.parse(localStorage.getItem('sw_cart')     || '[]');
let wishlist    = JSON.parse(localStorage.getItem('sw_wishlist') || '[]');
let authToken   = localStorage.getItem('sw_token')  || null;
let currentUser = JSON.parse(localStorage.getItem('sw_user')   || 'null');
let currentSlide = 0;
let authTab     = 'login';
let countdownTime = 4 * 3600 + 47 * 60 + 23;

// ============================================================
// DSA — TRIE (autocomplete)
// ============================================================
class TrieNode { constructor() { this.children = {}; this.isEnd = false; } }
class Trie {
  constructor() { this.root = new TrieNode(); }
  insert(word) {
    let node = this.root;
    for (const c of word.toLowerCase()) {
      if (!node.children[c]) node.children[c] = new TrieNode();
      node = node.children[c];
    }
    node.isEnd = true;
  }
  getSuggestions(prefix, limit = 8) {
    let node = this.root;
    for (const c of prefix.toLowerCase()) {
      if (!node.children[c]) return [];
      node = node.children[c];
    }
    const results = [];
    this._dfs(node, prefix.toLowerCase(), results, limit);
    return results;
  }
  _dfs(node, prefix, results, limit) {
    if (results.length >= limit) return;
    if (node.isEnd) results.push(prefix);
    for (const [c, child] of Object.entries(node.children))
      this._dfs(child, prefix + c, results, limit);
  }
}

// DSA — Merge Sort
function mergeSort(arr, key, asc = true) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const L = mergeSort(arr.slice(0, mid), key, asc);
  const R = mergeSort(arr.slice(mid), key, asc);
  return merge(L, R, key, asc);
}
function merge(L, R, key, asc) {
  const res = []; let i = 0, j = 0;
  while (i < L.length && j < R.length) {
    const cmp = asc ? L[i][key] <= R[j][key] : L[i][key] >= R[j][key];
    if (cmp) res.push(L[i++]); else res.push(R[j++]);
  }
  return [...res, ...L.slice(i), ...R.slice(j)];
}

// DSA — Binary Search price range
function binarySearchPriceRange(sorted, min, max) {
  return sorted.filter(p => p.price >= min && p.price <= max);
}

// Build search Trie
const trie = new Trie();
PRODUCTS.forEach(p => { trie.insert(p.name); trie.insert(p.brand); });

// ============================================================
// RENDER — Categories
// ============================================================
function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="category-card" onclick="filterCategory(${c.id})">
      <span class="category-icon">${c.icon}</span>
      <div class="category-name">${c.name}</div>
      <div class="category-count">${c.count} Products</div>
    </div>`).join('');
}

// ============================================================
// RENDER — Product Card
// ============================================================
function renderProductCard(p) {
  const inWishlist = wishlist.includes(p.id);
  const inCart     = cart.some(c => c.id === p.id);
  const stars = '⭐'.repeat(Math.floor(p.rating));
  
  return `
    <div class="product-card">
      ${p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase()}">${p.badge}</span>` : ''}
      <button class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlistItem(event,${p.id})">
        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <div class="product-image" onclick="openModal(${p.id})">
        <div style="font-size:100px">${p.image}</div>
      </div>
      <div class="product-info" onclick="openModal(${p.id})">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="rating-stars"><i class="fas fa-star"></i> ${p.rating}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="product-price">
          <span class="current-price">₹${p.price.toLocaleString()}</span>
          <span class="original-price">₹${p.original.toLocaleString()}</span>
          <span class="discount-badge">${p.discount}% OFF</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-add-cart" onclick="addToCartQ(event,${p.id})">
          <i class="fas fa-${inCart ? 'check' : 'shopping-cart'}"></i> ${inCart ? 'In Cart' : 'Add to Cart'}
        </button>
        <button class="btn-quick-view" onclick="openModal(${p.id})">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </div>`;
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (grid) {
    grid.innerHTML = PRODUCTS.filter(p => p.featured).map(renderProductCard).join('');
  }
}

function renderAllProducts(products) {
  const count = document.getElementById('productCount');
  if (count) {
    count.textContent = `Showing ${products.length} products`;
  }
  const grid = document.getElementById('mainGrid');
  if (grid) {
    grid.innerHTML = products.map(renderProductCard).join('');
  }
}

function renderFlashProducts() {
  const shuffled = [...PRODUCTS].sort(() => Math.random() - .5).slice(0, 6);
  const grid = document.getElementById('flashGrid');
  if (grid) {
    grid.innerHTML = shuffled.map(renderProductCard).join('');
  }
}

// ============================================================
// HERO SLIDER
// ============================================================
function initHeroDots() {
  const slides = document.querySelectorAll('.hero-slide');
  document.getElementById('heroDots').innerHTML =
    Array.from({length: slides.length}, (_, i) =>
      `<button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`).join('');
}

function changeSlide(dir) {
  const slides = document.querySelectorAll('.hero-slide');
  slides[currentSlide].classList.remove('active');
  document.querySelectorAll('.hero-dot')[currentSlide]?.classList.remove('active');
  currentSlide = (currentSlide + dir + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  document.querySelectorAll('.hero-dot')[currentSlide]?.classList.add('active');
}

function goToSlide(i) { changeSlide(i - currentSlide || 1); currentSlide = i; }
setInterval(() => changeSlide(1), 4500);

// ============================================================
// SEARCH — Trie-powered
// ============================================================
function handleSearch(val) {
  const box = document.getElementById('suggestions');
  if (!val.trim()) { box.classList.remove('active'); return; }
  const suggs = trie.getSuggestions(val, 8);
  if (!suggs.length) { box.classList.remove('active'); return; }
  box.innerHTML = suggs.map(s =>
    `<div class="suggestion-item" onclick="selectSuggestion('${s.replace(/'/g, "\\'")}')">
       <i class="fas fa-search"></i> ${highlightMatch(s, val)}
     </div>`).join('');
  box.classList.add('active');
  box.style.display = 'block';
}

function highlightMatch(str, q) {
  const i = str.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return str;
  return str.slice(0, i)
    + '<strong style="color:var(--primary)">' + str.slice(i, i + q.length) + '</strong>'
    + str.slice(i + q.length);
}
function selectSuggestion(s) {
  document.getElementById('searchInput').value = s;
  const box = document.getElementById('suggestions');
  box.classList.remove('active');
  box.style.display = 'none';
  doSearch();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const box = document.getElementById('suggestions');
  box.classList.remove('active');
  box.style.display = 'none';
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q));
  renderAllProducts(filtered);
  const section = document.querySelector('.products-section');
  if (section) {
    section.scrollIntoView({behavior: 'smooth'});
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    const box = document.getElementById('suggestions');
    box.classList.remove('active');
    box.style.display = 'none';
  }
});

// ============================================================
// PRODUCT MODAL
// ============================================================
function openModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const inCart = cart.some(c => c.id === p.id);
  const stars5 = Array.from({length: 5}, (_, i) =>
    `<i class="fas fa-star" style="color:${i < Math.floor(p.rating) ? '#FFB800' : '#ddd'};font-size:14px"></i>`).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-images">
      <div style="font-size:180px;text-align:center;padding:20px;background:#f0f4f8;border-radius:12px">${p.image}</div>
    </div>
    <div class="modal-info">
      <div class="modal-brand">${p.brand}</div>
      <div class="modal-name">${p.name}</div>
      <div class="modal-rating">
        <span class="rating-pill">${stars5} ${p.rating}</span>
        <span style="color:var(--text-muted);font-size:13px">${p.reviews.toLocaleString()} ratings</span>
        ${p.stock <= 5 ? `<span style="color:var(--accent-red);font-size:12px;font-weight:700">Only ${p.stock} left!</span>` : ''}
      </div>
      <div class="modal-price-row">
        <span class="current">₹${p.price.toLocaleString()}</span>
        <span class="original">₹${p.original.toLocaleString()}</span>
        <span class="discount">${p.discount}% OFF</span>
      </div>
      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty(-1)">−</button>
        <input class="qty-val" id="modalQty" type="number" value="1" min="1" max="${p.stock}">
        <button class="qty-btn" onclick="changeQty(1)">+</button>
      </div>
      <div class="modal-btn-row">
        <button class="modal-btn cart ${inCart ? 'in-cart' : ''}" onclick="addToCartModal(${p.id})">
          <i class="fas fa-shopping-cart"></i> ${inCart ? 'Go to Cart' : 'Add to Cart'}
        </button>
        <button class="modal-btn buy" onclick="buyNowModal(${p.id})">
          <i class="fas fa-bolt"></i> Buy Now
        </button>
      </div>
      <div class="delivery-info">
        <div><i class="fas fa-truck"></i> Free delivery by <strong>Tomorrow</strong></div>
        <div><i class="fas fa-undo"></i> 30-day return policy</div>
        <div><i class="fas fa-shield-alt"></i> 1 Year Warranty</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px">
        ${Object.entries(p.specs || {}).map(([k, v]) =>
          `<tr>
             <td style="padding:6px 8px;color:var(--text-muted);background:var(--bg-secondary);border-radius:4px;width:40%">${k}</td>
             <td style="padding:6px 8px">${v}</td>
           </tr>`).join('')}
      </table>
    </div>`;

  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
}

function changeQty(d) {
  const input = document.getElementById('modalQty');
  if (input) input.value = Math.max(1, parseInt(input.value) + d);
}

// ============================================================
// CART
// ============================================================
function addToCartQ(event, id) { event.stopPropagation(); addToCart(id, 1); }

function addToCart(id, qty = 1) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty = Math.min(existing.qty + qty, p.stock);
  else cart.push({id: p.id, qty});
  saveCart();
  showToast(`${p.name} added to cart! 🛒`, 'success');
  renderCartPanel();
}

function addToCartModal(id) {
  addToCart(id, parseInt(document.getElementById('modalQty')?.value || 1));
  closeModal();
}

function buyNow(event, id)   { event.stopPropagation(); addToCart(id); toggleCart(); }
function buyNowModal(id)     { addToCartModal(id); toggleCart(); }

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); renderCartPanel();
  showToast('Item removed from cart', 'info');
}

function updateCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  const p = PRODUCTS.find(x => x.id === id);
  item.qty = Math.max(1, Math.min(item.qty + delta, p ? p.stock : 99));
  saveCart(); renderCartPanel();
}

function saveCart() {
  localStorage.setItem('sw_cart', JSON.stringify(cart));
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('cartCount').textContent = total;
  renderFeatured();
  renderAllProducts(PRODUCTS);
}function renderCartPanel() {
  const container = document.getElementById('cartItems');
  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <button class="btn-shop" onclick="toggleCart()">Continue Shopping</button>
      </div>`;
    ['cartSubtotal','cartTotal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '₹0';
    });
    return;
  }
  container.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="item-image">${p.image}</div>
        <div class="item-details">
          <div class="item-name">${p.name}</div>
          <div class="item-price">₹${(p.price * item.qty).toLocaleString()}</div>
          <div class="item-controls">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateCartQty(${p.id}, -1)">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="updateCartQty(${p.id}, 1)">+</button>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${p.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  const subtotal = cart.reduce((s, item) => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return s + (p ? p.price * item.qty : 0);
  }, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const discount = Math.round(subtotal * 0.05);
  
  const subtotalEl = document.getElementById('cartSubtotal');
  const shippingEl = document.getElementById('cartShipping');
  const discountEl = document.getElementById('cartDiscount');
  const totalEl = document.getElementById('cartTotal');
  
  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString();
  if (shippingEl) shippingEl.textContent  = shipping === 0 ? 'FREE' : '₹' + shipping;
  if (discountEl) discountEl.textContent  = '-₹' + discount.toLocaleString();
  if (totalEl) totalEl.textContent     = '₹' + (subtotal + shipping - discount).toLocaleString();
}

function toggleCart() {
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  const isOpen  = panel.classList.contains('active');
  panel.classList.toggle('active', !isOpen);
  overlay.classList.toggle('active', !isOpen);
  if (!isOpen) { renderCartPanel(); document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = '';
}

function toggleWishlist() {
  const panel   = document.getElementById('wishlistPanel');
  const overlay = document.getElementById('wishlistOverlay');
  const isOpen  = panel.classList.contains('active');
  panel.classList.toggle('active', !isOpen);
  overlay.classList.toggle('active', !isOpen);
  if (!isOpen) { renderWishlistPanel(); document.body.style.overflow = 'hidden'; }
  else document.body.style.overflow = '';
}

function renderWishlistPanel() {
  const container = document.getElementById('wishlistItems');
  document.getElementById('wishlistCount').textContent = wishlist.length;
  
  if (!wishlist.length) {
    container.innerHTML = `
      <div class="wishlist-empty">
        <i class="fas fa-heart"></i>
        <p>Your wishlist is empty</p>
        <button class="btn-shop" onclick="toggleWishlist()">Start Shopping</button>
      </div>`;
    return;
  }
  
  container.innerHTML = wishlist.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return '';
    return `
      <div class="wishlist-item">
        <div class="item-image">${p.image}</div>
        <div class="item-details">
          <div class="item-name">${p.name}</div>
          <div class="item-price">₹${p.price.toLocaleString()}</div>
          <div class="item-controls">
            <button class="btn-add-cart" onclick="addToCart(${p.id}, 1); toggleWishlist();">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button class="btn-remove" onclick="toggleWishlistItem(event, ${p.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ============================================================
// SORTING & FILTERS
// ============================================================
function sortProducts(val) {
  let sorted = [...PRODUCTS];
  if (val === 'price_asc')  sorted = mergeSort(sorted, 'price',    true);
  if (val === 'price_desc') sorted = mergeSort(sorted, 'price',   false);
  if (val === 'rating')     sorted = mergeSort(sorted, 'rating',  false);
  if (val === 'discount')   sorted = mergeSort(sorted, 'discount',false);
  renderAllProducts(sorted);
}

function filterCategory(id) {
  const cat      = CATEGORIES.find(c => c.id === id);
  const filtered = cat ? PRODUCTS.filter(p => p.category === cat.name) : PRODUCTS;
  renderAllProducts(filtered);
  const section = document.querySelector('.products-section');
  if (section) {
    section.scrollIntoView({behavior: 'smooth'});
  }
}

function updatePriceFilter(val) {
  document.getElementById('priceVal').textContent = '₹' + parseInt(val).toLocaleString();
  renderAllProducts(binarySearchPriceRange(
    mergeSort([...PRODUCTS], 'price', true), 0, parseInt(val)));
}

function clearFilters() {
  document.querySelectorAll('.sidebar input').forEach(i => {
    if (i.type === 'checkbox' || i.type === 'radio') i.checked = false;
  });
  renderAllProducts(PRODUCTS);
}

function setView(type, btn) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('mainGrid').style.gridTemplateColumns = type === 'list' ? '1fr' : '';
}

// ============================================================
// COUNTDOWN TIMER
// ============================================================
function updateCountdown() {
  if (countdownTime <= 0) return;
  countdownTime--;
  const h = Math.floor(countdownTime / 3600);
  const m = Math.floor((countdownTime % 3600) / 60);
  const s = countdownTime % 60;
  const hEl = document.getElementById('hours');
  const mEl = document.getElementById('minutes');
  const sEl = document.getElementById('seconds');
  if (hEl) hEl.textContent = String(h).padStart(2, '0');
  if (mEl) mEl.textContent = String(m).padStart(2, '0');
  if (sEl) sEl.textContent = String(s).padStart(2, '0');
}
setInterval(updateCountdown, 1000);

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================================
// AUTH
// ============================================================
function updateNavAuth() {
  const btn = document.getElementById('loginBtnText');
  btn.textContent = currentUser
    ? (currentUser.name?.split(' ')[0] || 'Account')
    : 'Login';
}

function showProfile() {
  if (currentUser) {
    if (confirm(`Logged in as ${currentUser.email}\n\nClick OK to logout.`)) {
      authToken = null; currentUser = null;
      localStorage.removeItem('sw_token');
      localStorage.removeItem('sw_user');
      updateNavAuth();
      showToast('Logged out successfully', 'info');
    }
    return;
  }
  openAuthModal();
}

function openAuthModal() {
  document.getElementById('authModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('authError').style.display = 'none';
  switchTab('login');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
  document.body.style.overflow = '';
}function switchTab(tab) {
  authTab = tab;
  document.getElementById('registerFields').style.display  = tab === 'register' ? 'block' : 'none';
  document.getElementById('authSubtitle').textContent      = tab === 'login' ? 'Sign in to your account' : 'Create a new account';
  document.getElementById('authSubmitBtn').textContent     = tab === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('tabLogin').style.background     = tab === 'login' ? 'var(--primary)' : '#fff';
  document.getElementById('tabLogin').style.color          = tab === 'login' ? '#fff' : 'var(--text2)';
  document.getElementById('tabRegister').style.background  = tab === 'register' ? 'var(--primary)' : '#fff';
  document.getElementById('tabRegister').style.color       = tab === 'register' ? '#fff' : 'var(--text2)';
  document.getElementById('authError').style.display       = 'none';
}

async function submitAuth() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl    = document.getElementById('authError');
  const btn      = document.getElementById('authSubmitBtn');

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.style.display = 'block'; return;
  }

  btn.textContent = 'Please wait...'; btn.disabled = true;
  errEl.style.display = 'none';

  try {
    if (authTab === 'login') {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
      authToken   = data.accessToken;
      currentUser = {id: data.userId, email: data.email, name: data.firstName, role: data.role};
      localStorage.setItem('sw_token', authToken);
      localStorage.setItem('sw_user', JSON.stringify(currentUser));
      updateNavAuth(); closeAuthModal();
      showToast(`Welcome back, ${currentUser.name || 'User'}! 👋`, 'success');
    } else {
      const fullName = document.getElementById('authName').value.trim();
      if (!fullName) { errEl.textContent = 'Please enter your full name.'; errEl.style.display = 'block'; return; }
      const [firstName, ...rest] = fullName.split(' ');
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({firstName, lastName: rest.join(' '), email, password})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed.');
      showToast('Account created! Please sign in. ✅', 'success');
      switchTab('login');
    }
  } catch (err) {
    const msg = err.message === 'Failed to fetch'
      ? 'Server is starting up, please wait 30 seconds and try again.'
      : err.message;
    errEl.textContent = msg; errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = authTab === 'login' ? 'Sign In' : 'Create Account';
  }
}

// ============================================================
// ORDERS
// ============================================================
async function showOrders() {
  if (!authToken) { openAuthModal(); showToast('Please login to view orders', 'info'); return; }
  document.getElementById('ordersModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  const list = document.getElementById('ordersList');
  list.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:32px"></i></div>';
  try {
    const res    = await fetch(`${API_BASE}/orders`, {
      credentials: 'include',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    if (!res.ok) throw new Error('Failed to load orders.');
    const data   = await res.json();
    const orders = data.content || data;
    if (!orders.length) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</div>';
      return;
    }
    list.innerHTML = orders.map(o => `
      <div style="border:2px solid var(--border-color);border-radius:12px;padding:20px;margin-bottom:16px;background:white">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>📦 ${o.orderNumber}</strong>
          <span style="background:${statusColor(o.status)};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px">${o.status}</span>
        </div>
        <div>Total: <strong>₹${o.totalAmount?.toLocaleString()}</strong></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--accent-red)">${e.message}</div>`;
  }
}

function statusColor(status) {
  const map = {
    PENDING:'#FF9800', CONFIRMED:'#2196F3', SHIPPED:'#00BCD4',
    DELIVERED:'#4CAF50', CANCELLED:'#F44336', REFUNDED:'#607D8B'
  };
  return map[status] || 'var(--primary)';
}

function closeOrdersModal() {
  document.getElementById('ordersModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================
// BACK TO TOP
// ============================================================
function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) {
    if (window.scrollY > 500) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }
});

// ============================================================
// CHECKOUT
// ============================================================
async function checkout() {
  if (!cart.length) { showToast('Add items to cart first!', 'error'); return; }
  if (!authToken)   { toggleCart(); openAuthModal(); return; }
  const btn = document.querySelector('.btn-checkout');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing order...';
  btn.disabled  = true;
  try {
    const res  = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
      body: JSON.stringify({couponCode: null, shippingAddress: 'Default Address', paymentMethod: 'COD', notes: ''})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order failed.');
    cart = []; saveCart(); renderCartPanel(); toggleCart();
    showToast(`🎉 Order placed! #${data.orderNumber}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-lock"></i> Secure Checkout';
    btn.disabled  = false;
  }
}

// ============================================================
// INIT
// ============================================================
function init() {
  renderCategories();
  renderFeatured();
  renderAllProducts(PRODUCTS);
  renderFlashProducts();
  initHeroDots();
  const cartTotal = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartBadge').textContent     = cartTotal;
  document.getElementById('cartCount').textContent     = cartTotal;
  document.getElementById('wishlistBadge').textContent = wishlist.length;
  updateNavAuth();
  document.getElementById('authModal').addEventListener('click', e => {
    if (e.target === document.getElementById('authModal')) closeAuthModal();
  });
  document.getElementById('ordersModal').addEventListener('click', e => {
    if (e.target === document.getElementById('ordersModal')) closeOrdersModal();
  });
  document.getElementById('productModal').addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) closeModal();
  });
}

init();