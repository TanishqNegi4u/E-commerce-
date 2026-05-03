// frontend/src/App.js  — FULL REPLACEMENT
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { setLogoutHandler } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthLogoutWirer() {
  const { logout } = useAuth();
  useEffect(() => {
    setLogoutHandler(logout);
    return () => setLogoutHandler(null);
  }, [logout]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// ── Lazy page imports ──────────────────────────────────────────
const Home          = React.lazy(() => import('./pages/Home'));
const Products      = React.lazy(() => import('./pages/Products'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Search        = React.lazy(() => import('./pages/Search'));
const Cart          = React.lazy(() => import('./pages/Cart'));
const Checkout      = React.lazy(() => import('./pages/Checkout'));   // ← NEW
const Orders        = React.lazy(() => import('./pages/Orders'));
const Login         = React.lazy(() => import('./pages/Login'));
const Register      = React.lazy(() => import('./pages/Register'));

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__code">404</div>
      <p className="not-found__msg">Page not found</p>
      <a href="/" className="btn btn-primary">Go Home</a>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" aria-label="Loading page" />
      <span className="page-loader__text">loading…</span>
    </div>
  );
}

// ── Back-to-top button ─────────────────────────────────────────
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 200,
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--accent)', border: 'none', cursor: 'pointer',
        fontSize: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform .2s, opacity .2s',
      }}
    >
      ↑
    </button>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <AuthLogoutWirer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--surface2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '.88rem',
                  },
                  success: { iconTheme: { primary: '#00d68f', secondary: '#000' } },
                  error:   { iconTheme: { primary: '#ff4d6d', secondary: '#000' } },
                }}
              />
              <Navbar />
              <main id="main-content">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"            element={<ErrorBoundary key="/"><Home /></ErrorBoundary>} />
                    <Route path="/products"    element={<ErrorBoundary key="/products"><Products /></ErrorBoundary>} />
                    <Route path="/product/:id" element={<ErrorBoundary key="/product"><ProductDetail /></ErrorBoundary>} />
                    <Route path="/search"      element={<ErrorBoundary key="/search"><Search /></ErrorBoundary>} />
                    <Route path="/cart"        element={<ProtectedRoute><ErrorBoundary key="/cart"><Cart /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/checkout"    element={<ProtectedRoute><ErrorBoundary key="/checkout"><Checkout /></ErrorBoundary></ProtectedRoute>} />  {/* ← NEW */}
                    <Route path="/orders"      element={<ProtectedRoute><ErrorBoundary key="/orders"><Orders /></ErrorBoundary></ProtectedRoute>} />
                    <Route path="/login"       element={<Login />} />
                    <Route path="/register"    element={<Register />} />
                    <Route path="*"            element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <BackToTop />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
