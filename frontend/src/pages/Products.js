// src/pages/Products.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productApi, categoryApi } from '../api/client';
import ProductCard from '../components/ProductCard';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SORT_OPTIONS = [
  { label: 'Relevance',          value: 'createdAt,desc' },
  { label: 'Price: Low → High',  value: 'price,asc' },
  { label: 'Price: High → Low',  value: 'price,desc' },
  { label: 'Top Rated',          value: 'averageRating,desc' },
  { label: 'Newest First',       value: 'createdAt,desc' },
  { label: 'Popularity',         value: 'totalSold,desc' },
];

const RATING_OPTIONS = [
  { label: '4★ & above', value: 4 },
  { label: '3★ & above', value: 3 },
  { label: '2★ & above', value: 2 },
];

const PRICE_RANGES = [
  { label: 'Under ₹1,000',         min: 0,      max: 1000 },
  { label: '₹1,000 – ₹5,000',     min: 1000,   max: 5000 },
  { label: '₹5,000 – ₹10,000',    min: 5000,   max: 10000 },
  { label: '₹10,000 – ₹50,000',   min: 10000,  max: 50000 },
  { label: '₹50,000 – ₹1,00,000', min: 50000,  max: 100000 },
  { label: 'Above ₹1,00,000',      min: 100000, max: 9999999 },
];

const DISCOUNT_OPTIONS = [10, 20, 30, 40, 50];
const PAGE_SIZE = 20;

function SkeletonGrid({ count = 12 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

function StarIcon({ filled }) {
  return <span style={{ color: filled ? '#f5a623' : '#303058', fontSize: '0.85rem' }}>★</span>;
}

function AccordionSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sidebar__section">
      <button className="sidebar__section-header" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="sidebar__section-title">{title}</span>
        <span className="sidebar__section-chevron" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && <div className="sidebar__options">{children}</div>}
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loaderRef = useRef(null);

  const catId     = searchParams.get('cat') || '';
  const sort      = searchParams.get('sort') || 'createdAt,desc';
  const minRating = parseInt(searchParams.get('rating') || '0');
  const priceKey  = searchParams.get('price') || '';
  const inStock   = searchParams.get('inStock') === 'true';
  const discountRaw = searchParams.get('discount') || '';
  const discounts   = discountRaw ? discountRaw.split(',').map(Number) : [];
  const minDiscount = discounts.length > 0 ? Math.min(...discounts) : 0;

  const setParam = (key, val) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      if (val === '' || val === null || val === false) n.delete(key);
      else n.set(key, val);
      return n;
    });
  };

  const toggleDiscount = (d) => {
    const current = discountRaw ? discountRaw.split(',').map(Number) : [];
    const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
    setParam('discount', next.length ? next.sort((a, b) => a - b).join(',') : '');
  };

  const clearAllFilters = () => setSearchParams({ sort: 'createdAt,desc' });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
    staleTime: Infinity,
  });

  useDocumentTitle('Products');

  const [sortBy, sortDir] = sort.split(',');
  const selectedRange = PRICE_RANGES.find((_, i) => String(i) === priceKey);
  const filters = {
    minPrice: selectedRange?.min,
    maxPrice: selectedRange?.max,
    minRating: minRating || undefined,
    inStock: inStock || undefined,
  };

  // ── Infinite scroll query ──────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['products-infinite', catId, sortBy, sortDir, priceKey, minRating, inStock],
    queryFn: ({ pageParam = 0 }) =>
      catId
        ? productApi.getByCategory(catId, pageParam, filters)
        : productApi.getAll(pageParam, PAGE_SIZE, sortBy, sortDir, filters),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage?.totalPages;
      const nextPage = allPages.length;
      if (totalPages != null) return nextPage < totalPages ? nextPage : undefined;
      // If backend doesn't return totalPages, keep fetching if last page was full
      const items = lastPage?.content || (Array.isArray(lastPage) ? lastPage : []);
      return items.length === PAGE_SIZE ? nextPage : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Flatten all pages
  const allProducts = (data?.pages || []).flatMap(page =>
    page?.content || (Array.isArray(page) ? page : [])
  );

  // Client-side filter
  const products = allProducts.filter(p => {
    if (minRating && (p.averageRating || 0) < minRating) return false;
    if (selectedRange) {
      const price = Number(p.price);
      if (price < selectedRange.min || price > selectedRange.max) return false;
    }
    if (inStock && p.stockQuantity != null && p.stockQuantity <= 0) return false;
    if (minDiscount > 0) {
      const disc = p.discountPercent
        ? p.discountPercent
        : p.originalPrice && p.price < p.originalPrice
          ? (1 - p.price / p.originalPrice) * 100 : 0;
      if (disc < minDiscount) return false;
    }
    return true;
  });

  const totalElements = data?.pages?.[0]?.totalElements ?? products.length;
  const cats = Array.isArray(categories) ? categories : categories?.content || [];
  const activeFilterCount = [catId, minRating > 0, priceKey, inStock, discountRaw].filter(Boolean).length;

  // ── Intersection Observer for infinite scroll ──────────────
  const handleObserver = useCallback(entries => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1, rootMargin: '200px' });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const Sidebar = () => (
    <aside className="products-sidebar">
      <div className="sidebar__header">
        <span className="sidebar__title">Filters</span>
        {activeFilterCount > 0 && (
          <button className="sidebar__clear" onClick={clearAllFilters}>Clear All ({activeFilterCount})</button>
        )}
      </div>

      <AccordionSection title="Category">
        <label className="sidebar__option">
          <input type="radio" name="category" checked={catId === ''} onChange={() => setParam('cat', '')} />
          <span>All Categories</span>
        </label>
        {cats.map(c => (
          <label key={c.id} className="sidebar__option">
            <input type="radio" name="category" checked={catId === String(c.id)} onChange={() => setParam('cat', c.id)} />
            <span>{c.name}</span>
          </label>
        ))}
      </AccordionSection>

      <AccordionSection title="Price Range">
        <label className="sidebar__option">
          <input type="radio" name="price" checked={priceKey === ''} onChange={() => setParam('price', '')} />
          <span>Any Price</span>
        </label>
        {PRICE_RANGES.map((r, i) => (
          <label key={i} className="sidebar__option">
            <input type="radio" name="price" checked={priceKey === String(i)} onChange={() => setParam('price', priceKey === String(i) ? '' : i)} />
            <span>{r.label}</span>
          </label>
        ))}
      </AccordionSection>

      <AccordionSection title="Customer Rating">
        <label className="sidebar__option">
          <input type="radio" name="rating" checked={minRating === 0} onChange={() => setParam('rating', 0)} />
          <span>Any Rating</span>
        </label>
        {RATING_OPTIONS.map(r => (
          <label key={r.value} className="sidebar__option">
            <input type="radio" name="rating" checked={minRating === r.value} onChange={() => setParam('rating', minRating === r.value ? 0 : r.value)} />
            <span className="sidebar__rating">
              {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < r.value} />)}
              {' '}& above
            </span>
          </label>
        ))}
      </AccordionSection>

      <AccordionSection title="Availability" defaultOpen={false}>
        <label className="sidebar__option">
          <input type="checkbox" checked={inStock} onChange={e => setParam('inStock', e.target.checked ? 'true' : '')} />
          <span>In Stock Only</span>
        </label>
      </AccordionSection>

      <AccordionSection title="Min. Discount" defaultOpen={false}>
        {DISCOUNT_OPTIONS.map(d => (
          <label key={d} className="sidebar__option">
            <input type="checkbox" checked={discounts.includes(d)} onChange={() => toggleDiscount(d)} />
            <span>{d}% or more</span>
          </label>
        ))}
      </AccordionSection>
    </aside>
  );

  return (
    <div className="products-page-wrap">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-drawer" onClick={e => e.stopPropagation()}>
            <button className="sidebar-drawer__close" onClick={() => setSidebarOpen(false)}>✕</button>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="container">
        <div className="products-layout">
          <div className="products-sidebar-wrap"><Sidebar /></div>

          <div className="products-main">
            <div className="products-topbar">
              <div className="products-topbar__left">
                <button className="btn btn-ghost btn-sm filter-toggle-btn" onClick={() => setSidebarOpen(true)} aria-label="Open filters">
                  ⚙ Filters {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                </button>
                <span className="products-count">
                  Showing <strong>{products.length}</strong>
                  {totalElements > 0 && <> of <strong>{totalElements}</strong></>} products
                </span>
              </div>
              <div className="products-topbar__right">
                <span className="sort-label">Sort by:</span>
                <div className="sort-pills">
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} className={`sort-pill ${sort === o.value ? 'sort-pill--active' : ''}`} onClick={() => setParam('sort', o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <select className="form-input sort-select" value={sort} onChange={e => setParam('sort', e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="active-filters">
                {catId && cats.find(c => String(c.id) === catId) && (
                  <span className="filter-chip">{cats.find(c => String(c.id) === catId)?.name}<button onClick={() => setParam('cat', '')}>✕</button></span>
                )}
                {selectedRange && (
                  <span className="filter-chip">{selectedRange.label}<button onClick={() => setParam('price', '')}>✕</button></span>
                )}
                {minRating > 0 && (
                  <span className="filter-chip">{minRating}★ & above<button onClick={() => setParam('rating', 0)}>✕</button></span>
                )}
                {inStock && (
                  <span className="filter-chip">In Stock<button onClick={() => setParam('inStock', '')}>✕</button></span>
                )}
                {discounts.map(d => (
                  <span key={d} className="filter-chip">{d}% off<button onClick={() => toggleDiscount(d)}>✕</button></span>
                ))}
                <button className="clear-all-chip" onClick={clearAllFilters}>Clear All</button>
              </div>
            )}

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
                <button className="btn btn-primary" onClick={clearAllFilters}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loaderRef} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
                  {isFetchingNextPage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '.85rem' }}>
                      <div className="page-loader__spinner" style={{ width: '20px', height: '20px' }} />
                      Loading more products…
                    </div>
                  )}
                  {!hasNextPage && products.length > 0 && (
                    <div style={{ color: 'var(--muted)', fontSize: '.82rem' }}>✓ All products loaded</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
