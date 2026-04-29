import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar     from './components/Navbar';
import Home       from './pages/Home';
import Products   from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart       from './pages/Cart';
import Checkout   from './pages/Checkout';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Orders     from './pages/Orders';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/products"      element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/cart"          element={<PrivateRoute><Cart /></PrivateRoute>} />
        <Route path="/checkout"      element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/orders"        element={<PrivateRoute><Orders /></PrivateRoute>} />
      </Routes>
    </>
  );
}