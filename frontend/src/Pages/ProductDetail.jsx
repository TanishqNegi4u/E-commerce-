import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function ProductDetail() {
  const { slug }          = useParams();
  const [product, setProd] = useState(null);
  const { addToCart }     = useCart();
  const { token }         = useAuth();

  useEffect(() => {
    api.get(`/products/slug/${slug}`).then(r => setProd(r.data)).catch(console.error);
  }, [slug]);

  if (!product) return <p style={{ padding:'40px', textAlign:'center' }}>Loading…</p>;

  const handleAdd = async () => {
    if (!token) { alert('Please login first'); return; }
    await addToCart(product.id);
    alert('Added to cart!');
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.grid}>
        <img src={product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
             alt={product.name} style={styles.img} />
        <div style={styles.info}>
          <p style={styles.brand}>{product.brand}</p>
          <h1 style={styles.name}>{product.name}</h1>
          <div style={styles.rating}>★ {product.averageRating?.toFixed(1)} ({product.totalReviews?.toLocaleString()} reviews)</div>
          <div style={styles.priceRow}>
            <span style={styles.price}>₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice && <span style={styles.original}>₹{product.originalPrice?.toLocaleString('en-IN')}</span>}
          </div>
          {product.freeShipping && <p style={styles.freeShip}>✔ Free Delivery</p>}
          <p style={styles.stock}>
            {product.stock > 0 ? `In Stock (${product.stock} left)` : '❌ Out of Stock'}
          </p>
          <p style={styles.desc}>{product.description}</p>
          <button onClick={handleAdd} disabled={!product.stock} style={styles.btn}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap:     { maxWidth:'1100px', margin:'40px auto', padding:'0 24px' },
  grid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'48px', alignItems:'start' },
  img:      { width:'100%', borderRadius:'12px', background:'#f9f9f9', padding:'20px', objectFit:'contain', maxHeight:'420px' },
  info:     { display:'flex', flexDirection:'column', gap:'12px' },
  brand:    { color:'#666', textTransform:'uppercase', fontSize:'0.8rem', letterSpacing:'0.08em' },
  name:     { fontSize:'1.6rem', fontWeight:700, lineHeight:1.2 },
  rating:   { color:'#f59e0b', fontWeight:600 },
  priceRow: { display:'flex', alignItems:'baseline', gap:'12px' },
  price:    { fontSize:'2rem', fontWeight:800 },
  original: { fontSize:'1.1rem', color:'#999', textDecoration:'line-through' },
  freeShip: { color:'#2e7d32', fontWeight:600 },
  stock:    { color:'#555', fontSize:'0.9rem' },
  desc:     { color:'#444', lineHeight:1.7 },
  btn:      { background:'#ff9800', color:'#fff', border:'none', borderRadius:'8px', padding:'14px 28px', fontSize:'1rem', fontWeight:700 },
};