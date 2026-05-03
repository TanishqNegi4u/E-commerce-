import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productApi, categoryApi } from '../api/client';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SORT_OPTIONS = [
  { label: 'Newest First',        value: 'createdAt,desc' },
  { label: 'Price: Low to High',  value: 'price,asc' },
  { label: 'Price: High to Low',  value: 'price,desc' },
  { label: 'Top Rated',           value: 'averageRating,desc' },
];

function SkeletonGrid({ count = 20 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page  = parseInt(searchParams.get('page') || '0');
  const catId = searchParams.get('cat') || '';
  const sort  = searchParams.get('sort') || 'createdAt,desc';

  const setParam = (key, val) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set(key, val);
      if (key !== 'page') n.set('page', '0');
      return n;
    });
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
    staleTime: Infinity,
  });

  useDocumentTitle('Products');

  const [sortBy, sortDir] = sort.split(',');

  // BUG-5 FIX: keepPreviousData was removed in React Query v5.
  // The correct v5 API is placeholderData: keepPreviousData (imported from the library).
  // This shows the previous page's data while the next page loads, preventing a full
  // loading flash on every page change.
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, catId, sortBy, sortDir],
    queryFn: () => catId
      ? productApi.getByCategory(catId, page)
      : productApi.getAll(page, 20, sortBy, sortDir),
    placeholderData: keepPreviousData,
  });

  const products   = data?.content || (Array.isArray(data) ? data : []);
  const totalPages = data?.totalPages || 1;
  const total      = data?.totalElements ?? products.length;
  const cats       = Array.isArray(categories) ? categories : categories?.content || [];

  return (
    <div className="container page-wrap">
      <div className="page-header">
        <h1>All Products</h1>
        <p className="text-muted">{total} products available</p>
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="filters-bar" role="search" aria-label="Filter products">
        <span className="filters-bar__label">Filter</span>

        <select
          className="form-input"
          style={{ width: 'auto' }}
          value={catId}
          onChange={e => setParam('cat', e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          className="form-input"
          style={{ width: 'auto' }}
          value={sort}
          onChange={e => setParam('sort', e.target.value)}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {catId && (
          <button className="btn btn-ghost btn-sm" onClick={() => setParam('cat', '')} aria-label="Clear category filter">
            ✕ Clear
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">⚠️</span>
          <span>Failed to load products. Please try again.</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📦</span>
          <h3>No products found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Products pagination">
              <button
                disabled={page === 0}
                onClick={() => { setParam('page', page - 1); window.scrollTo(0,0); }}
                aria-label="Previous page"
              >‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <button
                  key={i}
                  className={i === page ? 'active' : ''}
                  onClick={() => { setParam('page', i); window.scrollTo(0, 0); }}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === page ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => { setParam('page', page + 1); window.scrollTo(0,0); }}
                aria-label="Next page"
              >›</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}