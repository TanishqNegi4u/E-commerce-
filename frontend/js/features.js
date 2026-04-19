/* ═══════════════════════════════════════════════════════════════
   ShopWave features.js
   Implements: Notifications · AI Customer Support · Seller Portal
   Recommendations · Analytics Dashboard · Address Book
   Advanced Search & Filters · Payment Processing · Returns & Refunds
   Order Timeline (visual)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   1. NOTIFICATIONS
   ───────────────────────────────────────────────────────────────── */
let _notifications = [
  { id:1, type:'orders',  icon:'📦', title:'Order Shipped!', body:'Your order #ORD-1042 is on its way. Expected by tomorrow.', time:'2 min ago', unread:true },
  { id:2, type:'offers',  icon:'🔥', title:'Flash Sale — 70% Off Electronics!', body:'Hurry! Sale ends in 4 hours. Shop MacBooks, Phones & more.', time:'1 hr ago', unread:true },
  { id:3, type:'returns', icon:'✅', title:'Refund Processed', body:'₹2,499 refunded to your original payment method for order #ORD-987.', time:'2 hrs ago', unread:true },
  { id:4, type:'orders',  icon:'🚚', title:'Out for Delivery', body:'Your package will arrive today between 2-6 PM.', time:'3 hrs ago', unread:false },
  { id:5, type:'offers',  icon:'🎁', title:'Exclusive Member Offer', body:'You have an exclusive 20% coupon: MEMBER20. Valid for 24 hrs.', time:'5 hrs ago', unread:false },
  { id:6, type:'orders',  icon:'⭐', title:'Rate your purchase', body:'How was the Boat Airdopes 141? Share your experience.', time:'1 day ago', unread:false },
];
let _notifFilter = 'all';

const openNotifications = () => {
  document.getElementById('notifOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderNotifications();
  updateNotifBadge();
};
const closeNotifications = () => {
  document.getElementById('notifOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const switchNotifTab = (filter, el) => {
  _notifFilter = filter;
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderNotifications();
};
const markAllRead = () => {
  _notifications.forEach(n => n.unread = false);
  renderNotifications();
  updateNotifBadge();
};
const updateNotifBadge = () => {
  const count = _notifications.filter(n => n.unread).length;
  const badge = document.getElementById('notifBadge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
};
const renderNotifications = () => {
  const filtered = _notifFilter === 'all' ? _notifications : _notifications.filter(n => n.type === _notifFilter);
  document.getElementById('notifList').innerHTML = filtered.length ? filtered.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="readNotif(${n.id})">
      ${n.unread ? '<span class="notif-unread-dot"></span>' : ''}
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('') :
    '<div style="padding:40px;text-align:center;color:var(--text-muted)">No notifications here</div>';
};
const readNotif = (id) => {
  const n = _notifications.find(n => n.id === id);
  if (n) { n.unread = false; renderNotifications(); updateNotifBadge(); }
};
// Initialize badge on load
document.addEventListener('DOMContentLoaded', updateNotifBadge);


/* ─────────────────────────────────────────────────────────────────
   2. AI CUSTOMER SUPPORT
   ───────────────────────────────────────────────────────────────── */
let _aiHistory = [];
const _aiResponses = {
  'track': { msg:'📦 Your latest order **#ORD-1042** was shipped on April 17 and is expected to arrive **today by 6 PM**. Track it live → [Click here](#)', quick:[] },
  'return': { msg:'🔄 To return a product:\n1. Go to **My Orders** → Select the order\n2. Click "Return Item"\n3. Choose a reason & pickup date\n4. Drop off or schedule pickup\n\nRefund is processed within **5-7 business days**.', quick:['Start a return','Refund status'] },
  'payment': { msg:'💳 I can help with payment issues! Common fixes:\n• **Card declined?** Try a different card or UPI\n• **Payment stuck?** Wait 24 hrs — if deducted but no order, it auto-refunds\n• **EMI issues?** Check with your bank\n\nNeed more help?', quick:['Talk to agent','Refund status'] },
  'recommend': { msg:'🤖 Based on your browsing, I recommend:\n• **Boat Rockerz 450** — ₹1,299 (60% off)\n• **Samsung Galaxy Watch** — ₹18,999\n• **Lenovo IdeaPad** — ₹34,990\n\nWant me to add any to your cart?', quick:['Add to cart','See more'] },
  'default': { msg:'I can help you with orders, returns, payments, and recommendations. What would you like to know? 😊', quick:['Track my order','How to return?','Payment issues'] }
};

const openAISupport = () => {
  document.getElementById('aiSupportOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (_aiHistory.length === 0) {
    _aiHistory.push({ role:'bot', msg:'👋 Hi! I\'m ShopWave\'s AI Assistant. I can help you track orders, handle returns, payment issues, and much more. How can I help you today?' });
    renderAIMessages();
  }
};
const closeAISupport = () => {
  document.getElementById('aiSupportOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const sendAIMessage = (text) => {
  _aiHistory.push({ role:'user', msg: text });
  renderAIMessages();
  document.getElementById('aiQuickActions').style.display = 'none';
  setTimeout(() => {
    showAITyping();
    setTimeout(() => {
      const key = text.toLowerCase().includes('track') ? 'track'
        : text.toLowerCase().includes('return') ? 'return'
        : text.toLowerCase().includes('payment') ? 'payment'
        : text.toLowerCase().includes('recommend') ? 'recommend' : 'default';
      const resp = _aiResponses[key];
      _aiHistory.push({ role:'bot', msg: resp.msg });
      renderAIMessages();
      document.getElementById('aiQuickActions').innerHTML = resp.quick.map(q =>
        `<button onclick="sendAIMessage('${q}')">${q}</button>`).join('');
      if (resp.quick.length) document.getElementById('aiQuickActions').style.display = 'flex';
    }, 1200);
  }, 200);
};
const sendAIFromInput = () => {
  const inp = document.getElementById('aiInput');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  sendAIMessage(text);
};
const showAITyping = () => {
  const msgs = document.getElementById('aiChatMessages');
  const typing = document.createElement('div');
  typing.className = 'ai-msg bot'; typing.id = 'aiTyping';
  typing.innerHTML = `<div class="ai-msg-avatar">🤖</div><div class="ai-typing"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;
};
const renderAIMessages = () => {
  const typing = document.getElementById('aiTyping');
  if (typing) typing.remove();
  document.getElementById('aiChatMessages').innerHTML = _aiHistory.map(m => `
    <div class="ai-msg ${m.role}">
      ${m.role === 'bot' ? '<div class="ai-msg-avatar">🤖</div>' : ''}
      <div class="ai-bubble">${m.msg.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>
      ${m.role === 'user' ? '<div class="ai-msg-avatar" style="background:#FF9900;font-size:12px;font-weight:700;">U</div>' : ''}
    </div>`).join('');
  const msgs = document.getElementById('aiChatMessages');
  msgs.scrollTop = msgs.scrollHeight;
};


/* ─────────────────────────────────────────────────────────────────
   3. SELLER PORTAL
   ───────────────────────────────────────────────────────────────── */
let _sellerTab = 'products';
const _mockSellerProducts = [
  { id:1, name:'Wireless Headphones Pro', price:2999, stock:45, sales:128, status:'Active' },
  { id:2, name:'Smart Watch Series X',    price:8999, stock:12, sales:67,  status:'Active' },
  { id:3, name:'Laptop Stand Aluminum',   price:1299, stock:0,  sales:234, status:'Out of Stock' },
  { id:4, name:'USB-C Hub 7-in-1',        price:1799, stock:89, sales:56,  status:'Active' },
];

const openSellerPortal = () => {
  if (!getUser()) { openAuth(); showToast('Sign in to access Seller Portal','info'); return; }
  document.getElementById('sellerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderSellerPortal();
};
const closeSellerPortal = () => {
  document.getElementById('sellerOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const switchSellerTab = (tab, el) => {
  _sellerTab = tab;
  document.querySelectorAll('.seller-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderSellerTabContent();
};
const renderSellerPortal = () => {
  document.getElementById('sellerBody').innerHTML = `
    <div class="seller-stats">
      <div class="seller-stat-card"><div class="seller-stat-value">₹1,24,560</div><div class="seller-stat-label">Total Revenue</div><div class="seller-stat-change">↑ 12% this month</div></div>
      <div class="seller-stat-card"><div class="seller-stat-value">485</div><div class="seller-stat-label">Total Orders</div><div class="seller-stat-change">↑ 8% this month</div></div>
      <div class="seller-stat-card"><div class="seller-stat-value">${_mockSellerProducts.length}</div><div class="seller-stat-label">Active Products</div><div class="seller-stat-change">2 need attention</div></div>
      <div class="seller-stat-card"><div class="seller-stat-value">4.7⭐</div><div class="seller-stat-label">Seller Rating</div><div class="seller-stat-change">Top Seller Badge</div></div>
    </div>
    <div class="seller-tabs">
      <button class="seller-tab ${_sellerTab==='products'?'active':''}" onclick="switchSellerTab('products',this)">📦 My Products</button>
      <button class="seller-tab ${_sellerTab==='add'?'active':''}" onclick="switchSellerTab('add',this)">➕ Add Product</button>
      <button class="seller-tab ${_sellerTab==='orders'?'active':''}" onclick="switchSellerTab('orders',this)">📋 Orders</button>
    </div>
    <div id="sellerTabContent"></div>`;
  renderSellerTabContent();
};
const renderSellerTabContent = () => {
  const el = document.getElementById('sellerTabContent');
  if (_sellerTab === 'products') {
    el.innerHTML = `<table class="seller-product-table">
      <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Sales</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${_mockSellerProducts.map(p => `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>₹${p.price.toLocaleString('en-IN')}</td>
          <td>${p.stock > 0 ? p.stock : '<span style="color:var(--accent-red)">0</span>'}</td>
          <td>${p.sales}</td>
          <td><span style="background:${p.status==='Active'?'#e8f5e9':'#fff3e0'};color:${p.status==='Active'?'var(--accent-green)':'#e65100'};padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700">${p.status}</span></td>
          <td><button class="link-btn" onclick="sellerEditProduct(${p.id})">Edit</button></td>
        </tr>`).join('')}</tbody></table>`;
  } else if (_sellerTab === 'add') {
    el.innerHTML = `<form class="add-product-form" onsubmit="sellerAddProduct(event)">
      <div class="form-group"><label>Product Name *</label><input class="form-input" placeholder="e.g. Wireless Headphones" required></div>
      <div class="form-group"><label>Category *</label><select class="form-input"><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option><option>Sports</option><option>Beauty</option><option>Books</option></select></div>
      <div class="form-group"><label>Price (₹) *</label><input class="form-input" type="number" placeholder="e.g. 2999" required></div>
      <div class="form-group"><label>Stock Quantity *</label><input class="form-input" type="number" placeholder="e.g. 50" required></div>
      <div class="form-group"><label>MRP (₹)</label><input class="form-input" type="number" placeholder="e.g. 4999"></div>
      <div class="form-group"><label>Brand</label><input class="form-input" placeholder="e.g. Sony"></div>
      <div class="form-group full"><label>Description</label><textarea class="form-input" rows="3" placeholder="Describe your product…"></textarea></div>
      <div class="form-group full" style="display:flex;gap:10px">
        <button type="submit" class="btn-primary">List Product</button>
        <button type="button" class="btn-secondary">Save as Draft</button>
      </div></form>`;
  } else {
    el.innerHTML = `<table class="seller-product-table">
      <thead><tr><th>Order ID</th><th>Product</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        <tr><td>#ORD-1042</td><td>Wireless Headphones Pro</td><td>Rahul S.</td><td>₹2,999</td><td><span style="color:var(--accent-green);font-weight:700">Shipped</span></td><td>Apr 17</td></tr>
        <tr><td>#ORD-1038</td><td>Smart Watch Series X</td><td>Priya M.</td><td>₹8,999</td><td><span style="color:#1976d2;font-weight:700">Processing</span></td><td>Apr 16</td></tr>
        <tr><td>#ORD-1031</td><td>USB-C Hub 7-in-1</td><td>Arjun K.</td><td>₹1,799</td><td><span style="color:var(--accent-green);font-weight:700">Delivered</span></td><td>Apr 14</td></tr>
      </tbody></table>`;
  }
};
const sellerAddProduct = (e) => {
  e.preventDefault();
  showToast('Product listed successfully! 🎉', 'success');
  switchSellerTab('products', document.querySelector('.seller-tab'));
};
const sellerEditProduct = (id) => { showToast('Edit feature coming soon', 'info'); };


/* ─────────────────────────────────────────────────────────────────
   4. AI RECOMMENDATIONS
   ───────────────────────────────────────────────────────────────── */
const _recommendData = [
  { id:101, name:'Boat Rockerz 450', category:'Electronics', price:1299, mrp:2990, rating:4.2, emoji:'🎧', tag:'Best Seller' },
  { id:102, name:'Fitbit Sense 2',   category:'Electronics', price:14999,mrp:24999,rating:4.5, emoji:'⌚', tag:'Top Rated' },
  { id:103, name:'The Alchemist',    category:'Books',       price:199,  mrp:499,  rating:4.8, emoji:'📚', tag:'Staff Pick' },
  { id:104, name:'Nike Air Max 270', category:'Fashion',     price:7999, mrp:12999,rating:4.3, emoji:'👟', tag:'Trending' },
  { id:105, name:'Instant Pot Duo',  category:'Home & Kitchen',price:6999,mrp:9999,rating:4.6, emoji:'🍲', tag:'Deal' },
  { id:106, name:'Lego Technic',     category:'Toys',        price:3499, mrp:5999, rating:4.7, emoji:'🧱', tag:'Popular' },
];

const loadRecommendations = () => {
  const section = document.getElementById('recommendSection');
  const grid    = document.getElementById('recommendGrid');
  if (!section || !grid) return;
  section.style.display = '';
  grid.innerHTML = _recommendData.map(p => buildRecommendCard(p)).join('');
};
const buildRecommendCard = (p) => {
  const disc = Math.round((1 - p.price / p.mrp) * 100);
  return `<div class="product-card" onclick="openProduct(${p.id})" style="cursor:pointer;padding:12px">
    <div style="position:relative">
      ${p.tag ? `<span style="position:absolute;top:0;left:0;background:#FF9900;color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px">${p.tag}</span>` : ''}
      <div style="font-size:60px;text-align:center;padding:20px 0">${p.emoji}</div>
    </div>
    <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--text1)">${p.name}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${p.category}</div>
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
      <span style="background:#FF9900;color:white;font-size:11px;font-weight:700;padding:1px 6px;border-radius:3px">${p.rating}⭐</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:8px">
      <span style="font-size:16px;font-weight:800">₹${p.price.toLocaleString('en-IN')}</span>
      <span style="font-size:12px;color:var(--text-muted);text-decoration:line-through">₹${p.mrp.toLocaleString('en-IN')}</span>
      <span style="font-size:12px;color:var(--accent-green);font-weight:700">${disc}% off</span>
    </div>
    <button class="btn-primary" style="width:100%;font-size:12px;padding:7px" onclick="event.stopPropagation();addToCart({id:${p.id},name:'${p.name}',price:${p.price},category:'${p.category}',emoji:'${p.emoji}',rating:${p.rating}})">Add to Cart</button>
  </div>`;
};
// Load on page init
document.addEventListener('DOMContentLoaded', () => setTimeout(loadRecommendations, 500));


/* ─────────────────────────────────────────────────────────────────
   5. ANALYTICS DASHBOARD
   ───────────────────────────────────────────────────────────────── */
const _analyticsData = {
  months: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
  revenue:[12000,18000,45000,22000,31000,28000,38000],
  orders: [45, 67, 132, 78, 104, 92, 127],
};

const openAnalytics = () => {
  document.getElementById('analyticsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAnalytics();
};
const closeAnalytics = () => {
  document.getElementById('analyticsOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const renderAnalytics = () => {
  const maxRev = Math.max(..._analyticsData.revenue);
  const bars = _analyticsData.months.map((m, i) => {
    const h = Math.round((_analyticsData.revenue[i] / maxRev) * 100);
    return `<div class="bar-col">
      <div class="bar-val">₹${(_analyticsData.revenue[i]/1000).toFixed(0)}k</div>
      <div class="bar" style="height:${h}px"></div>
      <div class="bar-label">${m}</div>
    </div>`;
  }).join('');

  document.getElementById('analyticsBody').innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card"><div class="analytics-card-label">Total Revenue</div><div class="analytics-card-value">₹1,94,000</div><div class="analytics-card-sub">↑ 22% vs last month</div></div>
      <div class="analytics-card"><div class="analytics-card-label">Total Orders</div><div class="analytics-card-value">645</div><div class="analytics-card-sub">↑ 8% vs last month</div></div>
      <div class="analytics-card"><div class="analytics-card-label">Avg Order Value</div><div class="analytics-card-value">₹3,008</div><div class="analytics-card-sub">↑ 12% vs last month</div></div>
      <div class="analytics-card"><div class="analytics-card-label">Return Rate</div><div class="analytics-card-value">3.2%</div><div class="analytics-card-sub" style="color:var(--accent-green)">↓ 1% (good)</div></div>
    </div>
    <div class="analytics-chart-area">
      <h3>📈 Revenue Trend (Last 7 Months)</h3>
      <div class="bar-chart">${bars}</div>
    </div>
    <div class="analytics-two-col">
      <div class="analytics-chart-area">
        <h3>🛒 Recent Orders</h3>
        <table class="recent-orders-table">
          <thead><tr><th>Order</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>#ORD-1042</td><td>₹2,999</td><td style="color:var(--accent-green)">Shipped</td></tr>
            <tr><td>#ORD-1038</td><td>₹8,999</td><td style="color:#1976d2">Processing</td></tr>
            <tr><td>#ORD-1031</td><td>₹1,799</td><td style="color:var(--accent-green)">Delivered</td></tr>
            <tr><td>#ORD-1025</td><td>₹499</td><td style="color:#e65100">Returned</td></tr>
          </tbody>
        </table>
      </div>
      <div class="analytics-chart-area">
        <h3>🏆 Top Products</h3>
        <div class="top-products-list">
          ${[
            ['Boat Rockerz 450','128 sold','₹1,66,272'],
            ['Samsung Galaxy','67 sold','₹2,68,865'],
            ['Laptop Stand','234 sold','₹3,04,266'],
            ['USB-C Hub','56 sold','₹1,00,744'],
          ].map((p,i) => `<div class="top-product-item">
            <div class="top-product-rank">${i+1}</div>
            <div class="top-product-info"><div class="top-product-name">${p[0]}</div><div class="top-product-sales">${p[1]}</div></div>
            <div class="top-product-revenue">${p[2]}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
};


/* ─────────────────────────────────────────────────────────────────
   6. ADDRESS BOOK
   ───────────────────────────────────────────────────────────────── */
let _addresses = [
  { id:1, type:'Home', name:'Rahul Sharma', phone:'9876543210', line1:'42, Park Street', line2:'Near Metro Station', city:'Mumbai', state:'Maharashtra', pin:'400001', default:true },
  { id:2, type:'Work', name:'Rahul Sharma', phone:'9876543210', line1:'5th Floor, Tech Park', line2:'Bandra Kurla Complex', city:'Mumbai', state:'Maharashtra', pin:'400051', default:false },
];
let _showAddAddressForm = false;

const openAddressBook = () => {
  document.getElementById('addressOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAddressBook();
};
const closeAddressBook = () => {
  document.getElementById('addressOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const renderAddressBook = () => {
  document.getElementById('addressBody').innerHTML = `
    <div class="address-grid">${_addresses.map(a => `
      <div class="address-card ${a.default?'selected':''}">
        ${a.default ? '<div class="address-default-badge">Default</div>' : ''}
        <div class="address-card-type">${a.type}</div>
        <div class="address-card-name">${a.name}</div>
        <div class="address-card-text">${a.line1}, ${a.line2 ? a.line2+', ' : ''}${a.city}, ${a.state} - ${a.pin}</div>
        <div class="address-card-text">📞 ${a.phone}</div>
        <div class="address-card-actions">
          <button class="address-edit-btn" onclick="editAddress(${a.id})">✏️ Edit</button>
          ${!a.default ? `<button class="address-delete-btn" onclick="deleteAddress(${a.id})">🗑️ Remove</button>
          <button class="address-edit-btn" onclick="setDefaultAddress(${a.id})">⭐ Set Default</button>` : ''}
        </div>
      </div>`).join('')}</div>
    <button class="btn-primary" style="margin-bottom:16px" onclick="toggleAddAddressForm()">➕ Add New Address</button>
    ${_showAddAddressForm ? renderAddAddressForm() : ''}`;
};
const renderAddAddressForm = () => `
  <div class="add-address-form">
    <h3 style="margin-bottom:16px;font-size:16px;font-weight:700">New Address</h3>
    <div class="address-form-grid">
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">Type</label>
        <select class="form-input" id="addrType"><option>Home</option><option>Work</option><option>Other</option></select></div>
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">Full Name</label><input class="form-input" id="addrName" placeholder="Full Name"></div>
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">Phone</label><input class="form-input" id="addrPhone" placeholder="10-digit mobile" type="tel"></div>
      <div class="full"><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">Address Line 1</label><input class="form-input" id="addrLine1" placeholder="House No., Street, Area"></div>
      <div class="full"><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">Address Line 2 (optional)</label><input class="form-input" id="addrLine2" placeholder="Landmark, etc."></div>
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">City</label><input class="form-input" id="addrCity" placeholder="City"></div>
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">State</label><input class="form-input" id="addrState" placeholder="State"></div>
      <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">PIN Code</label><input class="form-input" id="addrPin" placeholder="6-digit PIN" type="number"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn-primary" onclick="saveNewAddress()">Save Address</button>
      <button class="btn-secondary" onclick="toggleAddAddressForm()">Cancel</button>
    </div>
  </div>`;
const toggleAddAddressForm = () => { _showAddAddressForm = !_showAddAddressForm; renderAddressBook(); };
const saveNewAddress = () => {
  const name = document.getElementById('addrName').value.trim();
  if (!name) { showToast('Please fill in all required fields', 'error'); return; }
  _addresses.push({
    id: Date.now(), type: document.getElementById('addrType').value, name,
    phone: document.getElementById('addrPhone').value,
    line1: document.getElementById('addrLine1').value,
    line2: document.getElementById('addrLine2').value,
    city: document.getElementById('addrCity').value,
    state: document.getElementById('addrState').value,
    pin: document.getElementById('addrPin').value, default: false,
  });
  _showAddAddressForm = false;
  showToast('Address saved successfully!', 'success');
  renderAddressBook();
};
const deleteAddress = (id) => {
  if (!confirm('Remove this address?')) return;
  _addresses = _addresses.filter(a => a.id !== id);
  renderAddressBook();
};
const setDefaultAddress = (id) => {
  _addresses.forEach(a => a.default = a.id === id);
  showToast('Default address updated', 'success');
  renderAddressBook();
};
const editAddress = (id) => { showToast('Edit coming soon — remove & re-add for now', 'info'); };


/* ─────────────────────────────────────────────────────────────────
   7. RETURNS & REFUNDS
   ───────────────────────────────────────────────────────────────── */
let _returnStep = 1;
let _selectedReturnItem = null;
let _selectedRefundMethod = 'original';

const openReturnPortal = () => {
  if (!getUser()) { openAuth(); showToast('Sign in to start a return', 'info'); return; }
  document.getElementById('returnOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  _returnStep = 1; _selectedReturnItem = null;
  renderReturnPortal();
};
const closeReturnPortal = () => {
  document.getElementById('returnOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const renderReturnPortal = () => {
  const steps = ['Select Item','Choose Reason','Refund Method','Confirm'];
  const stepsHtml = steps.map((s,i) => `
    <div class="return-step ${i+1 < _returnStep ? 'done' : i+1 === _returnStep ? 'active' : ''}">
      <div class="return-step-num">${i+1 < _returnStep ? '✓' : i+1}</div>
      <div class="return-step-label">${s}</div>
    </div>`).join('<div style="flex:1;height:2px;background:var(--border);margin-top:14px"></div>');

  let body = '';
  if (_returnStep === 1) {
    body = `<h3 style="margin-bottom:12px">Select order to return:</h3>
      <select class="return-order-select" onchange="renderReturnItems(this.value)">
        <option value="">-- Select Order --</option>
        <option value="1042">Order #ORD-1042 — Apr 17, 2026</option>
        <option value="1031">Order #ORD-1031 — Apr 14, 2026</option>
      </select>
      <div class="return-item-grid" id="returnItems"></div>
      <button class="btn-primary" onclick="if(_selectedReturnItem){_returnStep=2;renderReturnPortal();}else{showToast('Select an item first','error');}">Next →</button>`;
  } else if (_returnStep === 2) {
    body = `<h3 style="margin-bottom:12px">Why are you returning this?</h3>
      <select class="return-reason-select" id="returnReason">
        <option value="">Select reason</option>
        <option>Defective / Damaged item</option>
        <option>Wrong item delivered</option>
        <option>Item not as described</option>
        <option>Changed my mind</option>
        <option>Better price available</option>
        <option>Item arrived too late</option>
      </select>
      <div style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Additional Comments (optional)</label>
        <textarea class="form-input" rows="3" placeholder="Describe the issue…"></textarea></div>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" onclick="_returnStep=1;renderReturnPortal()">← Back</button>
        <button class="btn-primary" onclick="if(document.getElementById('returnReason').value){_returnStep=3;renderReturnPortal();}else{showToast('Please select a reason','error');}">Next →</button>
      </div>`;
  } else if (_returnStep === 3) {
    body = `<h3 style="margin-bottom:12px">How would you like your refund?</h3>
      <div class="refund-methods">
        ${[
          { id:'original', icon:'💳', title:'Original Payment Method', sub:'Refund to your card/UPI. 5-7 business days.' },
          { id:'wallet',   icon:'👛', title:'ShopWave Wallet',         sub:'Instant credit. Use for next purchase.' },
          { id:'upi',      icon:'📱', title:'UPI Transfer',            sub:'Direct to UPI ID. 2-3 business days.' },
        ].map(m => `
          <div class="refund-method-card ${_selectedRefundMethod===m.id?'selected':''}" onclick="_selectedRefundMethod='${m.id}';document.querySelectorAll('.refund-method-card').forEach(c=>c.classList.remove('selected'));this.classList.add('selected')">
            <div class="refund-method-icon">${m.icon}</div>
            <div class="refund-method-info"><div class="title">${m.title}</div><div class="sub">${m.sub}</div></div>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" onclick="_returnStep=2;renderReturnPortal()">← Back</button>
        <button class="btn-primary" onclick="_returnStep=4;renderReturnPortal()">Next →</button>
      </div>`;
  } else {
    body = `<div class="return-refund-summary">
        <div class="refund-row"><span>Item</span><span>${_selectedReturnItem?.name || 'Product'}</span></div>
        <div class="refund-row"><span>Refund Amount</span><span>₹2,999</span></div>
        <div class="refund-row"><span>Return Pickup</span><span>2-3 business days</span></div>
        <div class="refund-row"><span>Refund Method</span><span>${_selectedRefundMethod === 'wallet' ? 'ShopWave Wallet' : _selectedRefundMethod === 'upi' ? 'UPI Transfer' : 'Original Payment'}</span></div>
        <div class="refund-row total"><span>Total Refund</span><span style="color:var(--accent-green)">₹2,999</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" onclick="_returnStep=3;renderReturnPortal()">← Back</button>
        <button class="btn-primary" onclick="submitReturn()">✅ Confirm Return</button>
      </div>`;
  }

  document.getElementById('returnBody').innerHTML = `
    <div class="return-steps">${stepsHtml}</div>
    <div style="min-height:200px">${body}</div>`;
};
const renderReturnItems = (orderId) => {
  const items = orderId === '1042'
    ? [{ id:'a', name:'Boat Rockerz 450', emoji:'🎧', price:'₹1,299' }, { id:'b', name:'Phone Case', emoji:'📱', price:'₹299' }]
    : [{ id:'c', name:'USB-C Hub', emoji:'🔌', price:'₹1,799' }];
  document.getElementById('returnItems').innerHTML = items.map(item => `
    <div class="return-item-card ${_selectedReturnItem?.id===item.id?'selected':''}" onclick="_selectedReturnItem={id:'${item.id}',name:'${item.name}'};document.querySelectorAll('.return-item-card').forEach(c=>c.classList.remove('selected'));this.classList.add('selected')">
      <div class="return-item-img">${item.emoji}</div>
      <div><div style="font-size:14px;font-weight:600">${item.name}</div><div style="font-size:12px;color:var(--text2)">${item.price}</div></div>
    </div>`).join('');
};
const submitReturn = () => {
  document.getElementById('returnBody').innerHTML = `
    <div class="refund-success">
      <div class="refund-success-icon">✅</div>
      <h2 style="font-size:22px;font-weight:700;color:var(--accent-green);margin-bottom:8px">Return Initiated!</h2>
      <p style="color:var(--text2);margin-bottom:8px">Return ID: <strong>RET-${Date.now().toString().slice(-6)}</strong></p>
      <p style="color:var(--text2);margin-bottom:16px">Our pickup partner will collect the item within 2-3 business days. Your refund will be processed once we receive the item.</p>
      <button class="btn-primary" onclick="closeReturnPortal()">Done</button>
    </div>`;
  // Add to notifications
  _notifications.unshift({ id:Date.now(), type:'returns', icon:'📦', title:'Return Initiated', body:'Your return for has been submitted. Pickup in 2-3 days.', time:'Just now', unread:true });
  updateNotifBadge();
};


/* ─────────────────────────────────────────────────────────────────
   8. PAYMENT PROCESSING (Mock)
   ───────────────────────────────────────────────────────────────── */
let _selectedPaymentMethod = 'card';
let _checkoutTotal = 0;

const openPaymentModal = (total) => {
  _checkoutTotal = total;
  document.getElementById('paymentOverlay').classList.add('open');
  renderPaymentModal();
};
const closePaymentModal = () => {
  document.getElementById('paymentOverlay').classList.remove('open');
};
const renderPaymentModal = () => {
  document.getElementById('paymentBody').innerHTML = `
    <div class="payment-summary">
      <div class="pay-row"><span>Subtotal</span><span>₹${(_checkoutTotal * 0.95).toFixed(0)}</span></div>
      <div class="pay-row"><span>Delivery</span><span style="color:var(--accent-green)">FREE</span></div>
      <div class="pay-row"><span>Member Discount (5%)</span><span style="color:var(--accent-red)">-₹${(_checkoutTotal * 0.05).toFixed(0)}</span></div>
      <div class="pay-row total"><span>Order Total</span><span>₹${_checkoutTotal.toFixed(0)}</span></div>
    </div>
    <div class="payment-methods">
      ${[
        { id:'card', label:'Credit / Debit Card', logos:['VISA','MC','AMEX'] },
        { id:'upi',  label:'UPI', logos:['GPay','PhPe','Paytm'] },
        { id:'cod',  label:'Cash on Delivery', logos:['COD'] },
        { id:'emi',  label:'EMI', logos:['No Cost'] },
      ].map(m => `
        <div class="payment-method ${_selectedPaymentMethod===m.id?'active':''}" onclick="selectPayMethod('${m.id}')">
          <div class="payment-method-header">
            <input type="radio" name="payMethod" ${_selectedPaymentMethod===m.id?'checked':''}>
            <span class="payment-method-label">${m.label}</span>
            <div class="payment-method-logos">${m.logos.map(l=>`<div class="pay-logo">${l}</div>`).join('')}</div>
          </div>
          <div class="payment-method-body">${renderPayMethodBody(m.id)}</div>
        </div>`).join('')}
    </div>
    <div class="pay-secure-badge">🔒 Secured by ShopWave Pay — 256-bit SSL encryption</div>
    <button class="btn-primary btn-full" onclick="processPayment()" style="font-size:15px;padding:12px">
      Pay ₹${_checkoutTotal.toFixed(0)}
    </button>
    <button class="btn-secondary btn-full" style="margin-top:8px" onclick="closePaymentModal()">Cancel</button>`;
};
const renderPayMethodBody = (id) => {
  if (id === 'card') return `
    <input class="form-input" placeholder="Card Number" maxlength="19" oninput="formatCardNum(this)">
    <div class="card-row">
      <input class="form-input" placeholder="MM/YY">
      <input class="form-input" placeholder="CVV" maxlength="4" type="password">
    </div>
    <input class="form-input" placeholder="Name on Card">`;
  if (id === 'upi') return `
    <div class="upi-apps">
      ${['GPay 📱','PhonePe 💜','Paytm 🔵','BHIM 🇮🇳'].map(a=>`<div class="upi-app"><div class="upi-app-icon">${a.split(' ')[1]}</div><div>${a.split(' ')[0]}</div></div>`).join('')}
    </div>
    <div style="text-align:center;margin:12px 0;color:var(--text-muted);font-size:12px">— or enter UPI ID —</div>
    <input class="upi-input" placeholder="yourname@upi">`;
  if (id === 'cod') return `<p style="font-size:13px;color:var(--text2)">💵 Pay in cash when your order is delivered. No extra charges.</p>`;
  if (id === 'emi') return `
    <p style="font-size:13px;margin-bottom:10px;color:var(--text2)">No-cost EMI available on select cards:</p>
    <select class="form-input"><option>3 months — ₹${Math.round(_checkoutTotal/3)}/mo</option><option>6 months — ₹${Math.round(_checkoutTotal/6)}/mo</option><option>12 months — ₹${Math.round(_checkoutTotal/12)}/mo</option></select>`;
  return '';
};
const selectPayMethod = (id) => { _selectedPaymentMethod = id; renderPaymentModal(); };
const formatCardNum = (inp) => {
  let v = inp.value.replace(/\D/g,'').substring(0,16);
  inp.value = v.match(/.{1,4}/g)?.join(' ') || v;
};
const processPayment = () => {
  document.getElementById('paymentBody').innerHTML = `
    <div class="processing-overlay">
      <div class="pay-spinner"></div>
      <div style="font-size:16px;font-weight:600">Processing Payment…</div>
      <div style="font-size:13px;color:var(--text-muted)">Please do not close this window</div>
    </div>`;
  setTimeout(() => {
    document.getElementById('paymentBody').innerHTML = `
      <div class="pay-success">
        <div class="pay-success-icon">✅</div>
        <h2 style="font-size:22px;font-weight:700;color:var(--accent-green);margin-bottom:8px">Payment Successful!</h2>
        <p style="color:var(--text2);margin-bottom:6px">Amount Paid: <strong>₹${_checkoutTotal.toFixed(0)}</strong></p>
        <p style="color:var(--text2);margin-bottom:6px">Transaction ID: <strong>TXN${Date.now().toString().slice(-8)}</strong></p>
        <p style="color:var(--text2);margin-bottom:20px">A confirmation has been sent to your email.</p>
        <button class="btn-primary" onclick="closePaymentModal();closeCheckout();showOrderSuccess()">View Order</button>
      </div>`;
  }, 2500);
};
const showOrderSuccess = () => {
  document.getElementById('orderSuccessOverlay').classList.add('open');
  document.getElementById('orderSuccessMsg').textContent = `Order #ORD-${Date.now().toString().slice(-4)} placed! Estimated delivery: Apr 21-23, 2026`;
  document.getElementById('orderTimeline').innerHTML = `
    <div class="timeline-steps">
      ${['Order Placed','Payment Done','Packed','Shipped','Delivered'].map((s,i) => `
        <div class="timeline-step ${i<2?'done':i===2?'current':''}">
          <div class="step-dot"></div>
          <div class="step-label">${s}</div>
        </div>${i<4?'<div style="flex:1;height:2px;background:'+(i<1?'var(--accent-green)':'var(--border)')+';margin-top:9px"></div>':''}`).join('')}
    </div>`;
  _notifications.unshift({ id:Date.now(), type:'orders', icon:'📦', title:'Order Confirmed!', body:`Your order #ORD-${Date.now().toString().slice(-4)} has been placed and payment received.`, time:'Just now', unread:true });
  updateNotifBadge();
};
const closeOrderSuccess = () => {
  document.getElementById('orderSuccessOverlay').classList.remove('open');
  cartItems = []; saveCart(); updateCartUI();
};


/* ─────────────────────────────────────────────────────────────────
   9. ADVANCED SEARCH & FILTERS
   ───────────────────────────────────────────────────────────────── */
let _advSearchResults = [];
const openAdvancedSearch = () => {
  document.getElementById('advSearchOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAdvSearch();
};
const closeAdvancedSearch = () => {
  document.getElementById('advSearchOverlay').classList.remove('open');
  document.body.style.overflow = '';
};
const renderAdvSearch = () => {
  document.getElementById('advSearchBody').innerHTML = `
    <div class="adv-search-grid">
      <div class="adv-search-field full"><label>Keywords</label>
        <input id="advKeyword" placeholder="Search for any product, brand, or category…" oninput="runAdvSearch()"></div>
      <div class="adv-search-field"><label>Category</label>
        <select id="advCategory" onchange="runAdvSearch()">
          <option value="">All Categories</option>
          <option>Electronics</option><option>Fashion</option>
          <option>Home & Kitchen</option><option>Sports</option>
          <option>Beauty</option><option>Books</option>
        </select></div>
      <div class="adv-search-field"><label>Sort By</label>
        <select id="advSort" onchange="runAdvSearch()">
          <option value="default">Relevance</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select></div>
      <div class="adv-search-field"><label>Min Price (₹)</label>
        <input type="number" id="advMin" placeholder="0" oninput="runAdvSearch()"></div>
      <div class="adv-search-field"><label>Max Price (₹)</label>
        <input type="number" id="advMax" placeholder="200000" oninput="runAdvSearch()"></div>
      <div class="adv-search-field"><label>Min Rating</label>
        <select id="advRating" onchange="runAdvSearch()">
          <option value="0">Any Rating</option>
          <option value="3">3⭐ & Up</option>
          <option value="4">4⭐ & Up</option>
          <option value="4.5">4.5⭐ & Up</option>
        </select></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Popular Tags</div>
      <div class="adv-tag-group">
        ${['On Sale','Top Rated','Free Delivery','In Stock','New Arrivals','Under ₹500','Under ₹2000','Best Seller'].map(t =>
          `<span class="adv-tag" onclick="this.classList.toggle('selected');runAdvSearch()">${t}</span>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:20px">
      <button class="btn-primary" onclick="runAdvSearch()">🔍 Search</button>
      <button class="btn-secondary" onclick="clearAdvSearch()">Clear</button>
    </div>
    <div class="adv-results" id="advResults"></div>`;
};
const runAdvSearch = () => {
  const keyword  = (document.getElementById('advKeyword')?.value || '').toLowerCase();
  const category = document.getElementById('advCategory')?.value || '';
  const minP     = parseFloat(document.getElementById('advMin')?.value) || 0;
  const maxP     = parseFloat(document.getElementById('advMax')?.value) || 999999;
  const minRat   = parseFloat(document.getElementById('advRating')?.value) || 0;
  const sortBy   = document.getElementById('advSort')?.value || 'default';
  const allTags  = [...document.querySelectorAll('.adv-tag.selected')].map(t => t.textContent);

  let results = _recommendData.filter(p => {
    if (keyword && !p.name.toLowerCase().includes(keyword)) return false;
    if (category && p.category !== category) return false;
    if (p.price < minP || p.price > maxP) return false;
    if (p.rating < minRat) return false;
    if (allTags.includes('On Sale') && p.mrp <= p.price) return false;
    if (allTags.includes('Top Rated') && p.rating < 4.3) return false;
    if (allTags.includes('Under ₹500') && p.price >= 500) return false;
    if (allTags.includes('Under ₹2000') && p.price >= 2000) return false;
    return true;
  });

  if (sortBy === 'price-asc') results.sort((a,b) => a.price - b.price);
  else if (sortBy === 'price-desc') results.sort((a,b) => b.price - a.price);
  else if (sortBy === 'rating') results.sort((a,b) => b.rating - a.rating);

  const el = document.getElementById('advResults');
  if (!el) return;
  el.innerHTML = `<div class="adv-results-header">
    <strong>${results.length} results found</strong>
    <span style="font-size:12px;color:var(--text-muted)">Showing best matches</span>
  </div>
  ${results.length ? `<div class="adv-results-grid">${results.map(p => `
    <div class="adv-result-card" onclick="closeAdvancedSearch()">
      <div class="adv-result-img">${p.emoji}</div>
      <div class="adv-result-name">${p.name}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${p.category} • ${p.rating}⭐</div>
      <div class="adv-result-price">₹${p.price.toLocaleString('en-IN')}</div>
      <button class="btn-primary" style="width:100%;margin-top:8px;font-size:12px;padding:6px" onclick="event.stopPropagation();addToCart({id:${p.id},name:'${p.name}',price:${p.price},category:'${p.category}',emoji:'${p.emoji}',rating:${p.rating}});showToast('Added to cart','success')">Add to Cart</button>
    </div>`).join('')}</div>` :
    '<div style="text-align:center;padding:32px;color:var(--text-muted)">No products match your filters. Try adjusting them.</div>'}`;
};
const clearAdvSearch = () => {
  document.querySelectorAll('.adv-tag.selected').forEach(t => t.classList.remove('selected'));
  ['advKeyword','advMin','advMax'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['advCategory','advSort','advRating'].forEach(id => { const el=document.getElementById(id); if(el) el.value = el.options[0]?.value || ''; });
  document.getElementById('advResults').innerHTML = '';
};


/* ─────────────────────────────────────────────────────────────────
   SIDEBAR FILTERS (for main products page)
   ───────────────────────────────────────────────────────────────── */
let _filterMinPrice = 0, _filterMaxPrice = 999999;
let _filterRating = 0, _filterDiscount = 0, _filterInStock = false;
let _allBrands = new Set();

const applyPriceFilter = () => {
  _filterMinPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
  _filterMaxPrice = parseFloat(document.getElementById('maxPrice')?.value) || 999999;
  applyAllFilters();
};
const syncPriceSlider = (val) => {
  _filterMaxPrice = parseFloat(val);
  const mx = document.getElementById('maxPrice');
  if (mx) mx.value = val;
  applyAllFilters();
};
const applyRatingFilter = (r) => { _filterRating = r; applyAllFilters(); };
const applyDiscountFilter = (d) => { _filterDiscount = d; applyAllFilters(); };
const applyStockFilter = () => { _filterInStock = document.getElementById('inStockOnly')?.checked; applyAllFilters(); };
const clearAllFilters = () => {
  _filterMinPrice = 0; _filterMaxPrice = 999999; _filterRating = 0; _filterDiscount = 0; _filterInStock = false;
  document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="discount"]').forEach(r => r.checked = false);
  const inp = document.getElementById('inStockOnly'); if(inp) inp.checked = false;
  const mn = document.getElementById('minPrice'); if(mn) mn.value = '';
  const mx = document.getElementById('maxPrice'); if(mx) mx.value = '';
  const sl = document.getElementById('priceSlider'); if(sl) sl.value = 200000;
  applyAllFilters();
};

// Piggyback on products.js renderProducts to apply filters
// We patch it via event listener on sort
const applySortFilter = () => {
  if (typeof renderProducts === 'function') renderProducts();
};
const applyAllFilters = () => {
  if (typeof renderProducts === 'function') renderProducts();
};


/* ─────────────────────────────────────────────────────────────────
   ORDER TIMELINE (Visual — replaces status-only view)
   ───────────────────────────────────────────────────────────────── */
const renderOrderTimeline = (status) => {
  const steps = ['Ordered','Confirmed','Packed','Shipped','Out for Delivery','Delivered'];
  const statusMap = { PENDING:0, CONFIRMED:1, PROCESSING:2, SHIPPED:3, OUTFORDELIVERY:4, DELIVERED:5, CANCELLED:-1 };
  const current = statusMap[status?.replace(/\s/g,'').toUpperCase()] ?? 0;
  if (current === -1) return `<div style="text-align:center;color:var(--accent-red);padding:8px">❌ Order Cancelled</div>`;
  return `<div class="timeline-steps" style="margin:10px 0">${steps.map((s,i) => `
    <div class="timeline-step ${i < current ? 'done' : i === current ? 'current' : ''}">
      <div class="step-dot">${i < current ? '✓' : ''}</div>
      <div class="step-label">${s}</div>
    </div>${i < steps.length-1 ? `<div style="flex:1;height:2px;background:${i<current?'var(--accent-green)':'var(--border)'};margin-top:9px"></div>` : ''}`
  ).join('')}</div>`;
};

// Patch showOrders to include visual timeline
const _origShowOrders = typeof showOrders !== 'undefined' ? showOrders : null;
// Override the order rendering to add timelines — wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const origShowOrders = window.showOrders;
  if (origShowOrders) {
    window.showOrders = async () => {
      await origShowOrders();
      // Patch order cards to include timeline
      setTimeout(() => {
        document.querySelectorAll('.order-card').forEach(card => {
          const badgeEl = card.querySelector('.order-status-badge');
          if (!badgeEl) return;
          const status = badgeEl.textContent.trim();
          if (!card.querySelector('.timeline-steps')) {
            const timelineDiv = document.createElement('div');
            timelineDiv.className = 'order-timeline-mini';
            timelineDiv.innerHTML = renderOrderTimeline(status);
            card.appendChild(timelineDiv);
          }
        });
      }, 500);
    };
  }
});


/* ─────────────────────────────────────────────────────────────────
   CHECKOUT INTEGRATION — wire payment button into checkout
   ───────────────────────────────────────────────────────────────── */
// We watch for checkout modal opens and inject our payment processor
const _checkoutObserver = new MutationObserver(() => {
  const payBtns = document.querySelectorAll('#checkoutBody .btn-primary[onclick*="placeOrder"]');
  payBtns.forEach(btn => {
    btn.onclick = () => {
      const total = parseFloat(document.getElementById('checkoutTotal')?.textContent?.replace(/[^0-9.]/g,'')) || 999;
      openPaymentModal(total);
    };
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBody = document.getElementById('checkoutBody');
  if (checkoutBody) _checkoutObserver.observe(checkoutBody, { childList: true, subtree: true });
});

console.log('✅ ShopWave Features Loaded: Notifications | AI Support | Seller Portal | Recommendations | Analytics | Address Book | Advanced Search | Payment | Returns');
