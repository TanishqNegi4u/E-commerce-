// ============================================================
// ShopWave — app.js  (FULLY FIXED VERSION)
// ✅ Backend cart sync  ✅ Checkout modal with address
// ✅ Payment options (COD / Online)  ✅ Live product fetch
// ✅ Buy Now → Checkout  ✅ Coupon code support
// ============================================================

// ── API CONFIG ───────────────────────────────────────────────
// ✅ CORRECT — with local fallback
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080/api'
  : 'https://shopwave-backend-mb3a.onrender.com/api';

console.log('🚀 ShopWave initialized with API:', API_BASE);

// ── STATIC FALLBACK DATA (used if backend has no products yet)
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

const STATIC_PRODUCTS = [
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

let PRODUCTS = [...STATIC_PRODUCTS]; // will be replaced by API data if available

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

function binarySearchPriceRange(sorted, min, max) {
  return sorted.filter(p => p.price >= min && p.price <= max);
}

let trie = new Trie();
function rebuildTrie() {
  trie = new Trie();
  PRODUCTS.forEach(p => { trie.insert(p.name); trie.insert(p.brand); });
}

// ============================================================
// FETCH PRODUCTS FROM BACKEND (with static fallback)
// ============================================================
async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products?size=100`);
    if (!res.ok) throw new Error('Backend products not available');
    const data = await res.json();
    const items = data.content || data;
    if (!items || items.length === 0) throw new Error('No products from backend');

    // Map backend product shape to frontend shape
    PRODUCTS = items.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand || 'ShopWave',
      price: parseFloat(p.price) || 0,
      original: parseFloat(p.originalPrice || p.price) || 0,
      discount: p.discountPercentage || 0,
      rating: parseFloat(p.rating) || 4.0,
      reviews: p.reviewCount || 0,
      stock: p.stock || 10,
      category: p.category?.name || 'General',
      badge: p.isFeatured ? 'New' : '',
      image: p.images?.[0] ? null : '📦',
      imageUrl: p.images?.[0] || null,
      featured: !!p.isFeatured
    }));
    console.log(`✅ Loaded ${PRODUCTS.length} products from backend`);
  } catch (e) {
    console.warn('⚠️ Using static product data:', e.message);
    PRODUCTS = [...STATIC_PRODUCTS];
  }
  rebuildTrie();
  renderCategories();
  renderFeatured();
  renderAllProducts(PRODUCTS);
  renderFlashProducts();
}

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

  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="max-height:120px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
    : '';
  const emojiHtml = `<div style="font-size:100px;${p.imageUrl ? 'display:none' : ''}">${p.image || '📦'}</div>`;

  return `
    <div class="product-card">
      ${p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase()}">${p.badge}</span>` : ''}
      <button class="product-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlistItem(event,${p.id})">
        <i class="${inWishlist ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <div class="product-image" onclick="openModal(${p.id})">
        ${imgHtml}${emojiHtml}
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
  if (grid) grid.innerHTML = PRODUCTS.filter(p => p.featured).map(renderProductCard).join('');
}

function renderAllProducts(products) {
  const count = document.getElementById('productCount');
  if (count) count.textContent = `Showing ${products.length} products`;
  const grid = document.getElementById('mainGrid');
  if (grid) grid.innerHTML = products.map(renderProductCard).join('');
}

function renderFlashProducts() {
  const shuffled = [...PRODUCTS].sort(() => Math.random() - .5).slice(0, 6);
  const grid = document.getElementById('flashGrid');
  if (grid) grid.innerHTML = shuffled.map(renderProductCard).join('');
}

// ============================================================
// HERO SLIDER
// ============================================================
function initHeroDots() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsEl = document.getElementById('heroDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = Array.from({length: slides.length}, (_, i) =>
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
  box.classList.remove('active'); box.style.display = 'none';
  doSearch();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const box = document.getElementById('suggestions');
  box.classList.remove('active'); box.style.display = 'none';
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q));
  renderAllProducts(filtered);
  document.querySelector('.products-section')?.scrollIntoView({behavior: 'smooth'});
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    const box = document.getElementById('suggestions');
    box.classList.remove('active'); box.style.display = 'none';
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

  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" style="max-height:220px;object-fit:contain;border-radius:12px" onerror="this.outerHTML='<div style=\\'font-size:180px;text-align:center\\'>${p.image || '📦'}</div>'">`
    : `<div style="font-size:180px;text-align:center;padding:20px;background:#f0f4f8;border-radius:12px">${p.image || '📦'}</div>`;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-images">${imgHtml}</div>
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
// CART  (local state + backend sync when logged in)
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
  // Sync to backend if logged in
  if (authToken) syncCartItemToBackend(id, existing ? existing.qty : qty);
}

async function syncCartItemToBackend(productId, quantity) {
  try {
    await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({productId, quantity})
    });
  } catch (e) {
    console.warn('Cart backend sync failed:', e.message);
  }
}

async function syncFullCartToBackend() {
  if (!authToken || !cart.length) return;
  // Clear backend cart then re-add all local items
  try {
    await fetch(`${API_BASE}/cart`, {
      method: 'DELETE',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    for (const item of cart) {
      await syncCartItemToBackend(item.id, item.qty);
    }
    console.log('✅ Cart synced to backend');
  } catch (e) {
    console.warn('Full cart sync failed:', e.message);
  }
}

function addToCartModal(id) {
  addToCart(id, parseInt(document.getElementById('modalQty')?.value || 1));
  closeModal();
}

// BUY NOW → directly open checkout
function buyNow(event, id) {
  event.stopPropagation();
  addToCart(id, 1);
  openCheckoutModal();
}

function buyNowModal(id) {
  addToCartModal(id);
  openCheckoutModal();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); renderCartPanel();
  showToast('Item removed from cart', 'info');
  if (authToken) {
    fetch(`${API_BASE}/cart/items/${id}`, {
      method: 'DELETE',
      headers: {'Authorization': `Bearer ${authToken}`}
    }).catch(() => {});
  }
}

function updateCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  const p = PRODUCTS.find(x => x.id === id);
  item.qty = Math.max(1, Math.min(item.qty + delta, p ? p.stock : 99));
  saveCart(); renderCartPanel();
  if (authToken) {
    fetch(`${API_BASE}/cart/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({quantity: item.qty})
    }).catch(() => {});
  }
}

function saveCart() {
  localStorage.setItem('sw_cart', JSON.stringify(cart));
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('cartCount').textContent = total;
  renderFeatured();
  renderAllProducts(PRODUCTS);
}

function renderCartPanel() {
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
        <div class="item-image">${p.imageUrl ? `<img src="${p.imageUrl}" style="width:60px;height:60px;object-fit:contain" onerror="this.outerHTML='${p.image || '📦'}'">` : p.image || '📦'}</div>
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
  const totalEl    = document.getElementById('cartTotal');

  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString();
  if (shippingEl) shippingEl.textContent  = shipping === 0 ? 'FREE' : '₹' + shipping;
  if (discountEl) discountEl.textContent  = '-₹' + discount.toLocaleString();
  if (totalEl)    totalEl.textContent     = '₹' + (subtotal + shipping - discount).toLocaleString();
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

function toggleWishlistItem(event, id) {
  event.stopPropagation();
  if (wishlist.includes(id)) wishlist = wishlist.filter(x => x !== id);
  else wishlist.push(id);
  localStorage.setItem('sw_wishlist', JSON.stringify(wishlist));
  document.getElementById('wishlistBadge').textContent = wishlist.length;
  showToast(wishlist.includes(id) ? 'Added to wishlist ❤️' : 'Removed from wishlist', 'info');
  renderFeatured();
  renderAllProducts(PRODUCTS);
  renderWishlistPanel();
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
        <div class="item-image">${p.image || '📦'}</div>
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
  document.querySelector('.products-section')?.scrollIntoView({behavior: 'smooth'});
}

function updatePriceFilter(val) {
  document.getElementById('priceVal').textContent = '₹' + parseInt(val).toLocaleString();
  renderAllProducts(binarySearchPriceRange(mergeSort([...PRODUCTS], 'price', true), 0, parseInt(val)));
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
  toast.className = '';
  toast.classList.add('show');
  if (type === 'error') toast.style.background = '#e74c3c';
  else if (type === 'info') toast.style.background = '#2196F3';
  else toast.style.background = '';
  setTimeout(() => toast.classList.remove('show'), 3000);
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
}

function switchTab(tab) {
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
      // Sync local cart to backend after login
      syncFullCartToBackend();
    } else {
      const fullName = document.getElementById('authName').value.trim();
      if (!fullName) { errEl.textContent = 'Please enter your full name.'; errEl.style.display = 'block'; return; }
      const [firstName, ...rest] = fullName.split(' ');
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({firstName, lastName: rest.join(' '), email, password})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed.');
      showToast('Account created! Please sign in. ✅', 'success');
      switchTab('login');
    }
  } catch (err) {
    errEl.textContent = err.message; errEl.style.display = 'block';
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
    const res    = await fetch(`${API_BASE}/orders`, {headers: {'Authorization': `Bearer ${authToken}`}});
    if (!res.ok) throw new Error('Failed to load orders.');
    const data   = await res.json();
    const orders = data.content || data;
    if (!orders.length) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet. Start shopping! 🛍️</div>';
      return;
    }
    list.innerHTML = orders.map(o => `
      <div style="border:2px solid var(--border-color);border-radius:12px;padding:20px;margin-bottom:16px;background:white">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>📦 ${o.orderNumber}</strong>
          <span style="background:${statusColor(o.status)};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px">${o.status}</span>
        </div>
        <div>Total: <strong>₹${o.totalAmount?.toLocaleString()}</strong></div>
        <div>Payment: <span style="color:var(--text-muted)">${o.paymentMethod || 'COD'}</span></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
        ${(o.status === 'PENDING' || o.status === 'CONFIRMED')
          ? `<button onclick="cancelOrder(${o.id})" style="margin-top:10px;padding:6px 16px;background:#e74c3c;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px"><i class="fas fa-times"></i> Cancel Order</button>`
          : ''}
      </div>`).join('');
  } catch (e) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--accent-red)">${e.message}</div>`;
  }
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    if (!res.ok) throw new Error('Could not cancel order');
    showToast('Order cancelled successfully', 'info');
    showOrders(); // refresh
  } catch (e) {
    showToast(e.message, 'error');
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
function scrollToTop() { window.scrollTo({top: 0, behavior: 'smooth'}); }

window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('show', window.scrollY > 500);
});

// ============================================================
// CHECKOUT MODAL (NEW — Full checkout experience)
// ============================================================
function openCheckoutModal() {
  if (!cart.length) { showToast('Add items to cart first!', 'error'); return; }
  if (!authToken)   { openAuthModal(); showToast('Please login to checkout', 'info'); return; }
  toggleCart(); // close cart panel first
  renderCheckoutModal();
  document.getElementById('checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCheckoutModal() {
  const subtotal = cart.reduce((s, item) => {
    const p = PRODUCTS.find(x => x.id === item.id);
    return s + (p ? p.price * item.qty : 0);
  }, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const discount = Math.round(subtotal * 0.05);
  const total    = subtotal + shipping - discount;

  const orderSummaryHtml = cart.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:28px">${p.image || '📦'}</span>
          <div>
            <div style="font-size:13px;font-weight:600;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
            <div style="font-size:12px;color:#888">Qty: ${item.qty}</div>
          </div>
        </div>
        <div style="font-weight:700">₹${(p.price * item.qty).toLocaleString()}</div>
      </div>`;
  }).join('');

  document.getElementById('checkoutContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">

      <!-- LEFT: Address + Payment -->
      <div>
        <h3 style="margin:0 0 16px;font-size:16px;color:#333">📍 Delivery Address</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input id="ckName" placeholder="Full Name *" value="${currentUser?.name || ''}" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
          <input id="ckPhone" placeholder="Phone Number *" type="tel" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
          <textarea id="ckAddress" placeholder="House/Flat No, Street, Area *" rows="2" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;resize:none;outline:none;font-family:inherit"></textarea>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <input id="ckCity" placeholder="City *" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
            <input id="ckState" placeholder="State *" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
          </div>
          <input id="ckPincode" placeholder="PIN Code *" type="text" maxlength="6" style="padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
        </div>


        <h3 style="margin:20px 0 12px;font-size:16px;color:#333">💳 Payment Method</h3>
        <div id="paymentOptions" style="display:flex;flex-direction:column;gap:10px">
          <label onclick="selectPayment('COD')" id="pay-COD" style="display:flex;align-items:center;gap:12px;padding:14px;border:2px solid #7c3aed;border-radius:10px;cursor:pointer;background:#f5f3ff">
            <input type="radio" name="payment" value="COD" checked style="accent-color:#7c3aed">
            <span style="font-size:20px">💵</span>
            <div>
              <div style="font-weight:700;font-size:14px">Cash on Delivery</div>
              <div style="font-size:12px;color:#888">Pay when your order arrives</div>
            </div>
          </label>
          <label onclick="selectPayment('UPI')" id="pay-UPI" style="display:flex;align-items:center;gap:12px;padding:14px;border:2px solid #ddd;border-radius:10px;cursor:pointer">
            <input type="radio" name="payment" value="UPI" style="accent-color:#7c3aed">
            <span style="font-size:20px">📲</span>
            <div>
              <div style="font-weight:700;font-size:14px">UPI / PhonePe / GPay</div>
              <div style="font-size:12px;color:#888">Pay instantly via UPI</div>
            </div>
          </label>
          <label onclick="selectPayment('CARD')" id="pay-CARD" style="display:flex;align-items:center;gap:12px;padding:14px;border:2px solid #ddd;border-radius:10px;cursor:pointer">
            <input type="radio" name="payment" value="CARD" style="accent-color:#7c3aed">
            <span style="font-size:20px">💳</span>
            <div>
              <div style="font-weight:700;font-size:14px">Credit / Debit Card</div>
              <div style="font-size:12px;color:#888">Visa, Mastercard, RuPay</div>
            </div>
          </label>
          <label onclick="selectPayment('NETBANKING')" id="pay-NETBANKING" style="display:flex;align-items:center;gap:12px;padding:14px;border:2px solid #ddd;border-radius:10px;cursor:pointer">
            <input type="radio" name="payment" value="NETBANKING" style="accent-color:#7c3aed">
            <span style="font-size:20px">🏦</span>
            <div>
              <div style="font-weight:700;font-size:14px">Net Banking</div>
              <div style="font-size:12px;color:#888">All major banks supported</div>
            </div>
          </label>
        </div>

        <!-- UPI input shown dynamically -->
        <div id="upiInput" style="display:none;margin-top:12px">
          <input id="ckUpi" placeholder="Enter UPI ID (e.g. name@upi)" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box">
        </div>

        <!-- Coupon -->
        <div style="margin-top:16px;display:flex;gap:8px">
          <input id="ckCoupon" placeholder="Coupon code (optional)" style="flex:1;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none">
          <button onclick="applyCouponUI()" style="padding:10px 16px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;white-space:nowrap">Apply</button>
        </div>
        <div id="couponMsg" style="font-size:12px;margin-top:6px;color:#27ae60"></div>
      </div>

      <!-- RIGHT: Order Summary -->
      <div>
        <h3 style="margin:0 0 16px;font-size:16px;color:#333">🛒 Order Summary</h3>
        <div style="max-height:280px;overflow-y:auto">${orderSummaryHtml}</div>
        <div style="margin-top:16px;padding:16px;background:#f8f9ff;border-radius:10px;font-size:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span>Shipping</span><span style="color:#27ae60">${shipping === 0 ? 'FREE' : '₹' + shipping}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span>Member Discount (5%)</span><span style="color:#27ae60">-₹${discount.toLocaleString()}</span>
          </div>
          <div id="ckCouponDiscount" style="display:none;justify-content:space-between;margin-bottom:8px">
            <span>Coupon Discount</span><span id="ckCouponDiscountAmt" style="color:#27ae60"></span>
          </div>
          <hr style="border:none;border-top:1.5px dashed #ddd;margin:8px 0">
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700">
            <span>Total</span><span id="ckTotalDisplay">₹${total.toLocaleString()}</span>
          </div>
          <div style="font-size:11px;color:#888;margin-top:4px">Inclusive of all taxes</div>
        </div>

        <button id="placeOrderBtn" onclick="placeOrderFromCheckout()" style="width:100%;padding:16px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px">
          <i class="fas fa-lock"></i> Place Order Securely
        </button>
        <div style="text-align:center;font-size:12px;color:#888;margin-top:8px">
          <i class="fas fa-shield-alt"></i> 100% Secure & Encrypted
        </div>
      </div>
    </div>`;
}

let selectedPayment = 'COD';
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('#paymentOptions label').forEach(lbl => {
    lbl.style.border = '2px solid #ddd';
    lbl.style.background = '';
  });
  const chosen = document.getElementById(`pay-${method}`);
  if (chosen) { chosen.style.border = '2px solid #7c3aed'; chosen.style.background = '#f5f3ff'; }
  document.getElementById('upiInput').style.display = method === 'UPI' ? 'block' : 'none';
}

function applyCouponUI() {
  const code = document.getElementById('ckCoupon').value.trim().toUpperCase();
  const msg  = document.getElementById('couponMsg');
  // Demo coupon codes (backend validates actual coupons)
  const demoCoupons = { 'SAVE10': 10, 'WELCOME20': 20, 'FLAT50': 50 };
  if (demoCoupons[code]) {
    msg.textContent = `✅ Coupon applied! Extra ${demoCoupons[code]}% OFF`;
    msg.style.color = '#27ae60';
  } else {
    msg.textContent = '❌ Invalid coupon code. (Try SAVE10, WELCOME20, FLAT50)';
    msg.style.color = '#e74c3c';
  }
}

async function placeOrderFromCheckout() {
  const name    = document.getElementById('ckName')?.value.trim();
  const phone   = document.getElementById('ckPhone')?.value.trim();
  const address = document.getElementById('ckAddress')?.value.trim();
  const city    = document.getElementById('ckCity')?.value.trim();
  const state   = document.getElementById('ckState')?.value.trim();
  const pincode = document.getElementById('ckPincode')?.value.trim();
  const coupon  = document.getElementById('ckCoupon')?.value.trim().toUpperCase();
  const upiId   = document.getElementById('ckUpi')?.value.trim();

  if (!name || !phone || !address || !city || !state || !pincode) {
    showToast('Please fill in all delivery address fields ⚠️', 'error');
    return;
  }
  if (!/^\d{6}$/.test(pincode)) {
    showToast('Please enter a valid 6-digit PIN code', 'error');
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  if (selectedPayment === 'UPI' && !upiId) {
    showToast('Please enter your UPI ID', 'error');
    return;
  }

  const shippingAddress = `${name}, ${address}, ${city}, ${state} - ${pincode} | Phone: ${phone}`;

  const btn = document.getElementById('placeOrderBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
  btn.disabled = true;

  // For non-COD: show payment simulation
  if (selectedPayment !== 'COD') {
    await simulatePaymentGateway(selectedPayment, upiId);
  }

  try {
    // First sync cart to backend
    await syncFullCartToBackend();

    const res  = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        couponCode: coupon || null,
        shippingAddress,
        paymentMethod: selectedPayment,
        notes: selectedPayment === 'UPI' ? `UPI ID: ${upiId}` : ''
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order placement failed. Please try again.');

    // Success!
    cart = []; saveCart(); renderCartPanel();
    closeCheckoutModal();
    showOrderSuccess(data.orderNumber, selectedPayment, shippingAddress);

  } catch (err) {
    showToast(err.message, 'error');
    btn.innerHTML = '<i class="fas fa-lock"></i> Place Order Securely';
    btn.disabled = false;
  }
}

function simulatePaymentGateway(method, upiId) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'pgOverlay';
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center`;
    const box = document.createElement('div');
    box.style.cssText = `background:#fff;border-radius:20px;padding:40px;text-align:center;max-width:380px;width:90%`;

    const icon = method === 'UPI' ? '📲' : method === 'CARD' ? '💳' : '🏦';
    const label = method === 'UPI' ? `UPI: ${upiId}` : method === 'CARD' ? 'Credit/Debit Card' : 'Net Banking';

    box.innerHTML = `
      <div style="font-size:60px;margin-bottom:16px">${icon}</div>
      <h2 style="margin:0 0 8px;color:#333">Processing Payment</h2>
      <p style="color:#888;font-size:14px">Connecting to ${label}...</p>
      <div style="margin:20px auto;width:50px;height:50px;border:4px solid #f0f0f0;border-top:4px solid #7c3aed;border-radius:50%;animation:spin 1s linear infinite"></div>
      <p style="font-size:12px;color:#aaa">Secure payment powered by ShopWave Pay</p>`;

    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    setTimeout(() => {
      box.innerHTML = `
        <div style="font-size:60px;margin-bottom:16px">✅</div>
        <h2 style="margin:0 0 8px;color:#27ae60">Payment Successful!</h2>
        <p style="color:#888;font-size:14px">₹${cart.reduce((s,i) => { const p=PRODUCTS.find(x=>x.id===i.id); return s+(p?p.price*i.qty:0); },0).toLocaleString()} paid via ${label}</p>
        <div style="margin-top:16px;font-size:12px;color:#aaa">Confirming your order...</div>`;
      setTimeout(() => { document.body.removeChild(overlay); resolve(); }, 1500);
    }, 2500);
  });
}

function showOrderSuccess(orderNumber, paymentMethod, address) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center`;
  const box = document.createElement('div');
  box.style.cssText = `background:#fff;border-radius:20px;padding:40px;text-align:center;max-width:440px;width:90%;animation:bounceIn 0.4s ease`;
  const style = document.createElement('style');
  style.textContent = `@keyframes bounceIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
  document.head.appendChild(style);

  box.innerHTML = `
    <div style="font-size:80px;margin-bottom:16px">🎉</div>
    <h2 style="color:#27ae60;margin:0 0 8px">Order Placed!</h2>
    <p style="color:#333;font-weight:700;font-size:18px">${orderNumber}</p>
    <p style="color:#666;font-size:14px;margin:12px 0">
      <i class="fas fa-truck" style="color:#7c3aed"></i> Expected delivery in <strong>3-5 business days</strong>
    </p>
    <p style="color:#888;font-size:13px">Payment: <strong>${paymentMethod}</strong></p>
    <p style="color:#888;font-size:12px;word-break:break-word">${address.split('|')[0]}</p>
    <div style="display:flex;gap:12px;margin-top:24px;justify-content:center">
      <button onclick="this.closest('div[style*=fixed]').remove(); showOrders();" style="padding:12px 24px;background:#7c3aed;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700">
        <i class="fas fa-list"></i> View Orders
      </button>
      <button onclick="this.closest('div[style*=fixed]').remove();" style="padding:12px 24px;background:#f0f0f0;color:#333;border:none;border-radius:10px;cursor:pointer;font-weight:700">
        Continue Shopping
      </button>
    </div>`;

  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// OLD checkout function now redirects to new modal
function checkout() {
  openCheckoutModal();
}

// ============================================================
// INJECT CHECKOUT MODAL INTO DOM
// ============================================================
function injectCheckoutModal() {
  if (document.getElementById('checkoutModal')) return;
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:5000;
    display:flex;align-items:center;justify-content:center;
    opacity:0;pointer-events:none;transition:opacity 0.3s;
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;width:90%;max-width:900px;max-height:90vh;overflow-y:auto;padding:28px;position:relative">
      <button onclick="closeCheckoutModal()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#666">×</button>
      <h2 style="margin:0 0 20px;font-size:20px;color:#333"><i class="fas fa-lock" style="color:#7c3aed"></i> Secure Checkout</h2>
      <div id="checkoutContent"></div>
    </div>`;

  // Patch classList.add/remove to animate opacity
  const originalAdd = modal.classList.add.bind(modal.classList);
  const originalRemove = modal.classList.remove.bind(modal.classList);
  modal.classList.add = function(cls) {
    originalAdd(cls);
    if (cls === 'active') { modal.style.opacity = '1'; modal.style.pointerEvents = 'auto'; }
  };
  modal.classList.remove = function(cls) {
    originalRemove(cls);
    if (cls === 'active') { modal.style.opacity = '0'; modal.style.pointerEvents = 'none'; }
  };
  modal.classList.contains = function(cls) { return modal.classList.value.includes(cls); };

  document.body.appendChild(modal);
}

// Also add "Proceed to Checkout" button label fix
function patchCheckoutButton() {
  // The cart panel already has a checkout button — make sure it calls openCheckoutModal
  const btn = document.querySelector('.btn-checkout');
  if (btn) {
    btn.onclick = openCheckoutModal;
    btn.innerHTML = '<i class="fas fa-lock"></i> Proceed to Checkout';
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
  rebuildTrie();

  const cartTotal = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartBadge').textContent     = cartTotal;
  document.getElementById('cartCount').textContent     = cartTotal;
  document.getElementById('wishlistBadge').textContent = wishlist.length;
  updateNavAuth();

  // Inject checkout modal into DOM
  injectCheckoutModal();

  document.getElementById('authModal').addEventListener('click', e => {
    if (e.target === document.getElementById('authModal')) closeAuthModal();
  });
  document.getElementById('ordersModal').addEventListener('click', e => {
    if (e.target === document.getElementById('ordersModal')) closeOrdersModal();
  });
  document.getElementById('productModal').addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) closeModal();
  });

  // Patch checkout button after cart renders
  setTimeout(patchCheckoutButton, 500);

  // Fetch live products from backend
  fetchProducts();
}

init();


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

// =============================================
// AUTH MODULE
// =============================================
const openAuth  = () => document.getElementById('authOverlay').classList.add('open');
const closeAuth = () => document.getElementById('authOverlay').classList.remove('open');

const switchTab = (tab) => {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display    = isLogin ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('loginTab').classList.toggle('active', isLogin);
  document.getElementById('registerTab').classList.toggle('active', !isLogin);
};

const togglePwd = (id) => {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

const updateNavUser = () => {
  const u = getUser();
  const btn  = document.getElementById('authBtn');
  const label = document.getElementById('authLabel');
  if (u) {
    label.textContent = u.firstName || 'Account';
    btn.title = 'Signed in as ' + (u.email || '');
    btn.onclick = () => {
      if (confirm('Sign out?')) { clearAuth(); updateNavUser(); showToast('Signed out'); }
    };
  } else {
    label.textContent = 'Sign In';
    btn.onclick = openAuth;
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      })
    });
    setAuth(data.accessToken, { userId: data.userId, email: data.email, firstName: data.firstName, role: data.role });
    closeAuth();
    updateNavUser();
    showToast(`Welcome back, ${data.firstName}! 👋`);
    // Load cart from server
    loadCart();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials';
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  const btn   = document.getElementById('registerBtn');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Creating account...';
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email:     document.getElementById('regEmail').value.trim(),
        password:  document.getElementById('regPassword').value,
        firstName: document.getElementById('regFirst').value.trim(),
        lastName:  document.getElementById('regLast').value.trim(),
        phone:     document.getElementById('regPhone').value.trim(),
      })
    });
    setAuth(data.accessToken, { userId: data.userId, email: data.email, firstName: data.firstName, role: data.role });
    closeAuth();
    updateNavUser();
    showToast(`Account created! Welcome, ${data.firstName} 🎉`);
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed';
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
};

// Close on overlay click
document.getElementById('authOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAuth();
});


// =============================================
// CART MODULE (client-side state, syncs to API)
// =============================================
let cartItems = [];

const toggleCart = (open) => {
  document.getElementById('cartSidebar').classList.toggle('open', open);
  document.getElementById('cartOverlay').classList.toggle('open', open);
};

const updateCartBadge = () => {
  const count = cartItems.reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cartBadge').textContent = count;
  document.getElementById('cartBadgeSidebar').textContent = count;
};

const renderCart = () => {
  const el = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!cartItems.length) {
    el.innerHTML = `<div class="cart-empty-state"><div class="empty-icon">🛒</div><p>Your cart is empty</p><button class="btn-primary" onclick="toggleCart(false)">Continue Shopping</button></div>`;
    footer.style.display = 'none';
    return;
  }
  el.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy">` : `<span style="font-size:36px">${catEmoji(item.category)}</span>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price * item.quantity)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${idx}, -1)" aria-label="Decrease">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${idx}, 1)" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${idx})" aria-label="Remove">×</button>
    </div>`).join('');

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  document.getElementById('cartSubtotal').textContent = fmt(subtotal);
  document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : fmt(shipping);
  document.getElementById('cartTotal').textContent = fmt(subtotal + shipping);
  footer.style.display = 'flex';
};

const addToCart = (product) => {
  const existing = cartItems.find(i => i.id === product.id);
  if (existing) {
    existing.quantity++;
  } else {
    cartItems.push({ id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, imageUrl: product.imageUrl, category: product.category?.name || '' });
  }
  updateCartBadge();
  renderCart();
  showToast(`${product.name} added to cart 🛒`);

  // Also sync to API if logged in
  if (getToken()) {
    apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: 1 }) })
      .catch(() => {}); // silent fail
  }
};

const changeQty = (idx, delta) => {
  cartItems[idx].quantity = Math.max(1, cartItems[idx].quantity + delta);
  updateCartBadge(); renderCart();
};

const removeItem = (idx) => {
  const item = cartItems.splice(idx, 1)[0];
  updateCartBadge(); renderCart();
  if (getToken()) apiFetch(`/cart/items/${item.id}`, { method: 'DELETE' }).catch(() => {});
};

const loadCart = async () => {
  if (!getToken()) return;
  try {
    const data = await apiFetch('/cart');
    if (data && data.items) {
      cartItems = data.items.map(i => ({
        id: i.product.id, name: i.product.name,
        price: parseFloat(i.product.price), quantity: i.quantity,
        imageUrl: i.product.imageUrl, category: i.product.category?.name || ''
      }));
      updateCartBadge(); renderCart();
    }
  } catch (e) { /* silent */ }
};

const proceedCheckout = () => {
  if (!getUser()) { closeCart; toggleCart(false); openAuth(); showToast('Please sign in to checkout'); return; }
  showToast('Redirecting to checkout... 💳');
};


// =============================================
// PRODUCTS MODULE
// =============================================
let allProducts = [], filteredProducts = [], currentPage = 0, currentView = 'grid';
let currentCategory = '', currentSort = 'createdAt,desc';
let searchTimeout = null;

const renderStars = (rating) => {
  const r = Math.round((rating || 0) * 2) / 2;
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star ${i + 1 <= r ? '' : 'empty'}">★</span>`
  ).join('');
};

const productCardHtml = (p) => {
  const discount = p.originalPrice && p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100) : p.discountPercent || 0;
  const outOfStock = !p.stock || p.stock <= 0;
  const emoji = catEmoji(p.category?.name || '');
  return `
  <article class="product-card ${currentView === 'list' ? 'list-view' : ''}" role="listitem">
    <div class="product-img-wrap">
      ${p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" width="240" height="220">`
        : `<span class="product-emoji-placeholder">${emoji}</span>`}
      ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
      ${p.freeShipping ? `<span class="product-badge free-ship" style="top:${discount > 0 ? '52px' : '12px'}">Free Ship</span>` : ''}
      <button class="product-wishlist-btn" onclick="wishlistClick(event, ${p.id})" aria-label="Add to wishlist">♡</button>
    </div>
    <div class="product-body">
      ${p.brand ? `<div class="product-brand">${p.brand}</div>` : ''}
      <h3 class="product-name">${p.name}</h3>
      <div class="product-rating">
        <div class="stars">${renderStars(p.averageRating || 0)}</div>
        ${p.averageRating ? `<span class="rating-num">${(p.averageRating).toFixed(1)}</span>` : ''}
        ${p.totalReviews ? `<span class="review-count">(${p.totalReviews})</span>` : ''}
      </div>
      <div class="product-price">
        <span class="price-current">${fmt(p.price)}</span>
        ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
        ${discount > 0 ? `<span class="price-discount">${discount}% off</span>` : ''}
      </div>
      <div class="product-actions">
        ${outOfStock
          ? `<button class="btn-ghost btn-add-cart" disabled style="opacity:.5">Out of Stock</button>`
          : `<button class="btn-primary btn-add-cart" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">Add to Cart</button>`}
        <button class="btn-quick-view" onclick="openQV(${p.id})" aria-label="Quick view">👁</button>
      </div>
    </div>
  </article>`;
};

const renderProducts = (products, page = 0) => {
  const grid = document.getElementById('productGrid');
  const pSize = 12;
  const start = page * pSize, end = start + pSize;
  const slice = products.slice(start, end);
  if (!slice.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔍</div>
      <h3>No products found</h3>
      <p>Try adjusting your filters or search query</p>
      <button class="btn-ghost" onclick="clearFilters()">Clear Filters</button>
    </div>`;
  } else {
    grid.innerHTML = slice.map(productCardHtml).join('');
    // Animate in
    grid.querySelectorAll('.product-card:not(.skel-card)').forEach((c, i) => {
      c.style.opacity = '0'; c.style.transform = 'translateY(16px)';
      requestAnimationFrame(() => {
        setTimeout(() => { c.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; c.style.opacity = '1'; c.style.transform = 'none'; }, i * 40);
      });
    });
  }
  const count = products.length;
  document.getElementById('productsCount').textContent = `${count} product${count !== 1 ? 's' : ''}`;
  renderPagination(products.length, page, pSize);
};

const renderPagination = (total, page, size) => {
  const pages = Math.ceil(total / size);
  const el = document.getElementById('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn" onclick="goPage(${page - 1})" ${page === 0 ? 'disabled' : ''}>‹ Prev</button>`;
  for (let i = 0; i < pages; i++) {
    if (pages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== pages - 1) { if (Math.abs(i - page) === 3) html += `<span style="color:var(--color-text-muted);padding:0 4px">…</span>`; continue; }
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${page + 1})" ${page >= pages - 1 ? 'disabled' : ''}>Next ›</button>`;
  el.innerHTML = html;
};

const goPage = (p) => {
  currentPage = p;
  renderProducts(filteredProducts, p);
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const applyFilters = () => {
  const minP = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxP = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const minR = parseFloat(document.querySelector('input[name="rating"]:checked')?.value || '0');
  const inStock = document.getElementById('inStockOnly').checked;
  const freeShip = document.getElementById('freeShipOnly').checked;
  const brands = [...document.querySelectorAll('.brand-check:checked')].map(c => c.value);

  filteredProducts = allProducts.filter(p => {
    const price = parseFloat(p.price);
    if (price < minP || price > maxP) return false;
    if (minR > 0 && (p.averageRating || 0) < minR) return false;
    if (inStock && (!p.stock || p.stock <= 0)) return false;
    if (freeShip && !p.freeShipping) return false;
    if (brands.length && p.brand && !brands.includes(p.brand)) return false;
    return true;
  });

  // Sort
  const [sortBy, sortDir] = currentSort.split(',');
  filteredProducts.sort((a, b) => {
    let va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0;
    if (typeof va === 'string') va = va.toLowerCase(), vb = (vb||'').toLowerCase();
    return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
  });

  currentPage = 0;
  renderProducts(filteredProducts, 0);
  renderActiveFilters();
};

const renderActiveFilters = () => {
  const el = document.getElementById('activeFilters');
  const tags = [];
  const minP = document.getElementById('minPrice').value;
  const maxP = document.getElementById('maxPrice').value;
  if (minP || maxP) tags.push(`Price: ${minP ? '₹'+minP : '0'} – ${maxP ? '₹'+maxP : 'Any'}`);
  const minR = document.querySelector('input[name="rating"]:checked')?.value;
  if (minR && minR !== '0') tags.push(`${minR}+ Stars`);
  if (document.getElementById('inStockOnly').checked) tags.push('In Stock');
  if (document.getElementById('freeShipOnly').checked) tags.push('Free Shipping');
  el.innerHTML = tags.map(t => `<span class="filter-tag">${t}<button onclick="clearFilters()">×</button></span>`).join('');
};

const clearFilters = () => {
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.querySelector('input[name="rating"][value="0"]').checked = true;
  document.getElementById('inStockOnly').checked = false;
  document.getElementById('freeShipOnly').checked = false;
  document.querySelectorAll('.brand-check').forEach(c => c.checked = false);
  document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
  filteredProducts = [...allProducts];
  currentPage = 0;
  renderProducts(filteredProducts, 0);
  renderActiveFilters();
};

const setPrice = (min, max) => {
  document.getElementById('minPrice').value = min || '';
  document.getElementById('maxPrice').value = max > 0 && max < 999999 ? max : '';
  document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  applyFilters();
};

const filterByCategory = (btn, catId) => {
  currentCategory = catId;
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  loadProducts();
};

const handleSort = (val) => {
  currentSort = val;
  applyFilters();
};

const setView = (v) => {
  currentView = v;
  document.getElementById('gridViewBtn').classList.toggle('active', v === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', v === 'list');
  renderProducts(filteredProducts, currentPage);
};

const toggleFilters = () => {
  const el = document.getElementById('filtersSidebar');
  el.classList.toggle('hidden');
  el.classList.toggle('mobile-open');
};

let searchTimer = null;
const handleSearchInput = (val) => {
  clearTimeout(searchTimer);
  if (!val.trim()) { document.getElementById('searchSuggs').innerHTML = ''; return; }
  searchTimer = setTimeout(async () => {
    try {
      const suggs = await apiFetch(`/products/search/suggestions?prefix=${encodeURIComponent(val)}`);
      const el = document.getElementById('searchSuggs');
      if (suggs && suggs.length) {
        el.innerHTML = suggs.slice(0, 8).map(s => `<div class="sugg-item" onclick="doSearch('${s}')">${s}</div>`).join('');
        el.style.display = 'block';
      } else {
        el.innerHTML = ''; el.style.display = 'none';
      }
    } catch (e) { /* silent */ }
  }, 300);
};

const handleSearch = (e) => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (q) doSearch(q);
};

const doSearch = async (q) => {
  document.getElementById('searchInput').value = q;
  document.getElementById('searchSuggs').innerHTML = '';
  document.getElementById('searchSuggs').style.display = 'none';
  try {
    const data = await apiFetch(`/products/search?q=${encodeURIComponent(q)}&size=100`);
    allProducts = data.content || data || [];
    filteredProducts = [...allProducts];
    currentPage = 0;
    renderProducts(filteredProducts, 0);
  } catch (e) { showToast('Search failed'); }
};

// Quick View
let qvProductId = null;
const openQV = async (id) => {
  qvProductId = id;
  document.getElementById('qvOverlay').classList.add('open');
  document.getElementById('qvContent').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:300px"><div class="spin" style="font-size:36px">⟳</div></div>`;
  try {
    const p = await apiFetch(`/products/${id}`);
    renderQV(p);
  } catch (e) { document.getElementById('qvContent').innerHTML = '<p style="padding:2rem;text-align:center">Failed to load product.</p>'; }
};

const closeQV = () => document.getElementById('qvOverlay').classList.remove('open');

const renderQV = (p) => {
  const discount = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : p.discountPercent || 0;
  const emoji = catEmoji(p.category?.name || '');
  const specs = p.specifications ? Object.entries(p.specifications).slice(0, 5) : [];

  // Mock reviews (since backend may not have review endpoint, show UI)
  const mockReviews = [
    { name: 'Rahul S.', rating: 5, comment: 'Excellent product! Highly recommend.', date: '2 days ago' },
    { name: 'Priya M.', rating: 4, comment: 'Good quality, fast delivery.', date: '1 week ago' },
  ];

  document.getElementById('qvContent').innerHTML = `
  <div class="qv-inner">
    <div class="qv-img">
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">` : `<div class="big-emoji">${emoji}</div>`}
    </div>
    <div class="qv-info">
      ${p.brand ? `<div class="qv-brand">${p.brand}</div>` : ''}
      <h2 class="qv-name">${p.name}</h2>
      <div class="product-rating">
        <div class="stars">${renderStars(p.averageRating || 0)}</div>
        ${p.averageRating ? `<span class="rating-num">${(p.averageRating).toFixed(1)}</span>` : ''}
        ${p.totalReviews ? `<span class="review-count">(${p.totalReviews} reviews)</span>` : ''}
      </div>
      <div class="product-price">
        <span class="price-current">${fmt(p.price)}</span>
        ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
        ${discount > 0 ? `<span class="price-discount">${discount}% off</span>` : ''}
      </div>
      ${p.description ? `<p class="qv-desc">${p.description.slice(0, 200)}${p.description.length > 200 ? '…' : ''}</p>` : ''}
      ${specs.length ? `<div class="qv-specs">${specs.map(([k,v]) => `<div class="qv-spec-row"><span class="qv-spec-key">${k}</span><span class="qv-spec-val">${v}</span></div>`).join('')}</div>` : ''}
      <div class="stock-indicator ${p.stock > 10 ? 'stock-ok' : p.stock > 0 ? 'stock-low' : 'stock-out'}">
        ${p.stock > 10 ? '✓ In Stock' : p.stock > 0 ? `⚠ Only ${p.stock} left` : '✕ Out of Stock'}
      </div>
      <div class="qv-actions">
        ${p.stock > 0
          ? `<button class="btn-primary" onclick="addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')});closeQV()">Add to Cart 🛒</button>`
          : `<button class="btn-ghost" disabled>Out of Stock</button>`}
      </div>
    </div>
  </div>
  <div class="reviews-section">
    <h3 class="reviews-title">★ Customer Reviews ${p.totalReviews ? `<span style="color:var(--color-text-muted);font-size:var(--text-sm)">(${p.totalReviews})</span>` : ''}</h3>
    <div class="reviews-list">
      ${mockReviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="reviewer-avatar">${r.name[0]}</div>
          <span class="reviewer-name">${r.name}</span>
          <div class="stars">${renderStars(r.rating)}</div>
          <span class="review-date">${r.date}</span>
        </div>
        <p class="review-body">${r.comment}</p>
      </div>`).join('')}
    </div>
    <div class="write-review-form" id="writeReviewForm">
      <h4 class="write-review-title">Write a Review</h4>
      <div class="star-picker" id="starPicker">
        ${[1,2,3,4,5].map(n => `<button type="button" class="star-pick-btn" data-val="${n}" onclick="pickStar(${n}, this)" aria-label="${n} stars">★</button>`).join('')}
      </div>
      <div class="form-group" style="margin-bottom:var(--space-3)">
        <label for="reviewText">Your Review</label>
        <textarea id="reviewText" rows="3" style="padding:var(--space-3);border:1.5px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface);resize:vertical" placeholder="Share your experience with this product..."></textarea>
      </div>
      <button class="btn-primary" onclick="submitReview(${p.id})">Submit Review</button>
    </div>
  </div>`;
};

let pickedStar = 0;
const pickStar = (val, btn) => {
  pickedStar = val;
  document.querySelectorAll('.star-pick-btn').forEach((b, i) => b.classList.toggle('selected', i < val));
};

const submitReview = (productId) => {
  if (!getUser()) { showToast('Please sign in to write a review'); openAuth(); return; }
  if (!pickedStar) { showToast('Please select a star rating'); return; }
  const text = document.getElementById('reviewText').value.trim();
  if (!text) { showToast('Please write your review'); return; }
  showToast('Review submitted! Thank you ⭐');
  document.getElementById('writeReviewForm').innerHTML = '<p style="color:var(--color-success);font-weight:600">✓ Review submitted! It will appear after moderation.</p>';
  pickedStar = 0;
};

const wishlistClick = (e, id) => {
  e.stopPropagation();
  if (!getUser()) { openAuth(); return; }
  showToast('Added to wishlist ♡');
};

const loadCategories = async () => {
  try {
    const cats = await apiFetch('/categories');
    const scroll = document.getElementById('catsScroll');
    if (cats && cats.length) {
      scroll.innerHTML = `<button class="cat-chip active" data-cat="" onclick="filterByCategory(this,'')">All Products</button>`
        + cats.map(c => `<button class="cat-chip" data-cat="${c.id}" onclick="filterByCategory(this,'${c.id}')">${c.name}</button>`).join('');
    }
  } catch (e) { /* silent */ }
};

const loadBrands = () => {
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const el = document.getElementById('brandFilter');
  el.innerHTML = brands.length
    ? brands.map(b => `<label class="check-label"><input type="checkbox" class="brand-check" value="${b}" onchange="applyFilters()"> ${b}</label>`).join('')
    : '<p style="font-size:var(--text-xs);color:var(--color-text-muted)">No brands available</p>';
};

const loadProducts = async (page = 0) => {
  const [sortBy, sortDir] = currentSort.split(',');
  const catParam = currentCategory ? `&categoryId=${currentCategory}` : '';
  try {
    const endpoint = currentCategory
      ? `/products/category/${currentCategory}?page=${page}&size=100&sortBy=${sortBy}&sortDir=${sortDir}`
      : `/products?page=${page}&size=100&sortBy=${sortBy}&sortDir=${sortDir}`;
    const data = await apiFetch(endpoint);
    allProducts = data.content || data || [];
    filteredProducts = [...allProducts];
    currentPage = 0;
    loadBrands();
    applyFilters();
  } catch (e) {
    document.getElementById('productGrid').innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🔌</div>
      <h3>Could not load products</h3>
      <p>The server might be waking up (Render free tier). Try again in a moment.</p>
      <button class="btn-primary" onclick="loadProducts()">Retry</button>
    </div>`;
    document.getElementById('productsCount').textContent = '0 products';
  }
};

// Close overlays on outside click
document.getElementById('qvOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeQV(); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-search')) {
    const el = document.getElementById('searchSuggs');
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }
});

// =============================================
// APP INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  if (toggle) {
    updateThemeIcon(toggle, theme);
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateThemeIcon(toggle, theme);
    });
  }

  // Sticky navbar shadow
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  });

  // Load data
  loadCategories();
  loadProducts();
  updateNavUser();
});

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}
