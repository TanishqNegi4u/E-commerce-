import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

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

// Generate a deterministic delivery date (2-5 days) based on product id
function getDeliveryDate(productId) {
  const days = 2 + (Number(String(productId).replace(/\D/g, '').slice(-1) || 0) % 4);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const imageUrl = product.imageUrl || product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

  const discount = product.discountPercent
    ? Math.round(product.discountPercent)
    : product.originalPrice && product.price < product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const deliveryDate = getDeliveryDate(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product.id, 1);
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
        <button
          className="product-card__wishlist"
          onClick={e => e.stopPropagation()}
          aria-label={`Add ${product.name} to wishlist`}
          title="Wishlist (coming soon)"
          aria-disabled="true"
        >
          🤍
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
          className="product-card__add-btn"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}
