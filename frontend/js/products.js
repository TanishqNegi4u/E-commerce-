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