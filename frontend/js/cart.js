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