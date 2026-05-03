import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productApi } from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]       = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const menuRef     = useRef(null);

  // FE-2a: close dropdown on route change
  useEffect(() => { setShowSug(false); setMenuOpen(false); }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
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
            <div
              className="navbar__suggestions"
              id="search-suggestions"
              role="listbox"
              aria-label="Search suggestions"
            >
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

          {/* Cart */}
          <Link to="/cart" className="btn btn-ghost btn-sm navbar__cart-btn" aria-label={`Cart, ${itemCount} item${itemCount !== 1 ? 's' : ''}`}>
            🛒
            {itemCount > 0 && (
              <span className="navbar__cart-badge" aria-hidden="true">
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
  );
}