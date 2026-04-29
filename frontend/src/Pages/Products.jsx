import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../config/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [query,    setQuery]    = useState('');
  const [page,     setPage]     = useState(0);
  const [totalPages, setTotal]  = useState(0);
  const [loading,  setLoading]  = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = query
        ? `/products/search?q=${encodeURIComponent(query)}&page=${page}&size=20`
        : `/products?page=${page}&size=20`;
      const { data } = await api.get(url);
      setProducts(data.content || []);
      setTotal(data.totalPages || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [query, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>All Products</h1>

      <input
        style={styles.search}
        type="text"
        placeholder="Search products…"
        value={query}
        onChange={e => { setQuery(e.target.value); setPage(0); }}
      />

      {loading ? (
        <p style={{ textAlign:'center', marginTop:'40px' }}>Loading…</p>
      ) : (
        <>
          <div style={styles.grid}>
            {products.length ? products.map(p => <ProductCard key={p.id} product={p} />) : <p>No products found.</p>}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button disabled={page === 0}             onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  wrap:       { maxWidth:'1200px', margin:'0 auto', padding:'32px 24px' },
  title:      { fontSize:'1.8rem', fontWeight:700, marginBottom:'20px' },
  search:     { width:'100%', padding:'12px 16px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', marginBottom:'24px' },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'20px' },
  pagination: { display:'flex', justifyContent:'center', alignItems:'center', gap:'20px', marginTop:'32px' },
};