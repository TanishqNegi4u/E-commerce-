import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/client';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

function SkeletonGrid({ count = 20 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q    = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '0');

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q, page],
    queryFn: () => productApi.search(q, page),
    enabled: !!q,
  });

  const products   = data?.content || (Array.isArray(data) ? data : []);
  const totalPages = data?.totalPages || 1;
  const total      = data?.totalElements ?? products.length;

  const setPage = (p) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', p); return n; });
    window.scrollTo(0, 0);
  };

  return (
    <div className="container page-wrap">
      <div className="page-header">
        <h1>Search Results</h1>
        {q && (
          <p className="text-muted">
            {isLoading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for "${q}"`}
          </p>
        )}
      </div>

      {!q && (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <h3>Start searching</h3>
          <p>Use the search bar above to find products.</p>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">⚠️</span>
          <span>Search failed. Please try again.</span>
        </div>
      )}

      {q && isLoading && <SkeletonGrid />}

      {q && !isLoading && !error && products.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon">🔍</span>
          <h3>No results for "{q}"</h3>
          <p>Try a different search term.</p>
          <Link to="/products" className="btn btn-ghost mt-2">Browse All Products</Link>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Search results pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <button
                  key={i}
                  className={i === page ? 'active' : ''}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === page ? 'page' : undefined}
                >{i + 1}</button>
              ))}
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} aria-label="Next page">›</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}