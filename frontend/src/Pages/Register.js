import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Register() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn) { navigate(from, { replace: true }); return null; }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password) {
      setError('First name, email and password are required.');
      return;
    }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      toast.success('Account created! Welcome to ShopWave 🎉');
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo" aria-hidden="true">⬡</div>
        <h2>Create account</h2>
        <p className="auth-card__sub">Join ShopWave — it's free</p>

        {error && (
          <div className="error-banner" role="alert" style={{ marginBottom: '1rem' }}>
            <span className="error-banner__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="auth-card__form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First name</label>
              <input id="firstName" type="text" className="form-input" value={form.firstName} onChange={set('firstName')} placeholder="Alex" autoComplete="given-name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last name</label>
              <input id="lastName" type="text" className="form-input" value={form.lastName} onChange={set('lastName')} placeholder="Smith" autoComplete="family-name" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="form-input" value={form.password} onChange={set('password')} placeholder="Min 8 characters" autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" autoComplete="tel" />
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '.85rem', fontSize: '1rem', marginTop: '.25rem' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>

        <div className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" state={{ from: location.state?.from }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}