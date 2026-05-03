// frontend/src/pages/ProductDetail.js  — FULL REPLACEMENT
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/client';
import { useCart } from '../context/CartContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

function Stars({ rating = 0, size = '1.1rem' }) {
  const r = Math.round((rating || 0) * 2) / 2;
  return (
    <span className="product-detail__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < r ? 'var(--accent)' : 'var(--border2)', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty]         = useState(1);
  const [adding, setAdding]   = useState(false);
  const [zoomed, setZoomed]   = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addBtnRef = useRef(null);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
  });

  useDocumentTitle(product?.name || null);

  // ── Show sticky bar when main Add button scrolls out of view ──
  useEffect(() => {
    if (!addBtnRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(addBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  // ── Wishlist (localStorage) ────────────────────────────────
  const [wishlisted, setWishlisted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_wishlist') || '[]').includes(Number(id)); }
    catch { return false; }
  });

  const toggleWishlist = () => {
    try {
      const wl   = JSON.parse(localStorage.getItem('sw_wishlist') || '[]');
      const pid  = Number(id);
      const next = wishlisted ? wl.filter(x => x !== pid) : [...wl, pid];
      localStorage.setItem('sw_wishlist', JSON.stringify(next));
      setWishlisted(!wishlisted);
      toast(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist', { duration: 1800 });
    } catch {}
  };

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  // ── Loading skeleton ───────────────────────────────────────
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

  const imageUrl = product.imageUrl || product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop';

  const discount = product.discountPercent
    ? Math.round(product.discountPercent)
    : product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const savings = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice - product.price : 0;

  const specs  = product.specifications ? Object.entries(product.specifications) : [];
  const inStock = product.stock > 0;

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

      <div className="product-detail">
        {/* ── Image with zoom ── */}
        <div className="product-detail__img-wrap" style={{ overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt={product.name}
            className="product-detail__img"
            onClick={() => setZoomed(z => !z)}
            style={{
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
              transform: zoomed ? 'scale(1.45)' : 'scale(1)',
              transition: 'transform .35s ease',
            }}
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'; }}
          />
          {zoomed && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: '.7rem', padding: '.2rem .5rem', borderRadius: 8 }}>
              Click to zoom out
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div>
          {product.brand && <div className="product-detail__brand">{product.brand}</div>}
          <h1 className="product-detail__title">{product.name}</h1>

          {product.averageRating > 0 && (
            <div className="product-detail__rating">
              <Stars rating={product.averageRating} />
              <span className="product-detail__rating-count">
                {product.averageRating?.toFixed(1)} · {product.totalReviews || 0} reviews
              </span>
            </div>
          )}

          <div className={`product-detail__stock-badge product-detail__stock-badge--${inStock ? 'in' : 'out'}`}>
            <span className="product-detail__stock-dot" aria-hidden="true" />
            {inStock ? `${product.stock} in stock` : 'Out of stock'}
          </div>

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

          {product.description && (
            <p className="product-detail__desc">{product.description}</p>
          )}

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
              <div className="product-detail__actions" ref={addBtnRef}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAdd}
                  disabled={adding}
                  aria-label={`Add ${qty} to cart`}
                >
                  {adding ? 'Adding…' : '🛒 Add to Cart'}
                </button>
                <button
                  className="btn btn-ghost btn-lg"
                  onClick={toggleWishlist}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlisted ? '❤️ Wishlisted' : '🤍 Wishlist'}
                </button>
              </div>
            </>
          )}

          {specs.length > 0 && (
            <div className="product-detail__specs">
              <div className="product-detail__specs-title">Specifications</div>
              {specs.map(([k, v]) => (
                <div key={k} className="product-detail__spec">
                  <span className="product-detail__spec-key">{k}</span>
                  <span className="product-detail__spec-val">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky mobile CTA (shows when main button scrolled out) ── */}
      {inStock && showStickyBar && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          padding: '.75rem 1rem', zIndex: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', boxShadow: '0 -4px 20px rgba(0,0,0,.15)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>{fmt(product.price)}</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={adding}
            style={{ flexShrink: 0, padding: '.65rem 1.4rem' }}
          >
            {adding ? 'Adding…' : '🛒 Add to Cart'}
          </button>
        </div>
      )}
    </div>
  );
}
