/* ═══════════════════════════════════════════════════════
   ShopWave — products.js
   Product grid, filters, quick view, search, pagination
   ═══════════════════════════════════════════════════════ */

let allProducts      = [];
let filteredProducts = [];
let currentPage      = 0;
let currentView      = 'grid';
let currentCategory  = '';
let currentSort      = 'createdAt,desc';

// ── Product card HTML ─────────────────────────────────────
const productCardHtml = (p, isFlash = false) => {
  const discount   = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price/p.originalPrice)*100) : p.discountPercent || 0;
  const outOfStock = !p.stock || p.stock <= 0;
  const emoji      = catEmoji(p.category?.name || '');
  const inWish     = wishlistIds.includes(p.id);

  if (isFlash) {
    return `<div class="flash-card" onclick="openQV(${p.id})" role="listitem">
      <div class="flash-img">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">` : emoji}
      </div>
      <div class="flash-info">
        <div class="flash-name">${p.name}</div>
        <div class="flash-price">${fmt(p.price)}</div>
        ${discount ? `<div class="flash-discount">${discount}% OFF</div>` : ''}
      </div>
    </div>`;
  }

  const pData = JSON.stringify({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, category: p.category }).replace(/"/g,'&quot;');

  return `<article class="product-card${currentView === 'list' ? ' list-view' : ''}" role="listitem">
    <div class="product-img-wrap">
      ${p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" width="200" height="160" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <span class="product-emoji-placeholder" style="${p.imageUrl ? 'display:none' : ''}">${emoji}</span>
      ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
      ${p.freeShipping ? `<span class="product-badge free-ship" style="top:${discount>0?'40px':'10px'}">FREE</span>` : ''}
      <button class="product-wishlist-btn ${inWish ? 'active' : ''}" data-id="${p.id}"
        onclick="toggleWishlist(${p.id}, ${pData}); this.classList.toggle('active')"
        aria-label="${inWish ? 'Remove from' : 'Add to'} wishlist">
        ${inWish ? '♥' : '♡'}
      </button>
    </div>
    <div class="product-body">
      ${p.brand ? `<div class="product-brand">${p.brand}</div>` : ''}
      <h3 class="product-name">${p.name}</h3>
      <div class="product-rating">
        <div class="stars">${starsHtml(p.averageRating || 0)}</div>
        ${p.averageRating ? `<span class="rating-num">${(+p.averageRating).toFixed(1)}</span>` : ''}
        ${p.totalReviews ? `<span class="review-count">(${p.totalReviews.toLocaleString('en-IN')})</span>` : ''}
      </div>
      <div class="product-price">
        <span class="price-current">${fmt(p.price)}</span>
        ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
        ${discount > 0 ? `<span class="price-discount">${discount}% off</span>` : ''}
      </div>
      <div class="product-actions">
        ${outOfStock
          ? `<button class="btn-ghost" disabled style="opacity:.5;flex:1">Out of Stock</button>`
          : `<button class="btn-primary" onclick="addToCart(${pData})">🛒 Add to Cart</button>`}
        <button class="btn-quick-view" onclick="openQV(${p.id})" aria-label="Quick view">👁</button>
      </div>
    </div>
  </article>`;
};

// ── Render product grid ───────────────────────────────────
const PAGE_SIZE = 16;
const renderProducts = (products, page = 0) => {
  const grid  = document.getElementById('productsGrid');
  const start = page * PAGE_SIZE;
  const slice = products.slice(start, start + PAGE_SIZE);

  if (currentView === 'list') grid.classList.add('list-mode');
  else grid.classList.remove('list-mode');

  if (!slice.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <h3>No products found</h3>
      <p>Try different filters or search terms</p>
      <button class="btn-ghost" onclick="clearFilters()">Clear Filters</button>
    </div>`;
  } else {
    grid.innerHTML = slice.map(p => productCardHtml(p)).join('');
    // Staggered animation
    grid.querySelectorAll('.product-card').forEach((c, i) => {
      c.style.opacity = '0'; c.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => setTimeout(() => {
        c.style.transition = 'opacity .28s ease, transform .28s ease';
        c.style.opacity = '1'; c.style.transform = 'none';
      }, i * 35));
    });
  }
  document.getElementById('resultsCount').textContent =
    `${products.length.toLocaleString('en-IN')} product${products.length !== 1 ? 's' : ''}`;
  renderPagination(products.length, page);
};

// ── Pagination ────────────────────────────────────────────
const renderPagination = (total, page) => {
  const pages = Math.ceil(total / PAGE_SIZE);
  const el    = document.getElementById('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn" onclick="goPage(${page-1})" ${page===0?'disabled':''}>&lsaquo; Prev</button>`;
  for (let i = 0; i < pages; i++) {
    if (pages > 7 && Math.abs(i-page) > 2 && i !== 0 && i !== pages-1) {
      if (Math.abs(i-page) === 3) html += `<span style="padding:0 6px;color:var(--text-muted)">…</span>`;
      continue;
    }
    html += `<button class="page-btn${i===page?' active':''}" onclick="goPage(${i})">${i+1}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage(${page+1})" ${page>=pages-1?'disabled':''}>Next &rsaquo;</button>`;
  el.innerHTML = html;
};

const goPage = p => {
  currentPage = p;
  renderProducts(filteredProducts, p);
  document.getElementById('productsSection').scrollIntoView({ behavior:'smooth', block:'start' });
};

// ── Filters ───────────────────────────────────────────────
const applyFilters = () => {
  const minP   = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxP   = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const minR   = parseFloat(document.querySelector('input[name="rating"]:checked')?.value || '0');
  const inSt   = document.getElementById('inStockOnly').checked;
  const freeSh = document.getElementById('freeShipOnly').checked;
  const brands = [...document.querySelectorAll('.brand-check:checked')].map(c => c.value);

  filteredProducts = allProducts.filter(p => {
    if (parseFloat(p.price) < minP || parseFloat(p.price) > maxP) return false;
    if (minR > 0 && (p.averageRating || 0) < minR) return false;
    if (inSt && (!p.stock || p.stock <= 0)) return false;
    if (freeSh && !p.freeShipping) return false;
    if (brands.length && p.brand && !brands.includes(p.brand)) return false;
    return true;
  });

  const [sortBy, dir] = currentSort.split(',');
  filteredProducts.sort((a, b) => {
    let va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0;
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
    return dir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
  });

  currentPage = 0;
  renderProducts(filteredProducts, 0);
  renderActiveFilters();
};

const renderActiveFilters = () => {
  const el = document.getElementById('activeFilters') || {innerHTML:''};
  const tags = [];
  const minP = document.getElementById('minPrice').value;
  const maxP = document.getElementById('maxPrice').value;
  if (minP || maxP) tags.push(`₹${minP||0} – ${maxP ? '₹'+maxP : 'Any'}`);
  const minR = document.querySelector('input[name="rating"]:checked')?.value;
  if (minR && minR !== '0') tags.push(`${minR}★+`);
  if (document.getElementById('inStockOnly').checked) tags.push('In Stock');
  if (document.getElementById('freeShipOnly').checked) tags.push('Free Ship');
  el.innerHTML = tags.map(t => `<span class="filter-tag">${t}<button onclick="clearFilters()">×</button></span>`).join('');
};

const clearFilters = () => {
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  const r0 = document.querySelector('input[name="rating"][value="0"]');
  if (r0) r0.checked = true;
  document.getElementById('inStockOnly').checked  = false;
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
  document.getElementById('maxPrice').value = (max > 0 && max < 1e7) ? max : '';
  document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  applyFilters();
};

const handleSort = val => { currentSort = val; applyFilters(); };

const setView = v => {
  currentView = v;
  document.getElementById('gridViewBtn').classList.toggle('active', v === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', v === 'list');
  renderProducts(filteredProducts, currentPage);
};

const toggleFilters = () => {
  document.getElementById('filtersSidebar').classList.toggle('mobile-open');
};

// ── Load brands into sidebar ──────────────────────────────
const loadBrands = () => {
  const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
  const el = document.getElementById('brandFilters');
  el.innerHTML = brands.length
    ? brands.map(b => `<label class="check-label"><input type="checkbox" class="brand-check" value="${b}" onchange="applyFilters()"> ${b}</label>`).join('')
    : '<p class="no-brands">No brands available</p>';
};

// ── Fetch products from API ───────────────────────────────
const loadProducts = async () => {
  const [sortBy, dir] = currentSort.split(',');
  const endpoint = currentCategory
    ? `/products/category/${currentCategory}?page=0&size=100&sortBy=${sortBy}&sortDir=${dir}`
    : `/products?page=0&size=100&sortBy=${sortBy}&sortDir=${dir}`;
  try {
    const data = await apiFetch(endpoint);
    allProducts      = data.content || data || [];
    filteredProducts = [...allProducts];
    loadBrands();
    applyFilters();
    renderFlashDeals();
  } catch {
    // Fallback to static data
    allProducts      = [...STATIC_PRODUCTS];
    filteredProducts = [...allProducts];
    loadBrands();
    applyFilters();
    renderFlashDeals();
    document.getElementById('resultsCount').textContent = `${allProducts.length} products (demo)`;
  }
};

// ── Load categories ───────────────────────────────────────
const loadCategories = async () => {
  try {
    const cats = await apiFetch('/categories');
    if (!cats?.length) return;
    // We already have static cat bar, but update with real ones
    const scroll = document.querySelector('.cat-bar-inner');
    if (scroll && cats.length > 0) {
      scroll.innerHTML =
        `<button class="cat-link active" onclick="catBarClick(this,'')">All</button>` +
        cats.map(c => `<button class="cat-link" onclick="catBarClick(this,'${c.id}')">${catEmoji(c.name)} ${c.name}</button>`).join('');
    }
  } catch { /* use static cat bar */ }
};

// ── Category bar click ────────────────────────────────────
const catBarClick = (btn, cat) => {
  document.querySelectorAll('.cat-link').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // If cat is a string name (from static), filter by name; if ID, use API
  const isId = !isNaN(cat) && cat !== '';
  if (isId) {
    currentCategory = cat;
    loadProducts();
  } else {
    currentCategory = '';
    if (cat === '') {
      filteredProducts = [...allProducts];
    } else {
      filteredProducts = allProducts.filter(p => p.category?.name === cat);
    }
    currentPage = 0;
    renderProducts(filteredProducts, 0);
  }
  scrollToProducts();
};

const scrollToProducts = () => {
  document.getElementById('productsSection').scrollIntoView({ behavior:'smooth', block:'start' });
};

// ── Flash deals ───────────────────────────────────────────
const renderFlashDeals = () => {
  const el = document.getElementById('flashScroll');
  if (!el) return;
  const shuffled = [...allProducts].sort(() => Math.random() - .5).slice(0, 10);
  el.innerHTML = shuffled.map(p => productCardHtml(p, true)).join('');
};

// ── Search ────────────────────────────────────────────────
let _searchTimer = null;
const handleSearchInput = val => {
  clearTimeout(_searchTimer);
  const el = document.getElementById('searchSuggs');
  if (!val.trim()) { el.innerHTML = ''; el.style.display = 'none'; return; }
  _searchTimer = setTimeout(() => {
    // Local trie-style filter on loaded products
    const q    = val.toLowerCase();
    const hits = allProducts
      .filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 8)
      .map(p => p.name);
    if (hits.length) {
      el.innerHTML = hits.map(s => `<div class="sugg-item" onclick="doSearch('${s.replace(/'/g,"\\'")}')">${highlight(s, val)}</div>`).join('');
      el.style.display = 'block';
    } else { el.innerHTML = ''; el.style.display = 'none'; }
  }, 200);
};

const highlight = (str, q) => {
  const i = str.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return str;
  return str.slice(0,i) + `<strong style="color:var(--primary)">${str.slice(i,i+q.length)}</strong>` + str.slice(i+q.length);
};

const handleSearch = e => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim();
  if (q) doSearch(q);
};

const doSearch = async q => {
  document.getElementById('searchInput').value = q;
  const el = document.getElementById('searchSuggs');
  el.innerHTML = ''; el.style.display = 'none';
  try {
    const data = await apiFetch(`/products/search?q=${encodeURIComponent(q)}&size=100`);
    allProducts      = data.content || data || [];
    filteredProducts = [...allProducts];
    loadBrands();
    applyFilters();
  } catch {
    // Fallback: local filter
    const ql = q.toLowerCase();
    filteredProducts = allProducts.filter(p =>
      p.name?.toLowerCase().includes(ql) ||
      p.brand?.toLowerCase().includes(ql) ||
      p.category?.name?.toLowerCase().includes(ql));
    currentPage = 0;
    renderProducts(filteredProducts, 0);
  }
  scrollToProducts();
};

// ── Quick View Modal ──────────────────────────────────────
const openQV = async id => {
  document.getElementById('qvOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('qvContent').innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading product…</p></div>`;
  try {
    const p = await apiFetch(`/products/${id}`);
    renderQV(p);
  } catch {
    // Use local data
    const p = allProducts.find(x => x.id === id) || STATIC_PRODUCTS.find(x => x.id === id);
    if (p) renderQV(p);
    else document.getElementById('qvContent').innerHTML = '<p style="padding:2rem;text-align:center">Could not load product.</p>';
  }
};

const closeQV = () => {
  document.getElementById('qvOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

const renderQV = p => {
  const discount = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price/p.originalPrice)*100) : p.discountPercent || 0;
  const emoji    = catEmoji(p.category?.name || '');
  const specs    = p.specifications ? Object.entries(p.specifications).slice(0, 6) : [];
  const pData    = JSON.stringify({ id:p.id, name:p.name, price:p.price, imageUrl:p.imageUrl, category:p.category }).replace(/"/g,'&quot;');

  document.getElementById('qvContent').innerHTML = `
    <div class="qv-inner">
      <div class="qv-img">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">` : `<div class="big-emoji">${emoji}</div>`}
      </div>
      <div class="qv-info">
        ${p.brand ? `<div class="qv-brand">${p.brand}</div>` : ''}
        <h2 class="qv-name">${p.name}</h2>
        <div class="product-rating">
          <div class="stars">${starsHtml(p.averageRating || 0)}</div>
          ${p.averageRating ? `<span class="rating-num">${(+p.averageRating).toFixed(1)}</span>` : ''}
          ${p.totalReviews ? `<span class="review-count">(${p.totalReviews.toLocaleString('en-IN')} ratings)</span>` : ''}
        </div>
        <div class="product-price" style="margin:12px 0">
          <span class="price-current" style="font-size:22px">${fmt(p.price)}</span>
          ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">${fmt(p.originalPrice)}</span>` : ''}
          ${discount > 0 ? `<span class="price-discount">${discount}% off</span>` : ''}
        </div>
        ${p.description ? `<p class="qv-desc">${p.description.slice(0,250)}${p.description.length>250?'…':''}</p>` : ''}
        ${specs.length ? `<div class="qv-specs">${specs.map(([k,v])=>`<div class="qv-spec-row"><span class="qv-spec-key">${k}</span><span class="qv-spec-val">${v}</span></div>`).join('')}</div>` : ''}
        <div class="stock-indicator ${p.stock>10?'stock-ok':p.stock>0?'stock-low':'stock-out'}" style="margin:12px 0">
          ${p.stock>10 ? '✓ In Stock' : p.stock>0 ? `⚠ Only ${p.stock} left` : '✕ Out of Stock'}
        </div>
        <div class="qv-actions">
          ${p.stock > 0
            ? `<button class="btn-primary" style="padding:12px 20px;font-size:14px" onclick="addToCart(${pData});closeQV()">🛒 Add to Cart</button>
               <button class="btn-buy-now" onclick="addToCart(${pData});closeQV();openCheckout()">⚡ Buy Now</button>`
            : `<button class="btn-ghost" disabled>Out of Stock</button>`}
        </div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:var(--text-muted)">
          <span>🚚 Free delivery on orders ₹500+</span>
          <span>🔄 30-day easy return policy</span>
          <span>🛡️ Secure checkout guaranteed</span>
        </div>
      </div>
    </div>
    <div class="reviews-section">
      <h3 class="reviews-title">★ Customer Reviews</h3>
      <div class="reviews-list">
        ${[
          {name:'Rahul S.', rating:5, text:'Excellent product! Highly recommend to everyone.', date:'2 days ago'},
          {name:'Priya M.', rating:4, text:'Good quality, delivered fast. Worth the price.', date:'1 week ago'},
          {name:'Amit K.', rating:4, text:'Packaging was good. Product works as described.', date:'2 weeks ago'},
        ].map(r => `<div class="review-card">
          <div class="review-header">
            <div class="reviewer-avatar">${r.name[0]}</div>
            <span class="reviewer-name">${r.name}</span>
            <div class="stars">${starsHtml(r.rating)}</div>
            <span class="review-date">${r.date}</span>
          </div>
          <p class="review-body">${r.text}</p>
        </div>`).join('')}
      </div>
      <div class="write-review-form" id="writeReviewForm">
        <h4 class="write-review-title">Write a Review</h4>
        <div class="star-picker" id="starPicker">
          ${[1,2,3,4,5].map(n=>`<button type="button" class="star-pick-btn" onclick="pickStar(${n},this)">★</button>`).join('')}
        </div>
        <div class="form-group">
          <label>Your Review</label>
          <textarea id="reviewText" rows="3" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text1);resize:vertical;font-family:var(--font)" placeholder="Share your experience…"></textarea>
        </div>
        <button class="btn-primary" style="padding:10px 20px" onclick="submitReview(${p.id})">Submit Review</button>
      </div>
    </div>`;
};

let _pickedStar = 0;
const pickStar = (val, btn) => {
  _pickedStar = val;
  document.querySelectorAll('.star-pick-btn').forEach((b, i) => b.classList.toggle('selected', i < val));
};
const submitReview = productId => {
  if (!getUser()) { showToast('Please sign in to review', 'info'); openAuth(); return; }
  if (!_pickedStar) { showToast('Select a star rating'); return; }
  const text = document.getElementById('reviewText').value.trim();
  if (!text) { showToast('Please write your review'); return; }
  showToast('Review submitted! Thank you ⭐', 'success');
  document.getElementById('writeReviewForm').innerHTML = '<p style="color:var(--accent-green);font-weight:700;padding:10px">✓ Review submitted! It will appear after moderation.</p>';
  _pickedStar = 0;
};

// ── Load More (pagination via button) ────────────────────
const loadMoreProducts = () => {
  const nextPage = currentPage + 1;
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  if (nextPage >= totalPages) {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) { btn.textContent = 'No more products'; btn.disabled = true; }
    return;
  }
  currentPage = nextPage;
  const grid = document.getElementById('productsGrid');
  const slice = filteredProducts.slice(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = slice.map(p => productCardHtml(p)).join('');
  tempDiv.querySelectorAll('.product-card').forEach((c, i) => {
    c.style.opacity = '0'; c.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => setTimeout(() => {
      c.style.transition = 'opacity .28s ease, transform .28s ease';
      c.style.opacity = '1'; c.style.transform = 'none';
    }, i * 35));
    grid.appendChild(c);
  });
  const btn = document.getElementById('loadMoreBtn');
  if (btn) {
    const remaining = filteredProducts.length - (currentPage + 1) * PAGE_SIZE;
    if (remaining <= 0) { btn.textContent = 'No more products'; btn.disabled = true; }
    else btn.disabled = false;
  }
};

// Close search suggestions on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-search')) {
    const el = document.getElementById('searchSuggs');
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }
});
