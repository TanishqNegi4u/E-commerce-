// frontend/src/components/ProductCard.js  — FULL REPLACEMENT
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

function Stars({ rating = 0 }) {
  const r = Math.round((rating || 0) * 2) / 2;
  return (
    <span className="product-card__stars" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < r ? '#f5a623' : 'var(--border2)' }}>★</span>
      ))}
    </span>
  );
}

function getDeliveryDate(productId) {
  const days = 2 + (Number(String(productId).replace(/\D/g, '').slice(-1) || 0) % 4);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ProductCard({ product }) {
  const navigate   = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding]       = useState(false);
  const [added, setAdded]         = useState(false);

  // ── Persistent Wishlist via localStorage ──────────────────
  const [wishlisted, setWishlisted] = useState(() => {
    try {
      const wl = JSON.parse(localStorage.getItem('sw_wishlist') || '[]');
      return wl.includes(product.id);
    } catch { return false; }
  });

  const toggleWishlist = (e) => {
    e.stopPropagation();
    try {
      const wl   = JSON.parse(localStorage.getItem('sw_wishlist') || '[]');
      const next = wishlisted
        ? wl.filter(id => id !== product.id)
        : [...wl, product.id];
      localStorage.setItem('sw_wishlist', JSON.stringify(next));
      setWishlisted(!wishlisted);
      toast(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist', { duration: 1800 });
    } catch {}
  };

  const imageUrl = product.imageUrl || product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

  const discount = product.discountPercent
    ? Math.round(product.discountPercent)
    : product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const deliveryDate = getDeliveryDate(product.id);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    await addToCart(product.id, 1);
    setAdding(false);
    // Brief "added" feedback on the button
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/product/${product.id}`);
        }
      }}
      aria-label={`${product.name}, ${fmt(product.price)}`}
    >
      <div className="product-card__img-wrap">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'; }}
        />
        {discount > 0 && (
          <span className="product-card__badge" aria-label={`${discount}% off`}>−{discount}%</span>
        )}
        {/* ── Working Wishlist button ── */}
        <button
          className="product-card__wishlist"
          onClick={toggleWishlist}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{ color: wishlisted ? '#ff4d6d' : undefined }}
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="product-card__body">
        {product.brand && <div className="product-card__brand">{product.brand}</div>}
        <div className="product-card__name">{product.name}</div>

        {product.averageRating > 0 && (
          <div className="product-card__rating">
            <Stars rating={product.averageRating} />
            <span className="product-card__rating-count">
              ({(product.totalReviews || 0).toLocaleString('en-IN')})
            </span>
          </div>
        )}

        <div className="product-card__price-row">
          <span className="product-card__price">{fmt(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-card__original">{fmt(product.originalPrice)}</span>
          )}
          {discount > 0 && (
            <span className="product-card__discount-pct">{discount}% off</span>
          )}
        </div>

        <div className="product-card__delivery">
          <span className="product-card__delivery-icon">🚚</span>
          <span>FREE delivery by <strong>{deliveryDate}</strong></span>
        </div>

        <button
          className={`product-card__add-btn${added ? ' product-card__add-btn--added' : ''}`}
          onClick={handleAdd}
          disabled={adding}
          aria-label={`Add ${product.name} to cart`}
          style={added ? { background: 'var(--green, #00d68f)', color: '#000' } : undefined}
        >
          {adding ? '…' : added ? '✓ Added!' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
