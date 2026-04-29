import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import api from '../config/api';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/products/featured')
       .then(r => setFeatured(r.data))
       .catch(console.error)
       .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Shop Everything You Love</h1>
        <p  style={styles.heroSub}>Best prices · Fast delivery · Secure checkout</p>
        <Link to="/products" style={styles.heroBtn}>Browse All Products →</Link>
      </section>

      {/* Featured */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Featured Products</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={styles.grid}>
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  hero:       { background:'linear-gradient(135deg,#1a1a2e,#16213e)', color:'#fff', padding:'80px 24px', textAlign:'center' },
  heroTitle:  { fontSize:'clamp(1.8rem,5vw,3.5rem)', fontWeight:800, marginBottom:'16px' },
  heroSub:    { fontSize:'1.1rem', color:'#90caf9', marginBottom:'32px' },
  heroBtn:    { background:'#ff9800', color:'#fff', padding:'14px 32px', borderRadius:'8px', fontWeight:700, fontSize:'1rem', display:'inline-block' },
  section:    { maxWidth:'1200px', margin:'48px auto', padding:'0 24px' },
  sectionTitle:{ fontSize:'1.5rem', fontWeight:700, marginBottom:'24px' },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'20px' },
};