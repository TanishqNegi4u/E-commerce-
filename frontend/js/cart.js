/* ═══════════════════════════════════════════════════════
   ShopWave — cart.js
   Local cart state + backend sync + wishlist
   ═══════════════════════════════════════════════════════ */

let cartItems   = [];
let wishlistIds = JSON.parse(localStorage.getItem('sw_wishlist') || '[]');

// ── Cart Sidebar ──────────────────────────────────────────
const toggleCart = open => {
  document.getElementById('cartSidebar').classList.toggle('open', !!open);
  document.getElementById('cartOverlay').classList.toggle('open', !!open);
  if (open) { document.body.style.overflow = 'hidden'; renderCart(); }
  else document.body.style.overflow = '';
};

const updateCartBadge = () => {
  const n = cartItems.reduce((s, i) => s + i.quantity, 0);
  ['cartBadge','cartBadgeSidebar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = n;
  });
};

const renderCart = () => {
  const el     = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!cartItems.length) {
    el.innerHTML = `<div class="cart-empty-state"><div class="empty-icon">🛒</div><p>Your cart is empty</p><button class="btn-primary" onclick="toggleCart(false)">Start Shopping</button></div>`;
    footer.style.display = 'none'; return;
  }
  el.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <span style="${item.imageUrl ? 'display:none' : ''};font-size:32px">${catEmoji(item.category)}</span>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price * item.quantity)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${idx},-1)" aria-label="Decrease quantity">−</button>
          <span class="qty-num">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${idx},1)" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${idx})" aria-label="Remove from cart">×</button>
    </div>`).join('');

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  document.getElementById('cartSubtotal').textContent = fmt(subtotal);
  document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : fmt(shipping);
  document.getElementById('cartTotal').textContent    = fmt(subtotal + shipping);
  footer.style.display = 'flex';
};

// ── Add to cart ───────────────────────────────────────────
const addToCart = product => {
  const p = typeof product === 'object' ? product : null;
  if (!p) return;
  const existing = cartItems.find(i => i.id === p.id);
  if (existing) {
    existing.quantity++;
  } else {
    cartItems.push({
      id:       p.id,
      name:     p.name,
      price:    parseFloat(p.price),
      quantity: 1,
      imageUrl: p.imageUrl || null,
      category: p.category?.name || '',
    });
  }
  updateCartBadge();
  renderCart();
  showToast(`${p.name.slice(0, 40)} added to cart 🛒`);
  if (getToken()) {
    apiFetch('/cart/items', { method:'POST', body: JSON.stringify({ productId: p.id, quantity: 1 }) })
      .catch(() => {});
  }
};

const changeQty = (idx, delta) => {
  cartItems[idx].quantity = Math.max(1, cartItems[idx].quantity + delta);
  updateCartBadge(); renderCart();
  const item = cartItems[idx];
  if (getToken()) {
    apiFetch(`/cart/items/${item.id}`, { method:'PUT', body: JSON.stringify({ quantity: item.quantity }) })
      .catch(() => {});
  }
};

const removeItem = idx => {
  const [item] = cartItems.splice(idx, 1);
  updateCartBadge(); renderCart();
  if (getToken()) apiFetch(`/cart/items/${item.id}`, { method:'DELETE' }).catch(() => {});
};

// ── Load cart from backend (after login) ─────────────────
const loadCart = async () => {
  if (!getToken()) return;
  try {
    const data = await apiFetch('/cart');
    if (data?.items?.length) {
      cartItems = data.items.map(i => ({
        id:       i.product.id,
        name:     i.product.name,
        price:    parseFloat(i.product.price),
        quantity: i.quantity,
        imageUrl: i.product.imageUrl || null,
        category: i.product.category?.name || '',
      }));
      updateCartBadge(); renderCart();
    }
  } catch { /* silent */ }
};

// ── Full cart sync to backend ─────────────────────────────
const syncCartToBackend = async () => {
  if (!getToken() || !cartItems.length) return;
  for (const item of cartItems) {
    await apiFetch('/cart/items', { method:'POST', body: JSON.stringify({ productId: item.id, quantity: item.quantity }) }).catch(() => {});
  }
};

// ── Wishlist ──────────────────────────────────────────────
const openWishlist = () => {
  document.getElementById('wishlistSidebar').classList.add('open');
  document.getElementById('wishlistOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderWishlist();
};
const closeWishlist = () => {
  document.getElementById('wishlistSidebar').classList.remove('open');
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

const toggleWishlist = (productId, productObj) => {
  const idx = wishlistIds.indexOf(productId);
  if (idx > -1) {
    wishlistIds.splice(idx, 1);
    showToast('Removed from wishlist', 'info');
  } else {
    wishlistIds.push(productId);
    if (productObj) {
      const stored = JSON.parse(localStorage.getItem('sw_wishlist_items') || '[]');
      if (!stored.find(p => p.id === productId)) { stored.push(productObj); localStorage.setItem('sw_wishlist_items', JSON.stringify(stored)); }
    }
    showToast('Added to wishlist ❤️');
  }
  localStorage.setItem('sw_wishlist', JSON.stringify(wishlistIds));
  updateWishlistBadge();
  // Re-render product to toggle heart
  const btn = document.querySelector(`.product-wishlist-btn[data-id="${productId}"]`);
  if (btn) btn.classList.toggle('active', wishlistIds.includes(productId));
};

const updateWishlistBadge = () => {
  const el = document.getElementById('wishlistBadge');
  if (el) el.textContent = wishlistIds.length;
};

const renderWishlist = () => {
  const el = document.getElementById('wishlistItems');
  const stored = JSON.parse(localStorage.getItem('sw_wishlist_items') || '[]');
  const items = stored.filter(p => wishlistIds.includes(p.id));
  if (!items.length) {
    el.innerHTML = `<div class="cart-empty-state"><div class="empty-icon">♡</div><p>Your wishlist is empty</p><button class="btn-primary" onclick="closeWishlist()">Start Shopping</button></div>`;
    return;
  }
  el.innerHTML = items.map(p => {
    const discount = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price/p.originalPrice)*100) : 0;
    return `<div class="cart-item">
      <div class="cart-item-img">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}">` : `<span style="font-size:32px">${catEmoji(p.category?.name||'')}</span>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${fmt(p.price)} ${discount ? `<small style="color:var(--accent-green);font-size:11px">${discount}% off</small>` : ''}</div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn-primary" style="font-size:12px;padding:6px 10px" onclick="addToCart(${JSON.stringify(p).replace(/"/g,'&quot;')});closeWishlist()">Add to Cart</button>
          <button class="btn-ghost" style="font-size:12px;padding:6px 10px" onclick="toggleWishlist(${p.id})">Remove</button>
        </div>
      </div>
    </div>`;
  }).join('');
};

// ── Checkout modal trigger ────────────────────────────────
const openCheckout = () => {
  if (!cartItems.length) { showToast('Add items to cart first!', 'error'); return; }
  if (!getUser()) { toggleCart(false); openAuth(); showToast('Please sign in to checkout', 'info'); return; }
  toggleCart(false);
  renderCheckoutModal();
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
const closeCheckout = () => {
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
