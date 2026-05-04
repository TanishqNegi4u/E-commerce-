// src/pages/ProductDetail.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/client';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

/* ── Stars ───────────────────────────────────────────── */
function Stars({ rating = 0, size = '1.1rem', interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  const r = Math.round((rating || 0) * 2) / 2;
  return (
    <span className="product-detail__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          style={{
            color: (interactive ? (hover || rating) : r) > i ? '#f5a623' : 'var(--border2)',
            fontSize: size,
            cursor: interactive ? 'pointer' : 'default',
          }}
          onMouseEnter={() => interactive && setHover(i + 1)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate && onRate(i + 1)}
        >★</span>
      ))}
    </span>
  );
}

/* ── RatingBar ───────────────────────────────────────── */
function RatingBar({ label, pct }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', marginBottom: '4px' }}>
      <span style={{ width: '24px', color: 'var(--muted)', textAlign: 'right' }}>{label}★</span>
      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#f5a623', borderRadius: '3px', transition: 'width .6s ease' }} />
      </div>
      <span style={{ width: '28px', color: 'var(--muted)' }}>{pct}%</span>
    </div>
  );
}

/* ── Mock reviews ────────────────────────────────────── */
const MOCK_REVIEWS = [
  { id: 1, author: 'Arjun M.', rating: 5, date: '12 Apr 2025', title: 'Absolutely love it!', body: 'Quality is top-notch. Delivery was super fast. Highly recommended to everyone looking for value.', helpful: 34 },
  { id: 2, author: 'Priya S.', rating: 4, date: '3 Mar 2025', title: 'Great product, minor issue', body: 'Works perfectly for daily use. Packaging could be better but the product itself is excellent.', helpful: 18 },
  { id: 3, author: 'Ravi K.', rating: 5, date: '18 Feb 2025', title: 'Best purchase this year', body: 'Exceeded my expectations. Build quality is solid and performance is flawless. Will buy again!', helpful: 27 },
  { id: 4, author: 'Sneha T.', rating: 3, date: '5 Jan 2025', title: 'Decent for the price', body: 'It does the job. Nothing extraordinary but definitely worth the money at this price point.', helpful: 9 },
  { id: 5, author: 'Karan D.', rating: 4, date: '29 Dec 2024', title: 'Solid choice', body: 'Using it for 2 months now. No complaints. The build is sturdy and the finish looks premium.', helpful: 21 },
];

/* ── Pincode Checker ─────────────────────────────────── */
function PincodeChecker() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = () => {
    if (pin.length !== 6 || isNaN(pin)) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const days = 2 + (Number(pin[5]) % 4);
      const d = new Date();
      d.setDate(d.getDate() + days);
      const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
      setResult({ available: true, date: dateStr, cod: Number(pin) % 3 !== 0 });
      setLoading(false);
    }, 900);
  };

  return (
    <div className="pdp-pincode">
      <div className="pdp-pincode__label">📍 Check Delivery</div>
      <div className="pdp-pincode__row">
        <input
          className="pdp-pincode__input"
          type="text"
          maxLength={6}
          placeholder="Enter pincode"
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && check()}
        />
        <button className="pdp-pincode__btn" onClick={check} disabled={loading}>
          {loading ? '…' : 'Check'}
        </button>
      </div>
      {result && (
        <div className="pdp-pincode__result">
          <span style={{ color: 'var(--green)' }}>✓</span>
          {' '}Delivery by <strong>{result.date}</strong>
          {result.cod && <span className="pdp-pincode__cod"> · COD available</span>}
        </div>
      )}
    </div>
  );
}

/* ── EMI Section ─────────────────────────────────────── */
function EMISection({ price }) {
  const [open, setOpen] = useState(false);
  const banks = [
    { name: 'HDFC Bank', months: [3, 6, 9, 12], rate: 13 },
    { name: 'ICICI Bank', months: [3, 6, 9, 12], rate: 14 },
    { name: 'SBI Card', months: [3, 6, 12, 24], rate: 15 },
    { name: 'Axis Bank', months: [3, 6, 9], rate: 14 },
    { name: 'Kotak Bank', months: [6, 12, 18], rate: 13 },
  ];
  const calcEmi = (p, months, rate) => {
    const r = rate / 100 / 12;
    return Math.ceil(p * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
  };
  return (
    <div className="pdp-emi">
      <button className="pdp-emi__toggle" onClick={() => setOpen(o => !o)}>
        💳 No Cost EMI available — <span style={{ textDecoration: 'underline' }}>View Plans</span>
        <span style={{ marginLeft: '6px', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '.2s' }}>▾</span>
      </button>
      {open && (
        <div className="pdp-emi__table">
          <table>
            <thead>
              <tr><th>Bank</th><th>3 Mo</th><th>6 Mo</th><th>12 Mo</th></tr>
            </thead>
            <tbody>
              {banks.map(b => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  {[3, 6, 12].map(m => (
                    <td key={m}>{b.months.includes(m) ? fmt(calcEmi(price, m, b.rate)) + '/mo' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '8px' }}>* Standard bank interest rates apply. Actual EMI may vary.</p>
        </div>
      )}
    </div>
  );
}

/* ── Offers Section ─────────────────────────────────── */
function OffersSection() {
  return (
    <div className="pdp-offers">
      <div className="pdp-offers__title">🏷️ Available Offers</div>
      {[
        { icon: '💰', text: 'Bank Offer: 10% off on HDFC Bank Credit Cards, up to ₹1,500' },
        { icon: '🎁', text: 'Special Price: Get extra 5% off (price inclusive of cashback)' },
        { icon: '🚚', text: 'Free Delivery on orders above ₹499' },
        { icon: '🔄', text: 'No Cost EMI from ₹799/month. Select EMI at checkout.' },
      ].map((o, i) => (
        <div key={i} className="pdp-offers__item">
          <span className="pdp-offers__icon">{o.icon}</span>
          <span>{o.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Return & Warranty ───────────────────────────────── */
function ReturnPolicy() {
  return (
    <div className="pdp-policy">
      {[
        { icon: '🔁', title: '7 Day Return', desc: 'Easy returns within 7 days of delivery' },
        { icon: '🛡️', title: '1 Year Warranty', desc: 'Manufacturer warranty included' },
        { icon: '✅', title: '100% Genuine', desc: 'Verified & authentic product' },
        { icon: '🚚', title: 'Free Shipping', desc: 'Free delivery on this order' },
      ].map((p, i) => (
        <div key={i} className="pdp-policy__item">
          <span className="pdp-policy__icon">{p.icon}</span>
          <div>
            <div className="pdp-policy__title">{p.title}</div>
            <div className="pdp-policy__desc">{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Reviews Section ─────────────────────────────────── */
function ReviewsSection({ product }) {
  const [newReview, setNewReview] = useState({ rating: 0, title: '', body: '' });
  const [submitted, setSubmitted] = useState(false);
  const [helpfulSet, setHelpfulSet] = useState(new Set());

  const rating = product.averageRating || 4.2;
  const total = product.totalReviews || 128;
  const dist = [
    { star: 5, pct: 58 },
    { star: 4, pct: 24 },
    { star: 3, pct: 10 },
    { star: 2, pct: 5 },
    { star: 1, pct: 3 },
  ];

  const handleSubmit = () => {
    if (!newReview.rating) { toast.error('Please select a rating'); return; }
    if (!newReview.body.trim()) { toast.error('Please write a review'); return; }
    toast.success('Review submitted! (demo)');
    setSubmitted(true);
  };

  return (
    <div className="pdp-reviews">
      <h2 className="pdp-section-title">Ratings & Reviews</h2>

      {/* Summary */}
      <div className="pdp-reviews__summary">
        <div className="pdp-reviews__big-score">
          <span className="pdp-reviews__score">{rating.toFixed(1)}</span>
          <Stars rating={rating} size="1.4rem" />
          <span className="pdp-reviews__total">{total.toLocaleString('en-IN')} ratings</span>
        </div>
        <div className="pdp-reviews__bars">
          {dist.map(d => <RatingBar key={d.star} label={d.star} pct={d.pct} />)}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="pdp-reviews__list">
        {MOCK_REVIEWS.map(r => (
          <div key={r.id} className="pdp-review-card">
            <div className="pdp-review-card__header">
              <div className="pdp-review-card__avatar">{r.author[0]}</div>
              <div>
                <div className="pdp-review-card__author">{r.author}</div>
                <div className="pdp-review-card__date">{r.date}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Stars rating={r.rating} size=".9rem" />
              </div>
            </div>
            <div className="pdp-review-card__title">{r.title}</div>
            <div className="pdp-review-card__body">{r.body}</div>
            <button
              className={`pdp-review-card__helpful ${helpfulSet.has(r.id) ? 'pdp-review-card__helpful--active' : ''}`}
              onClick={() => setHelpfulSet(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
            >
              👍 Helpful ({r.helpful + (helpfulSet.has(r.id) ? 1 : 0)})
            </button>
          </div>
        ))}
      </div>

      {/* Write review */}
      {!submitted ? (
        <div className="pdp-write-review">
          <h3 className="pdp-write-review__title">Write a Review</h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '6px' }}>Your Rating</div>
            <Stars rating={newReview.rating} size="1.6rem" interactive onRate={v => setNewReview(r => ({ ...r, rating: v }))} />
          </div>
          <input
            className="form-input"
            placeholder="Review title"
            value={newReview.title}
            onChange={e => setNewReview(r => ({ ...r, title: e.target.value }))}
            style={{ marginBottom: '10px' }}
          />
          <textarea
            className="form-input"
            placeholder="Share your experience with this product..."
            rows={4}
            value={newReview.body}
            onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))}
            style={{ marginBottom: '12px', resize: 'vertical' }}
          />
          <button className="btn btn-primary" onClick={handleSubmit}>Submit Review</button>
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'rgba(0,214,143,.08)', borderRadius: '10px', color: 'var(--green)', fontSize: '.9rem' }}>
          ✓ Thanks for your review!
        </div>
      )}
    </div>
  );
}

/* ── Similar Products ────────────────────────────────── */
function SimilarProducts({ currentId }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { data } = useQuery({
    queryKey: ['products-featured'],
    queryFn: productApi.getFeatured,
    staleTime: 5 * 60 * 1000,
  });

  const products = (data?.content || data || [])
    .filter(p => String(p.id) !== String(currentId))
    .slice(0, 6);

  if (!products.length) return null;

  return (
    <div className="pdp-similar">
      <h2 className="pdp-section-title">Similar Products</h2>
      <div className="pdp-similar__grid">
        {products.map(p => {
          const img = p.imageUrl || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
          const disc = p.discountPercent
            ? Math.round(p.discountPercent)
            : p.originalPrice && p.price < p.originalPrice
              ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
          return (
            <div key={p.id} className="pdp-similar__card" onClick={() => { navigate(`/product/${p.id}`); window.scrollTo(0, 0); }}>
              <div className="pdp-similar__img-wrap">
                <img src={img} alt={p.name} loading="lazy"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'; }} />
                {disc > 0 && <span className="product-card__badge">−{disc}%</span>}
              </div>
              <div className="pdp-similar__info">
                {p.brand && <div style={{ fontSize: '.7rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{p.brand}</div>}
                <div className="pdp-similar__name">{p.name}</div>
                {p.averageRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Stars rating={p.averageRating} size=".75rem" />
                    <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>({p.totalReviews || 0})</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{fmt(p.price)}</span>
                  {p.originalPrice > p.price && <span style={{ fontSize: '.75rem', color: 'var(--muted)', textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</span>}
                </div>
                <button
                  className="pdp-similar__btn"
                  onClick={e => { e.stopPropagation(); addToCart(p.id, 1); }}
                >Add to Cart</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Image Gallery ───────────────────────────────────── */
function ImageGallery({ product }) {
  const base = product.imageUrl || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop';
  // Generate multiple angle mock images using same base with different crop params
  const thumbs = [
    base,
    base.replace('fit=crop', 'fit=crop&crop=top'),
    base.replace('fit=crop', 'fit=crop&crop=bottom'),
    base.replace('w=600&h=600', 'w=600&h=600').replace('fit=crop', 'fit=crop&crop=left'),
  ];
  const [active, setActive] = useState(0);

  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__main">
        <img
          src={thumbs[active]}
          alt={product.name}
          className="product-detail__img"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'; }}
        />
      </div>
      <div className="pdp-gallery__thumbs">
        {thumbs.map((t, i) => (
          <button
            key={i}
            className={`pdp-gallery__thumb ${active === i ? 'pdp-gallery__thumb--active' : ''}`}
            onClick={() => setActive(i)}
          >
            <img src={t} alt={`View ${i + 1}`}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'; }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
  });

  useDocumentTitle(product?.name || null);

  // Scroll to top on product change
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const handleAdd = async () => {
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  if (isLoading) return (
    <div className="container page-wrap">
      <div className="product-detail">
        <div className="skeleton" style={{ aspectRatio: 1, borderRadius: 'var(--radius-lg)' }} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[280, 80, 120, 60, 200].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-sm)' }} aria-hidden="true" />
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="container page-wrap">
      <div className="error-banner" role="alert">
        <span className="error-banner__icon">⚠️</span>
        <span>Could not load product. <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>Go back</button></span>
      </div>
    </div>
  );

  if (!product) return null;

  const discount = product.discountPercent
    ? Math.round(product.discountPercent)
    : product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const savings = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price : 0;

  const specs = product.specifications ? Object.entries(product.specifications) : [];
  const inStock = product.stock > 0;

  const TABS = ['overview', 'specifications', 'reviews'];

  return (
    <div className="container page-wrap">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '.82rem', color: 'var(--muted)', display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--muted)' }}>Home</Link>
        <span>›</span>
        <Link to="/products" style={{ color: 'var(--muted)' }}>Products</Link>
        <span>›</span>
        <span style={{ color: 'var(--text2)' }}>{product.name}</span>
      </nav>

      {/* Main 2-col layout */}
      <div className="product-detail">
        {/* Left — Image Gallery */}
        <ImageGallery product={product} />

        {/* Right — Info */}
        <div>
          {product.brand && <div className="product-detail__brand">{product.brand}</div>}
          <h1 className="product-detail__title">{product.name}</h1>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="product-detail__rating">
              <Stars rating={product.averageRating} />
              <span className="product-detail__rating-count">
                {product.averageRating?.toFixed(1)} · {(product.totalReviews || 0).toLocaleString('en-IN')} reviews
              </span>
            </div>
          )}

          {/* Stock badge */}
          <div className={`product-detail__stock-badge product-detail__stock-badge--${inStock ? 'in' : 'out'}`}>
            <span className="product-detail__stock-dot" aria-hidden="true" />
            {inStock ? `${product.stock} in stock` : 'Out of stock'}
          </div>

          {/* Price */}
          <div className="product-detail__price-row">
            <span className="product-detail__price">{fmt(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="product-detail__original">{fmt(product.originalPrice)}</span>
            )}
            {discount > 0 && (
              <span className="product-detail__discount">−{discount}%</span>
            )}
          </div>
          {savings > 0 && (
            <div className="product-detail__savings">You save {fmt(savings)}</div>
          )}

          {/* Description */}
          {product.description && (
            <p className="product-detail__desc">{product.description}</p>
          )}

          {/* Offers */}
          <OffersSection />

          {/* Qty + Add */}
          {inStock && (
            <>
              <div className="product-detail__qty-row">
                <span className="product-detail__qty-label">Qty</span>
                <div className="qty-control">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
                  <span aria-label={`Quantity: ${qty}`}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div className="product-detail__actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAdd}
                  disabled={adding}
                  aria-label={`Add ${qty} to cart`}
                >
                  {adding ? 'Adding…' : '🛒 Add to Cart'}
                </button>
                <button className="btn btn-ghost btn-lg" aria-label="Add to wishlist">🤍 Wishlist</button>
              </div>
            </>
          )}

          {/* EMI */}
          <EMISection price={product.price} />

          {/* Pincode */}
          <PincodeChecker />

          {/* Return Policy */}
          <ReturnPolicy />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="pdp-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`pdp-tab ${activeTab === t ? 'pdp-tab--active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="pdp-tab-content">
          <h2 className="pdp-section-title">Product Overview</h2>
          <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '.95rem' }}>
            {product.description || 'No description available.'}
          </p>
          {specs.length > 0 && (
            <div className="product-detail__specs" style={{ marginTop: '1.5rem' }}>
              <div className="product-detail__specs-title">Key Specs</div>
              {specs.slice(0, 6).map(([k, v]) => (
                <div key={k} className="product-detail__spec">
                  <span className="product-detail__spec-key">{k}</span>
                  <span className="product-detail__spec-val">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'specifications' && (
        <div className="pdp-tab-content">
          {specs.length > 0 ? (
            <div className="product-detail__specs">
              <div className="product-detail__specs-title">Full Specifications</div>
              {specs.map(([k, v]) => (
                <div key={k} className="product-detail__spec">
                  <span className="product-detail__spec-key">{k}</span>
                  <span className="product-detail__spec-val">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', padding: '2rem 0', textAlign: 'center' }}>
              No specifications available for this product.
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="pdp-tab-content">
          <ReviewsSection product={product} />
        </div>
      )}

      {/* Similar Products */}
      <SimilarProducts currentId={id} />
    </div>
  );
}
