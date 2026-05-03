import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { setLogoutHandler } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min
      retry: 1,
    },
  },
});

// IMP-6 FIX: Wires the logout function from AuthContext into the API client
// so that 401 responses trigger automatic logout + redirect to /login.
function AuthLogoutWirer() {
  const { logout } = useAuth();
  useEffect(() => {
    setLogoutHandler(logout);
    return () => setLogoutHandler(null);
  }, [logout]);
  return null;
}

// FE-2 FIX: Protected route component
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// React.lazy — code splitting: each page is its own chunk
const Home          = React.lazy(() => import('./pages/Home'));
const Products      = React.lazy(() => import('./pages/Products'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Search        = React.lazy(() => import('./pages/Search'));
const Cart          = React.lazy(() => import('./pages/Cart'));
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* IMP-1 FIX: key={location.pathname} resets ErrorBoundary on navigation */}
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
                  <Route path="/orders"      element={<ProtectedRoute><ErrorBoundary key="/orders"><Orders /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/login"       element={<Login />} />
                  <Route path="/register"    element={<Register />} />
                  <Route path="*"            element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}