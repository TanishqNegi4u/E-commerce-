/* ═══════════════════════════════════════════════════════
   ShopWave — app.js
   Hero slider, countdown, checkout, orders, init
   ═══════════════════════════════════════════════════════ */

// ── Hero Slider ───────────────────────────────────────────
let _slide = 0;
const shiftSlide = dir => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  slides[_slide].classList.remove('active');
  dots[_slide]?.classList.remove('active');
  _slide = (_slide + dir + slides.length) % slides.length;
  slides[_slide].classList.add('active');
  dots[_slide]?.classList.add('active');
};

const initHero = () => {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsEl = document.getElementById('heroDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = Array.from(slides, (_, i) =>
    `<button class="hero-dot${i===0?' active':''}" onclick="shiftSlide(${i-_slide}||1)" aria-label="Slide ${i+1}"></button>`
  ).join('');
  setInterval(() => shiftSlide(1), 5000);
};

// ── Countdown Timer ───────────────────────────────────────
let _cdSecs = 4*3600 + 47*60 + 23;
const tickCountdown = () => {
  if (_cdSecs <= 0) return;
  _cdSecs--;
  const h = Math.floor(_cdSecs/3600), m = Math.floor((_cdSecs%3600)/60), s = _cdSecs%60;
  const pad = n => String(n).padStart(2,'0');
  const hEl=document.getElementById('cdH'), mEl=document.getElementById('cdM'), sEl=document.getElementById('cdS');
  if (hEl) hEl.textContent = pad(h);
  if (mEl) mEl.textContent = pad(m);
  if (sEl) sEl.textContent = pad(s);
};
setInterval(tickCountdown, 1000);

// ── Orders Modal ──────────────────────────────────────────
const showOrders = async () => {
  if (!getUser()) { openAuth(); showToast('Please sign in to view orders', 'info'); return; }
  document.getElementById('ordersOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const list = document.getElementById('ordersList');
  list.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading your orders…</p></div>`;
  try {
    const data   = await apiFetch('/orders');
    const orders = data.content || data || [];
    if (!orders.length) {
      list.innerHTML = `<div class="loading-state"><p>No orders yet. Start shopping! 🛍️</p></div>`;
      return;
    }
    const statusColors = { PENDING:'#FF9800', CONFIRMED:'#2196F3', SHIPPED:'#00BCD4', DELIVERED:'#4CAF50', CANCELLED:'#F44336', REFUNDED:'#607D8B' };
    list.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-top">
          <span class="order-num">📦 ${o.orderNumber || 'ORD-' + o.id}</span>
          <span class="order-status-badge" style="background:${statusColors[o.status]||'#666'}">${o.status}</span>
        </div>
        <div class="order-details">
          <div>Payment: <strong>${o.paymentMethod || 'COD'}</strong></div>
          <div>Date: ${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
          <div class="order-total">${fmt(o.totalAmount)}</div>
        </div>
        ${(o.status==='PENDING'||o.status==='CONFIRMED')
          ? `<button class="btn-cancel" onclick="cancelOrder(${o.id})">Cancel Order</button>` : ''}
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<div class="loading-state"><p style="color:var(--accent-red)">${err.message}</p></div>`;
  }
};

const cancelOrder = async id => {
  if (!confirm('Cancel this order?')) return;
  try {
    await apiFetch(`/orders/${id}/cancel`, { method:'PUT' });
    showToast('Order cancelled', 'info');
    showOrders();
  } catch (e) { showToast(e.message, 'error'); }
};

const closeOrders = () => {
  document.getElementById('ordersOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Checkout Modal ────────────────────────────────────────
let _selectedPayment = 'COD';
let _couponDiscount  = 0;

const renderCheckoutModal = () => {
  const subtotal = cartItems.reduce((s,i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const memberDisc = Math.round(subtotal * 0.05);
  const total = subtotal + shipping - memberDisc - _couponDiscount;

  document.getElementById('checkoutBody').innerHTML = `
    <div class="checkout-grid">

      <!-- LEFT: Address + Payment -->
      <div>
        <div class="checkout-section-title">📍 Delivery Address</div>
        <div class="form-group"><label>Full Name *</label>
          <input id="ckName" placeholder="Enter full name" value="${getUser()?.firstName ? getUser().firstName : ''}"></div>
        <div class="form-group"><label>Phone Number *</label>
          <input id="ckPhone" type="tel" placeholder="10-digit mobile number"></div>
        <div class="form-group"><label>Address *</label>
          <textarea id="ckAddr" rows="2" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);color:var(--text1);font-family:var(--font);resize:none;outline:none" placeholder="House no, Street, Area, Landmark"></textarea></div>
        <div class="form-grid-2">
          <div class="form-group"><label>City *</label><input id="ckCity" placeholder="City"></div>
          <div class="form-group"><label>State *</label><input id="ckState" placeholder="State"></div>
        </div>
        <div class="form-group"><label>PIN Code *</label><input id="ckPin" placeholder="6-digit PIN" maxlength="6"></div>

        <div class="checkout-section-title" style="margin-top:20px">💳 Payment Method</div>
        ${[
          {id:'COD', icon:'💵', label:'Cash on Delivery', sub:'Pay when your order arrives'},
          {id:'UPI', icon:'📲', label:'UPI / PhonePe / GPay', sub:'Pay instantly via UPI'},
          {id:'CARD', icon:'💳', label:'Credit / Debit Card', sub:'Visa, Mastercard, RuPay'},
          {id:'NETBANKING', icon:'🏦', label:'Net Banking', sub:'All major banks supported'},
        ].map(m => `
          <div class="payment-option${_selectedPayment===m.id?' selected':''}" onclick="selectPayment('${m.id}',this)">
            <input type="radio" name="payment" value="${m.id}" ${_selectedPayment===m.id?'checked':''}>
            <span class="payment-option-icon">${m.icon}</span>
            <div><div class="payment-option-label">${m.label}</div><div class="payment-option-sub">${m.sub}</div></div>
          </div>`).join('')}

        <div id="upiInputWrap" style="display:${_selectedPayment==='UPI'?'':'none'};margin-top:8px">
          <div class="form-group"><label>UPI ID</label><input id="ckUpi" placeholder="yourname@upi"></div>
        </div>
      </div>

      <!-- RIGHT: Order Summary -->
      <div>
        <div class="checkout-section-title">🛒 Order Summary</div>
        <div class="order-summary-box">
          <div class="summary-items">
            ${cartItems.map(item => `
              <div class="summary-item">
                <div class="summary-item-info">
                  <span class="summary-item-emoji">${catEmoji(item.category)}</span>
                  <div>
                    <div class="summary-item-name">${item.name}</div>
                    <div class="summary-item-qty">Qty: ${item.quantity}</div>
                  </div>
                </div>
                <span class="summary-item-price">${fmt(item.price * item.quantity)}</span>
              </div>`).join('')}
          </div>

          <!-- Coupon -->
          <div class="coupon-wrap">
            <input id="ckCoupon" placeholder="Coupon code (SAVE10, FLAT50…)">
            <button class="btn-apply-coupon" onclick="applyCoupon()">Apply</button>
          </div>
          <div id="couponMsg" class="coupon-msg"></div>

          <div class="price-breakdown" style="margin-top:14px">
            <div class="price-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div class="price-row"><span>Shipping</span><span class="${shipping===0?'saving':''}">${shipping===0?'FREE':fmt(shipping)}</span></div>
            <div class="price-row"><span>Member Discount (5%)</span><span class="saving">-${fmt(memberDisc)}</span></div>
            <div id="couponRow" class="price-row" style="display:none"><span>Coupon Discount</span><span class="saving" id="couponAmt"></span></div>
            <div class="price-row grand">
              <span>Grand Total</span>
              <span id="checkoutTotal">${fmt(total)}</span>
            </div>
          </div>
          <div class="secure-note">🔒 100% Secure &amp; Encrypted</div>

          <button id="placeOrderBtn" class="btn-place-order" onclick="placeOrder()">
            🔒 Place Order — ${fmt(total)}
          </button>
          <div class="secure-note" style="margin-top:6px">✓ Order confirmation will be sent by email</div>
        </div>
      </div>
    </div>`;
};

const selectPayment = (method, el) => {
  _selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
  const wrap = document.getElementById('upiInputWrap');
  if (wrap) wrap.style.display = method === 'UPI' ? '' : 'none';
};

const COUPONS = { 'SAVE10':10, 'WELCOME20':20, 'FLAT50':50, 'SW2026':15 };
const applyCoupon = async () => {
  const code  = document.getElementById('ckCoupon').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMsg');
  // Try backend first
  try {
    const data = await apiFetch(`/coupons/validate?code=${encodeURIComponent(code)}`);
    if (data?.discountPercent) {
      const subtotal = cartItems.reduce((s,i) => s + i.price * i.quantity, 0);
      _couponDiscount = Math.round(subtotal * data.discountPercent / 100);
      msgEl.textContent = `✅ Coupon applied! ${data.discountPercent}% OFF`;
      msgEl.className = 'coupon-msg coupon-ok';
      updateCheckoutTotal();
      return;
    }
  } catch { /* fallback */ }

  // Client-side demo coupons
  if (COUPONS[code]) {
    const subtotal = cartItems.reduce((s,i) => s + i.price * i.quantity, 0);
    _couponDiscount = Math.round(subtotal * COUPONS[code] / 100);
    msgEl.textContent = `✅ Coupon applied! ${COUPONS[code]}% OFF`;
    msgEl.className = 'coupon-msg coupon-ok';
    updateCheckoutTotal();
  } else {
    _couponDiscount = 0;
    msgEl.textContent = '❌ Invalid coupon. Try: SAVE10, WELCOME20, FLAT50';
    msgEl.className = 'coupon-msg coupon-err';
    updateCheckoutTotal();
  }
};

const updateCheckoutTotal = () => {
  const subtotal   = cartItems.reduce((s,i) => s + i.price * i.quantity, 0);
  const shipping   = subtotal >= 500 ? 0 : 49;
  const memberDisc = Math.round(subtotal * 0.05);
  const total      = subtotal + shipping - memberDisc - _couponDiscount;
  const totalEl    = document.getElementById('checkoutTotal');
  if (totalEl) totalEl.textContent = fmt(total);
  const placeBtn = document.getElementById('placeOrderBtn');
  if (placeBtn) placeBtn.textContent = `🔒 Place Order — ${fmt(total)}`;
  const couponRow = document.getElementById('couponRow');
  const couponAmt = document.getElementById('couponAmt');
  if (couponRow && couponAmt) {
    couponRow.style.display = _couponDiscount > 0 ? '' : 'none';
    couponAmt.textContent = `-${fmt(_couponDiscount)}`;
  }
};

const placeOrder = async () => {
  const name  = document.getElementById('ckName')?.value.trim();
  const phone = document.getElementById('ckPhone')?.value.trim();
  const addr  = document.getElementById('ckAddr')?.value.trim();
  const city  = document.getElementById('ckCity')?.value.trim();
  const state = document.getElementById('ckState')?.value.trim();
  const pin   = document.getElementById('ckPin')?.value.trim();
  const upi   = document.getElementById('ckUpi')?.value.trim();
  const coupon = document.getElementById('ckCoupon')?.value.trim().toUpperCase() || null;

  if (!name || !phone || !addr || !city || !state || !pin) {
    showToast('Please fill all delivery address fields ⚠️', 'error'); return;
  }
  if (!/^\d{6}$/.test(pin))    { showToast('Enter a valid 6-digit PIN code', 'error'); return; }
  if (!/^\d{10}$/.test(phone)) { showToast('Enter a valid 10-digit phone number', 'error'); return; }
  if (_selectedPayment === 'UPI' && !upi) { showToast('Enter your UPI ID', 'error'); return; }

  const shippingAddress = `${name}, ${addr}, ${city}, ${state} - ${pin} | Phone: ${phone}`;
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = '⏳ Placing order…';

  // Simulate non-COD payment gateway
  if (_selectedPayment !== 'COD') {
    await simulatePayment(_selectedPayment, upi || '');
  }

  try {
    await syncCartToBackend();
    const data = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        couponCode: coupon || null,
        shippingAddress,
        paymentMethod: _selectedPayment,
        notes: _selectedPayment === 'UPI' ? `UPI ID: ${upi}` : '',
      })
    });
    // Success
    cartItems = []; updateCartBadge(); renderCart();
    _couponDiscount = 0;
    closeCheckout();
    showOrderSuccess(data.orderNumber || `ORD-${data.id}`, _selectedPayment, shippingAddress);
  } catch (err) {
    showToast(err.message || 'Order failed. Try again.', 'error');
    btn.disabled = false;
    const subtotal  = cartItems.reduce((s,i) => s + i.price * i.quantity, 0);
    const shipping  = subtotal >= 500 ? 0 : 49;
    const memberD   = Math.round(subtotal * 0.05);
    const total     = subtotal + shipping - memberD - _couponDiscount;
    btn.textContent = `🔒 Place Order — ${fmt(total)}`;
  }
};

const simulatePayment = (method, upi) => new Promise(resolve => {
  const icons = { UPI:'📲', CARD:'💳', NETBANKING:'🏦' };
  const labels = { UPI: `UPI: ${upi}`, CARD:'Credit/Debit Card', NETBANKING:'Net Banking' };
  const ov  = Object.assign(document.createElement('div'), { className: 'pg-overlay' });
  const box = Object.assign(document.createElement('div'), { className: 'pg-box' });
  box.innerHTML = `<div class="pg-icon">${icons[method]||'💳'}</div>
    <h2>Processing Payment</h2>
    <p>Connecting to ${labels[method]}…</p>
    <div class="spinner" style="margin:20px auto"></div>
    <small style="color:var(--text-muted)">Secure payment by ShopWave Pay</small>`;
  ov.appendChild(box); document.body.appendChild(ov);
  setTimeout(() => {
    box.innerHTML = `<div class="pg-icon">✅</div><h2 style="color:var(--accent-green)">Payment Successful!</h2><p>Processing your order…</p>`;
    setTimeout(() => { ov.remove(); resolve(); }, 1400);
  }, 2500);
});

const showOrderSuccess = (orderNumber, payment, address) => {
  const ov  = Object.assign(document.createElement('div'), { className: 'success-overlay' });
  const box = Object.assign(document.createElement('div'), { className: 'success-box' });
  box.innerHTML = `
    <div class="success-emoji">🎉</div>
    <h2>Order Placed!</h2>
    <div class="success-order-num">${orderNumber}</div>
    <p>🚚 Expected delivery in <strong>3–5 business days</strong></p>
    <p>Payment: <strong>${payment}</strong></p>
    <p style="font-size:12px;word-break:break-word">${address.split('|')[0]}</p>
    <div class="success-actions">
      <button class="btn-view-orders" onclick="this.closest('.success-overlay').remove();showOrders()">View Orders</button>
      <button class="btn-continue-shop" onclick="this.closest('.success-overlay').remove()">Continue Shopping</button>
    </div>`;
  ov.appendChild(box); document.body.appendChild(ov);
};

// ── Scroll + Sticky nav ───────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  document.getElementById('backToTop').classList.toggle('show', window.scrollY > 500);
}, { passive: true });

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initHero();
  updateNavUser();
  updateCartBadge();
  updateWishlistBadge();
  if (_token) await loadCart();
  await loadCategories();
  await loadProducts();
});
