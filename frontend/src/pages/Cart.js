// frontend/src/pages/Cart.js  — FULL REPLACEMENT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { couponApi } from '../api/client';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

export default function Cart() {
  useDocumentTitle('Shopping Cart');
  const { cart, loading, fetchCart, updateQuantity, removeItem, itemCount } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon]               = useState('');
  const [couponResult, setCouponResult]   = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Always fetch fresh cart when this page mounts
  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived totals ─────────────────────────────────────────
  const items    = cart?.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const discount = couponResult?.valid ? Number(couponResult.discountAmount || 0) : 0;
  const total    = Math.max(0, subtotal + shipping - discount);

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

  // ── FIX: Proceed to checkout instead of placing order directly ──
  const handleProceedToCheckout = () => {
    // Persist coupon so Checkout page can pick it up
    if (couponResult?.valid) {
      sessionStorage.setItem('sw_pending_coupon', JSON.stringify({ code: coupon, result: couponResult }));
    } else {
      sessionStorage.removeItem('sw_pending_coupon');
    }
    navigate('/checkout');
  };

  return (
    <div className="container page-wrap">
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <p className="text-muted">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius)' }} aria-hidden="true" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" role="img" aria-label="Empty cart">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn btn-primary mt-2">Shop Now</Link>
        </div>
      ) : (
        <div className="cart-page">

          {/* ── Cart Items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {items.map(item => (
              <div key={item.productId || item.id} className="cart-item">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'}
                  alt={item.productName}
                  className="cart-item__img"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'; }}
                />
                <div>
                  <div className="cart-item__name">{item.productName}</div>
                  <div className="cart-item__price">{fmt(item.unitPrice || item.price)} each</div>
                  <div className="qty-control" style={{ marginTop: '.5rem' }}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >−</button>
                    <span aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
                  <span className="cart-item__total">{fmt(item.totalPrice)}</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.productName} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order Summary + Checkout ── */}
          <div>
            <div className="cart-summary">
              <h3>Order Summary</h3>

              <div className="cart-summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Shipping</span>
                <span style={{ color: shipping === 0 ? 'var(--green)' : 'inherit' }}>
                  {shipping === 0 ? '🚚 FREE' : fmt(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '.5rem' }}>
                  Add {fmt(500 - subtotal)} more for FREE shipping
                </div>
              )}
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

              {/* Savings callout */}
              {(discount > 0 || shipping === 0) && (
                <div style={{
                  background: 'rgba(0,229,160,.08)', border: '1px solid rgba(0,229,160,.2)',
                  borderRadius: 'var(--radius-sm)', padding: '.6rem .85rem',
                  fontSize: '.78rem', color: 'var(--green)', marginBottom: '1rem'
                }}>
                  🎉 You are saving {fmt(discount + (shipping === 0 ? 49 : 0))} on this order!
                </div>
              )}

              {/* Coupon */}
              <div className="coupon-section">
                <label htmlFor="coupon-input">Have a coupon?</label>
                <div className="coupon-input-row">
                  <input
                    id="coupon-input"
                    className="form-input"
                    value={coupon}
                    onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null); }}
                    placeholder="e.g. WELCOME10"
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    aria-label="Coupon code"
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !coupon.trim()}
                    aria-label="Apply coupon"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponResult && !couponResult.valid && (
                  <div className="form-error">{couponResult.message}</div>
                )}
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.4rem' }}>
                  Try: WELCOME10 · FLAT200 · SAVE20
                </div>
              </div>

              {/* ── CHECKOUT BUTTON ── */}
              <button
                className="btn btn-primary w-full"
                style={{ padding: '.9rem', fontSize: '1rem', fontWeight: 700, marginBottom: '.75rem' }}
                onClick={handleProceedToCheckout}
                disabled={items.length === 0}
                aria-label={`Proceed to checkout, total ${fmt(total)}`}
              >
                🛒 Proceed to Checkout · {fmt(total)}
              </button>

              <button
                className="btn btn-ghost w-full"
                style={{ fontSize: '.88rem', marginBottom: '.75rem' }}
                onClick={() => navigate('/products')}
              >
                ← Continue Shopping
              </button>

              <div className="cart-secure">
                <span>🔒</span>
                <span>100% Secure · Free returns within 7 days</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
