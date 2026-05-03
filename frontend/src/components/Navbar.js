// frontend/src/components/Navbar.js  — FULL REPLACEMENT
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { productApi } from '../api/client';

export default function Navbar() {
  const { user, logout }      = useAuth();
  const { itemCount }         = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate              = useNavigate();
  const location              = useLocation();

  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  // ── Cart badge pop animation ───────────────────────────────
  const [badgePop, setBadgePop]       = useState(false);
  const prevCountRef                  = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 400);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const menuRef     = useRef(null);

  useEffect(() => { setShowSug(false); setMenuOpen(false); }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (prefix) => {
    if (!prefix || prefix.length < 2) { setSuggestions([]); return; }
    try {
      const data = await productApi.getSuggestions(prefix);
      setSuggestions(Array.isArray(data) ? data.slice(0, 7) : []);
    } catch { setSuggestions([]); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSug(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      inputRef.current?.blur();
    }
  };

  const pickSuggestion = (s) => {
    setQuery(s); setShowSug(false);
    navigate(`/search?q=${encodeURIComponent(s)}`);
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="container navbar__inner">
          {/* Brand */}
          <Link to="/" className="navbar__brand" aria-label="ShopWave home">
            <div className="navbar__brand-icon" aria-hidden="true">⬡</div>
            ShopWave
          </Link>

          {/* Search */}
          <form className="navbar__search" onSubmit={handleSearch} role="search">
            <span className="navbar__search-icon" aria-hidden="true">🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSug(true); }}
              onFocus={() => query.length >= 2 && setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="Search products, brands…"
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={showSug && suggestions.length > 0}
              aria-controls="search-suggestions"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="navbar__search-clear"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                aria-label="Clear search"
              >✕</button>
            )}
            {showSug && suggestions.length > 0 && (
              <div className="navbar__suggestions" id="search-suggestions" role="listbox" aria-label="Search suggestions">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="navbar__suggestion-item"
                    role="option"
                    aria-selected="false"
                    onMouseDown={() => pickSuggestion(s)}
                  >
                    <span style={{ color: 'var(--muted)', fontSize: '.8rem' }} aria-hidden="true">🔍</span>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* Actions */}
          <div className="navbar__actions">
            <Link to="/products" className="btn btn-ghost btn-sm nav-hide">Products</Link>

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="theme-toggle__icon">{isDark ? '☀️' : '🌙'}</span>
            </button>

            {/* Cart with animated badge */}
            <Link
              to="/cart"
              className="btn btn-ghost btn-sm navbar__cart-btn"
              aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            >
              🛒
              {itemCount > 0 && (
                <span
                  className={`navbar__cart-badge${badgePop ? ' navbar__cart-badge--pop' : ''}`}
                  aria-hidden="true"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link to="/orders" className="btn btn-ghost btn-sm nav-hide">Orders</Link>
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMenuOpen(v => !v)}
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    aria-label={`Account menu for ${user.firstName || user.email}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.35rem' }}
                  >
                    <div className="navbar__avatar" aria-hidden="true">
                      {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="navbar__dropdown" role="menu" aria-label="Account options">
                      <div className="navbar__dropdown-header">
                        <div className="navbar__dropdown-name">{user.firstName} {user.lastName}</div>
                        <div className="navbar__dropdown-role">{user.role}</div>
                      </div>
                      <Link to="/orders" className="navbar__suggestion-item" role="menuitem">📦 My Orders</Link>
                      <div
                        className="navbar__suggestion-item"
                        style={{ color: 'var(--red)' }}
                        onClick={logout}
                        role="menuitem"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && logout()}
                        aria-label="Sign out"
                      >
                        🚪 Sign Out
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm nav-hide">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link to="/" className={`bottom-nav__item${location.pathname === '/' ? ' bottom-nav__item--active' : ''}`}>
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/search" className={`bottom-nav__item${location.pathname === '/search' ? ' bottom-nav__item--active' : ''}`}>
          <span>🔍</span>
          <span>Search</span>
        </Link>
        <Link to="/cart" className={`bottom-nav__item${location.pathname === '/cart' ? ' bottom-nav__item--active' : ''}`} aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}>
          <span style={{ position: 'relative', display: 'inline-block' }}>
            🛒
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -8,
                background: 'var(--accent)', color: '#000',
                fontSize: '.55rem', fontWeight: 800,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{itemCount > 9 ? '9+' : itemCount}</span>
            )}
          </span>
          <span>Cart</span>
        </Link>
        <Link to="/orders" className={`bottom-nav__item${location.pathname === '/orders' ? ' bottom-nav__item--active' : ''}`}>
          <span>📦</span>
          <span>Orders</span>
        </Link>
      </nav>

      {/* ── Cart badge pop + bottom-nav styles ── */}
      <style>{`
        @keyframes cartPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .navbar__cart-badge--pop { animation: cartPop .38s ease; }

        .bottom-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: .4rem 0 .6rem;
          z-index: 200;
          box-shadow: 0 -2px 16px rgba(0,0,0,.12);
        }
        @media (max-width: 600px) {
          .bottom-nav { display: flex; justify-content: space-around; }
          #main-content { padding-bottom: 4.5rem; }
        }
        .bottom-nav__item {
          display: flex; flex-direction: column; align-items: center;
          gap: .18rem; font-size: .62rem; font-weight: 600;
          color: var(--muted); text-decoration: none;
          padding: .25rem .5rem;
          transition: color .15s;
        }
        .bottom-nav__item span:first-child { font-size: 1.2rem; }
        .bottom-nav__item--active { color: var(--accent); }
      `}</style>
    </>
  );
}
