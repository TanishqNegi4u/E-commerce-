// ============================================================
// ShopWave — app.js  (FULLY FIXED VERSION)
// ✅ Backend cart sync  ✅ Checkout modal with address
// ✅ Payment options (COD / Online)  ✅ Live product fetch
// ✅ Buy Now → Checkout  ✅ Coupon code support
// ============================================================

// ── API CONFIG ───────────────────────────────────────────────
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
