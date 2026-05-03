import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn) { navigate(from, { replace: true }); return null; }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo" aria-hidden="true">⬡</div>
        <h2>Welcome back</h2>
        <p className="auth-card__sub">Sign in to your ShopWave account</p>

        {error && (
          <div className="error-banner" role="alert" style={{ marginBottom: '1rem' }}>
            <span className="error-banner__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="auth-card__form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" className="form-input"
              value={form.email} onChange={set('email')}
              placeholder="you@example.com" autoComplete="email"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" className="form-input"
              value={form.password} onChange={set('password')}
              placeholder="••••••••" autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '.85rem', fontSize: '1rem', marginTop: '.25rem' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>

        <div className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" state={{ from: location.state?.from }}>Create one</Link>
        </div>
      </div>
    </div>
  );
}