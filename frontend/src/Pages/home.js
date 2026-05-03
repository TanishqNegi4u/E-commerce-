import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/client';
import ProductCard from '../components/ProductCard';
import DSAPanel from '../components/DSAPanel';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORIES = [
  { name: 'Mobiles',  icon: '📱', q: 'mobile' },
  { name: 'Laptops',  icon: '💻', q: 'laptop' },
  { name: 'Audio',    icon: '🎧', q: 'headphones' },
  { name: 'Gaming',   icon: '🎮', q: 'gaming' },
  { name: 'Fashion',  icon: '👕', q: 'nike' },
  { name: 'Cameras',  icon: '📷', q: 'canon' },
  { name: 'TVs',      icon: '📺', q: 'samsung' },
  { name: 'Watches',  icon: '⌚', q: 'rolex' },
];

const TRUST = [
  { icon: '🚚', title: 'Free Shipping',    sub: 'On orders above ₹500' },
  { icon: '🔒', title: 'Secure Payments',  sub: 'BCrypt + JWT secured' },
  { icon: '↩️', title: 'Easy Returns',     sub: '7-day no-questions return' },
  { icon: '🧠', title: 'Smart Search',     sub: 'Trie-powered autocomplete' },
];

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  useDocumentTitle('Home');

  const { data: featured = [], isLoading: loadingFeat, error: featErr } =
    useQuery({ queryKey: ['featured'], queryFn: productApi.getFeatured });

  const { data: bestsellers = [], isLoading: loadingBest, error: bestErr } =
    useQuery({ queryKey: ['bestsellers'], queryFn: productApi.getBestsellers });

  const normalise = (d) => Array.isArray(d) ? d : d?.content || [];

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__grid" aria-hidden="true" />
        <div className="container" style={{ position: 'relative' }}>
          <div className="hero__badge">⬡ Full-Stack · DSA Powered · FAANG Ready</div>
          <h1>
            Shop the future<br />
            with <em>ShopWave</em>
          </h1>
          <p className="hero__desc">
            Production-grade e-commerce powered by 10 real data structures —
            Trie autocomplete, LRU cache, merge sort, BFS recommendations & more.
          </p>
          <div className="hero__cta">
            <Link to="/products" className="btn btn-primary btn-lg">
              Browse Products
            </Link>
            <a href="#dsa" className="btn btn-ghost btn-lg">
              🧠 See DSA in Code
            </a>
          </div>
          <div className="hero__chips" role="list" aria-label="Tech stack highlights">
            {['10 DSA Structures','Spring Boot 3.2','React 18 + Code-Split','Flyway Migrations','Bucket4j Rate Limiting','Docker + K8s Ready'].map(c => (
              <span key={c} className="hero__chip" role="listitem">{c}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="container page-wrap" style={{ paddingTop: '2.5rem' }}>

        {/* ── CATEGORIES ──────────────────────────────────── */}
        <section className="section" aria-label="Browse by category">
          <div className="categories-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.name}
                className="category-btn"
                onClick={() => navigate(`/search?q=${c.q}`)}
                aria-label={`Browse ${c.name}`}
              >
                <span className="category-btn__icon" aria-hidden="true">{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── DSA PANEL ─────────────────────────────────── */}
        <div id="dsa"><DSAPanel /></div>

        {/* ── FEATURED ──────────────────────────────────── */}
        <section className="section" aria-labelledby="featured-heading">
          <div className="section__header">
            <div className="section__heading-group">
              <h2 className="section__title" id="featured-heading">Featured Products</h2>
              <span className="section__badge">Staff Picks</span>
            </div>
            <Link to="/products" className="section__link" aria-label="View all products">View all →</Link>
          </div>
          {/* FE-3 FIX: proper error state */}
          {featErr ? (
            <div className="error-banner" role="alert">
              <span className="error-banner__icon">⚠️</span>
              <span>Could not load featured products. Check your connection.</span>
            </div>
          ) : loadingFeat ? <SkeletonGrid count={8} /> : (
            normalise(featured).length > 0
              ? <div className="product-grid">{normalise(featured).slice(0,8).map(p => <ProductCard key={p.id} product={p} />)}</div>
              : <div className="empty-state"><span className="empty-state__icon">📦</span><h3>No products yet</h3></div>
          )}
        </section>

        {/* ── BESTSELLERS ─────────────────────────────────── */}
        <section className="section" aria-labelledby="bestsellers-heading">
          <div className="section__header">
            <div className="section__heading-group">
              <h2 className="section__title" id="bestsellers-heading">Bestsellers</h2>
              <span className="section__badge">🔥 Trending</span>
            </div>
            <Link to="/products" className="section__link">View all →</Link>
          </div>
          {bestErr ? (
            <div className="error-banner" role="alert">
              <span className="error-banner__icon">⚠️</span>
              <span>Could not load bestsellers.</span>
            </div>
          ) : loadingBest ? <SkeletonGrid count={8} /> : (
            normalise(bestsellers).length > 0
              ? <div className="product-grid">{normalise(bestsellers).slice(0,8).map(p => <ProductCard key={p.id} product={p} />)}</div>
              : <div className="empty-state"><span className="empty-state__icon">📊</span><h3>No bestsellers yet</h3></div>
          )}
        </section>

        {/* ── TRUST STRIP ─────────────────────────────────── */}
        <section className="trust-strip" aria-label="Why shop with us">
          {TRUST.map(t => (
            <div key={t.title} className="trust-item">
              <div className="trust-item__icon" aria-hidden="true">{t.icon}</div>
              <div className="trust-item__title">{t.title}</div>
              <div className="trust-item__sub">{t.sub}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}