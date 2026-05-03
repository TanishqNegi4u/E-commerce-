// src/pages/Checkout.js
// ─────────────────────────────────────────────────────────────────
// Drop this file into:  frontend/src/pages/Checkout.js
// Then add the route in App.js  (see instructions below)
// ─────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderApi, couponApi } from '../api/client';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

// ── Payment method config ────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'GPAY',
    label: 'Google Pay',
    icon: '🟢',
    desc: 'Pay via UPI with Google Pay',
    upiApp: 'gpay',
  },
  {
    id: 'PHONEPE',
    label: 'PhonePe',
    icon: '💜',
    desc: 'Pay via UPI with PhonePe',
    upiApp: 'phonepe',
  },
  {
    id: 'PAYTM',
    label: 'Paytm',
    icon: '🔵',
    desc: 'Pay via Paytm UPI / Wallet',
    upiApp: 'paytm',
  },
  {
    id: 'CARD',
    label: 'Credit / Debit Card',
    icon: '💳',
    desc: 'Visa, Mastercard, RuPay',
  },
  {
    id: 'NETBANKING',
    label: 'Net Banking',
    icon: '🏦',
    desc: 'All major banks supported',
  },
  {
    id: 'COD',
    label: 'Cash on Delivery',
    icon: '💵',
    desc: 'Pay when your order arrives',
  },
];

// ── Indian states list ───────────────────────────────────────────
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// ── Simple UPI deep-link simulator (replace with real payment gateway) ──
function buildUpiIntent(app, amount, orderId) {
  const upiId = 'shopwave@upi'; // Replace with your merchant UPI ID
  const note  = `Order ${orderId}`;
  const base  = `upi://pay?pa=${upiId}&pn=ShopWave&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  const schemes = { gpay: 'tez://upi/', phonepe: 'phonepe://pay?', paytm: 'paytmmp://pay?' };
  return schemes[app] ? base.replace('upi://', schemes[app]) : base;
}

export default function Checkout() {
  useDocumentTitle('Checkout');
  const { cart, fetchCart, loading } = useCart();
  const navigate = useNavigate();

  // ── form state ──────────────────────────────────────────────
  const [step, setStep]               = useState(1); // 1=address, 2=payment, 3=review
  const [placing, setPlacing]         = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const [address, setAddress] = useState({
    fullName: '', mobile: '', email: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });
  const [addrErrors, setAddrErrors]   = useState({});

  const [payMethod, setPayMethod]     = useState('GPAY');
  const [upiId, setUpiId]             = useState('');
  const [upiError, setUpiError]       = useState('');

  const [coupon, setCoupon]           = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => { fetchCart(); }, []); // eslint-disable-line

  // ── Derived totals ──────────────────────────────────────────
  const items    = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const discount = couponResult?.valid ? Number(couponResult.discountAmount || 0) : 0;
  const total    = Math.max(0, subtotal + shipping - discount);

  // ── Validation ──────────────────────────────────────────────
  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim())                         e.fullName = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(address.mobile))            e.mobile   = 'Enter valid 10-digit mobile number';
    if (address.email && !/\S+@\S+\.\S+/.test(address.email)) e.email = 'Enter valid email';
    if (!address.line1.trim())                            e.line1    = 'Address line 1 is required';
    if (!address.city.trim())                             e.city     = 'City is required';
    if (!address.state)                                   e.state    = 'State is required';
    if (!/^\d{6}$/.test(address.pincode))                 e.pincode  = 'Enter valid 6-digit pincode';
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateUpi = () => {
    if (['GPAY','PHONEPE','PAYTM'].includes(payMethod) && upiId) {
      if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
        setUpiError('Enter valid UPI ID (e.g. 9876543210@gpay)');
        return false;
      }
    }
    setUpiError('');
    return true;
  };

  // ── Coupon ──────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const result = await couponApi.validate(coupon.trim(), subtotal);
      setCouponResult(result);
      if (result.valid) toast.success(`Coupon applied! You save ${fmt(result.discountAmount)}`);
      else toast.error(result.message || 'Invalid coupon');
    } catch { toast.error('Could not validate coupon'); }
    finally { setCouponLoading(false); }
  };

  // ── Place order ─────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validateUpi()) return;
    setPlacing(true);
    try {
      // For UPI apps, open deep-link first (replace with real gateway in production)
      if (['GPAY','PHONEPE','PAYTM'].includes(payMethod)) {
        const link = buildUpiIntent(payMethod.toLowerCase(), total.toFixed(2), 'NEW');
        window.open(link, '_blank');
      }

      const order = await orderApi.place({
        couponCode:      couponResult?.valid ? coupon.trim() : null,
        paymentMethod:   payMethod,
        shippingAddress: `${address.fullName}, ${address.line1}${address.line2 ? ', '+address.line2 : ''}, ${address.city}, ${address.state} - ${address.pincode} | ${address.mobile}`,
        notes: address.email ? `Email: ${address.email}` : '',
      });
      setOrderPlaced(order.orderNumber);
      toast.success('Order placed successfully! 🎉');
    } catch (e) {
      toast.error(e.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  // ── Helpers ─────────────────────────────────────────────────
  const Field = ({ label, name, type = 'text', placeholder, required, obj, setObj, errors, ...props }) => (
    <div className="checkout-field">
      <label htmlFor={name} className="checkout-label">
        {label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}
      </label>
      <input
        id={name}
        type={type}
        className={`form-input${errors[name] ? ' form-input--error' : ''}`}
        placeholder={placeholder}
        value={obj[name]}
        onChange={e => { setObj(o => ({ ...o, [name]: e.target.value })); if (errors[name]) setAddrErrors(er => ({ ...er, [name]: '' })); }}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-err` : undefined}
        {...props}
      />
      {errors[name] && <span id={`${name}-err`} className="form-error">{errors[name]}</span>}
    </div>
  );

  // ── Order Success screen ────────────────────────────────────
  if (orderPlaced) return (
    <div className="container page-wrap">
      <div className="empty-state">
        <span className="empty-state__icon" role="img" aria-label="Success">🎉</span>
        <h2>Order Confirmed!</h2>
        <p style={{ marginBottom: '.5rem' }}>
          Order <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>#{orderPlaced}</strong> is confirmed.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
          A confirmation will be sent to {address.email || address.mobile}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-primary">View Orders</Link>
          <Link to="/" className="btn btn-ghost">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );

  // ── Empty cart guard ────────────────────────────────────────
  if (!loading && items.length === 0) return (
    <div className="container page-wrap">
      <div className="empty-state">
        <span className="empty-state__icon" role="img" aria-label="Empty">🛒</span>
        <h3>Your cart is empty</h3>
        <Link to="/products" className="btn btn-primary mt-2">Shop Now</Link>
      </div>
    </div>
  );

  return (
    <div className="container page-wrap">
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>Checkout</h1>
        <p className="text-muted">
          <Link to="/cart" style={{ color: 'var(--muted)' }}>← Back to Cart</Link>
        </p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="checkout-steps" aria-label="Checkout progress">
        {['Delivery Address', 'Payment', 'Review & Pay'].map((s, i) => (
          <div
            key={s}
            className={`checkout-step${step === i + 1 ? ' checkout-step--active' : ''}${step > i + 1 ? ' checkout-step--done' : ''}`}
          >
            <span className="checkout-step__num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="checkout-step__label">{s}</span>
          </div>
        ))}
      </div>

      <div className="checkout-layout">

        {/* ══ LEFT COLUMN ══════════════════════════════════════ */}
        <div className="checkout-main">

          {/* ── Step 1: Address ── */}
          {step === 1 && (
            <div className="checkout-card">
              <h2 className="checkout-card__title">📦 Delivery Address</h2>

              <div className="checkout-grid-2">
                <Field label="Full Name" name="fullName" placeholder="Rahul Sharma" required
                  obj={address} setObj={setAddress} errors={addrErrors} />
                <Field label="Mobile Number" name="mobile" type="tel" placeholder="9876543210" required
                  maxLength={10} obj={address} setObj={setAddress} errors={addrErrors} />
              </div>

              <Field label="Email Address" name="email" type="email" placeholder="rahul@example.com"
                obj={address} setObj={setAddress} errors={addrErrors} />

              <Field label="Address Line 1" name="line1" placeholder="House No, Street, Locality" required
                obj={address} setObj={setAddress} errors={addrErrors} />

              <Field label="Address Line 2" name="line2" placeholder="Landmark (optional)"
                obj={address} setObj={setAddress} errors={addrErrors} />

              <div className="checkout-grid-3">
                <Field label="City" name="city" placeholder="Mumbai" required
                  obj={address} setObj={setAddress} errors={addrErrors} />
                <div className="checkout-field">
                  <label htmlFor="state" className="checkout-label">State<span style={{ color: 'var(--accent)' }}>*</span></label>
                  <select
                    id="state"
                    className={`form-input${addrErrors.state ? ' form-input--error' : ''}`}
                    value={address.state}
                    onChange={e => { setAddress(a => ({ ...a, state: e.target.value })); setAddrErrors(er => ({ ...er, state: '' })); }}
                  >
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {addrErrors.state && <span className="form-error">{addrErrors.state}</span>}
                </div>
                <Field label="Pincode" name="pincode" type="tel" placeholder="400001" required
                  maxLength={6} obj={address} setObj={setAddress} errors={addrErrors} />
              </div>

              <button
                className="btn btn-primary w-full"
                style={{ marginTop: '1.5rem', padding: '.85rem', fontSize: '1rem', fontWeight: 700 }}
                onClick={() => { if (validateAddress()) setStep(2); }}
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div className="checkout-card">
              <h2 className="checkout-card__title">💳 Choose Payment Method</h2>

              <div className="payment-methods" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map(pm => (
                  <label
                    key={pm.id}
                    className={`payment-option${payMethod === pm.id ? ' payment-option--active' : ''}`}
                    htmlFor={`pm-${pm.id}`}
                  >
                    <input
                      type="radio"
                      id={`pm-${pm.id}`}
                      name="paymentMethod"
                      value={pm.id}
                      checked={payMethod === pm.id}
                      onChange={() => setPayMethod(pm.id)}
                      className="sr-only"
                    />
                    <span className="payment-option__icon">{pm.icon}</span>
                    <div className="payment-option__info">
                      <span className="payment-option__name">{pm.label}</span>
                      <span className="payment-option__desc">{pm.desc}</span>
                    </div>
                    <span className={`payment-option__radio${payMethod === pm.id ? ' payment-option__radio--checked' : ''}`} aria-hidden="true" />
                  </label>
                ))}
              </div>

              {/* UPI ID input for digital wallets */}
              {['GPAY', 'PHONEPE', 'PAYTM'].includes(payMethod) && (
                <div className="checkout-field" style={{ marginTop: '1rem' }}>
                  <label htmlFor="upiId" className="checkout-label">
                    UPI ID <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional — for direct transfer)</span>
                  </label>
                  <input
                    id="upiId"
                    type="text"
                    className={`form-input${upiError ? ' form-input--error' : ''}`}
                    placeholder="yourname@gpay or 9876543210@ybl"
                    value={upiId}
                    onChange={e => { setUpiId(e.target.value); setUpiError(''); }}
                  />
                  {upiError && <span className="form-error">{upiError}</span>}
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.3rem', display: 'block' }}>
                    You'll be redirected to the payment app to complete.
                  </span>
                </div>
              )}

              {/* Card details placeholder */}
              {payMethod === 'CARD' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '.82rem', color: 'var(--muted)' }}>
                  🔒 Secure card entry will be handled by your payment gateway on the next screen.
                </div>
              )}

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-ghost" style={{ flex: '0 0 auto' }} onClick={() => setStep(1)}>← Back</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '.85rem', fontSize: '1rem', fontWeight: 700 }}
                  onClick={() => { if (validateUpi()) setStep(3); }}
                >
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && (
            <div className="checkout-card">
              <h2 className="checkout-card__title">✅ Review & Place Order</h2>

              {/* Address review */}
              <div className="review-section">
                <div className="review-section__header">
                  <span>📦 Delivery To</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>Edit</button>
                </div>
                <div className="review-section__body">
                  <strong>{address.fullName}</strong> · {address.mobile}<br />
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                  {address.city}, {address.state} — {address.pincode}
                </div>
              </div>

              {/* Payment review */}
              <div className="review-section">
                <div className="review-section__header">
                  <span>💳 Payment</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>Edit</button>
                </div>
                <div className="review-section__body">
                  {PAYMENT_METHODS.find(p => p.id === payMethod)?.icon}{' '}
                  {PAYMENT_METHODS.find(p => p.id === payMethod)?.label}
                  {upiId && <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}> · {upiId}</span>}
                </div>
              </div>

              {/* Items mini-list */}
              <div className="review-section">
                <div className="review-section__header">
                  <span>🛍️ Items ({items.length})</span>
                  <Link to="/cart" className="btn btn-ghost btn-sm">Edit</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '.5rem' }}>
                  {items.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{fmt(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Place order button */}
              <button
                className="btn btn-primary w-full"
                style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 800, marginTop: '.5rem', letterSpacing: '.02em' }}
                onClick={handlePlaceOrder}
                disabled={placing}
                aria-label={`Place order for ${fmt(total)}`}
              >
                {placing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid #00000040', borderTopColor: '#000', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                    Placing Order…
                  </span>
                ) : (
                  `🔒 Place Order · ${fmt(total)}`
                )}
              </button>

              <div className="cart-secure" style={{ marginTop: '1rem' }}>
                <span>🔒</span>
                <span>100% Secure · Free returns within 7 days</span>
              </div>
            </div>
          )}

        </div>

        {/* ══ RIGHT COLUMN: Order Summary ══════════════════════ */}
        <div>
          <div className="cart-summary" style={{ position: 'sticky', top: '5.5rem' }}>
            <h3>Order Summary</h3>

            {/* Mini item list */}
            <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: '1rem' }}>
              {items.map(item => (
                <div key={item.productId} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginBottom: '.6rem' }}>
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=56&h=56&fit=crop'}
                    alt={item.productName}
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=56&h=56&fit=crop'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{fmt(item.totalPrice)}</div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="coupon-section" style={{ marginBottom: '1rem' }}>
              <label htmlFor="co-input">Have a coupon?</label>
              <div className="coupon-input-row">
                <input
                  id="co-input"
                  className="form-input"
                  value={coupon}
                  onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null); }}
                  placeholder="e.g. WELCOME10"
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button className="btn btn-ghost btn-sm" onClick={handleApplyCoupon} disabled={couponLoading || !coupon.trim()}>
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponResult && !couponResult.valid && <div className="form-error">{couponResult.message}</div>}
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.3rem' }}>Try: WELCOME10 · FLAT200 · SAVE20</div>
            </div>

            {/* Totals */}
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? 'var(--green)' : 'inherit' }}>
                {shipping === 0 ? '🚚 FREE' : fmt(shipping)}
              </span>
            </div>
            {couponResult?.valid && (
              <div className="cart-summary-row" style={{ color: 'var(--green)' }}>
                <span>Discount ({coupon})</span>
                <span>−{fmt(discount)}</span>
              </div>
            )}
            <div className="cart-summary-row total">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            {/* Payment badges */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['🟢 GPay', '💜 PhonePe', '🔵 Paytm', '💳 Card', '💵 COD'].map(b => (
                <span key={b} style={{ fontSize: '.65rem', padding: '.2rem .5rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Inline styles (avoids a separate CSS file) ── */}
      <style>{`
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 860px) {
          .checkout-layout { grid-template-columns: 1fr; }
        }

        /* Steps */
        .checkout-steps {
          display: flex;
          gap: .5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .checkout-step {
          display: flex;
          align-items: center;
          gap: .45rem;
          font-size: .82rem;
          color: var(--muted);
          padding: .4rem .75rem;
          border-radius: 20px;
          border: 1.5px solid var(--border);
          transition: all .2s;
        }
        .checkout-step--active {
          color: var(--accent);
          border-color: var(--accent);
          background: rgba(var(--accent-rgb, 0,229,160), .07);
          font-weight: 700;
        }
        .checkout-step--done {
          color: var(--green, #00d68f);
          border-color: var(--green, #00d68f);
        }
        .checkout-step__num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: currentColor;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .7rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* Card */
        .checkout-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 16px);
          padding: 1.75rem;
        }
        .checkout-card__title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.4rem;
        }

        /* Grid helpers */
        .checkout-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .checkout-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        @media (max-width: 540px) {
          .checkout-grid-2 { grid-template-columns: 1fr; }
          .checkout-grid-3 { grid-template-columns: 1fr 1fr; }
        }

        /* Field */
        .checkout-field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .9rem; }
        .checkout-label { font-size: .82rem; font-weight: 600; color: var(--text2); }
        .form-input--error { border-color: var(--red, #ff4d6d) !important; }

        /* Payment options */
        .payment-methods { display: flex; flex-direction: column; gap: .6rem; }
        .payment-option {
          display: flex;
          align-items: center;
          gap: .85rem;
          padding: .85rem 1rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .payment-option--active {
          border-color: var(--accent);
          background: rgba(var(--accent-rgb, 0,229,160), .06);
        }
        .payment-option__icon { font-size: 1.4rem; flex-shrink: 0; }
        .payment-option__info { flex: 1; }
        .payment-option__name { display: block; font-weight: 600; font-size: .9rem; }
        .payment-option__desc { display: block; font-size: .75rem; color: var(--muted); }
        .payment-option__radio {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 2px solid var(--border2);
          flex-shrink: 0;
          transition: border-color .15s;
        }
        .payment-option__radio--checked {
          border-color: var(--accent);
          background: var(--accent);
          box-shadow: inset 0 0 0 3px var(--surface);
        }

        /* Review sections */
        .review-section {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .review-section__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: .6rem 1rem;
          background: var(--surface2);
          font-size: .82rem;
          font-weight: 700;
          border-bottom: 1px solid var(--border);
        }
        .review-section__body {
          padding: .75rem 1rem;
          font-size: .85rem;
          line-height: 1.6;
          color: var(--text2);
        }

        /* Screen reader only */
        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
}
